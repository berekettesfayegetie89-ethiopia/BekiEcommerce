/**
 * ============================================================
 *  BEKISHOP — Orders Route (v4 — Ethiopian Payment Integration)
 *  Supports: Chapa (Telebirr/CBEBirr/M-Pesa/Amole/Card) + COD
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const { Op }  = require('sequelize');
const { Order, OrderItem, Cart, CartItem, Product, User, Coupon } = require('../models/index');
const { protect, isAdmin }   = require('../middleware/auth');
const { validate, schemas }  = require('../middleware/validate');
const { sendEmail, templates } = require('../utils/email');
const { getUSDtoETB }        = require('../utils/exchangeRate');

const CHAPA_METHODS = ['chapa','telebirr','cbebirr','mpesa','amole'];

const populateOrder = (id) => Order.findByPk(id, {
  include: [
    { model: OrderItem, as: 'items',
      include: [{ model: Product, as: 'product', attributes: ['id','name','image'] }] },
    { model: User, attributes: ['id','name','email'] },
  ],
});

// ─── Create Order ─────────────────────────────────────────────────────────────
router.post('/', protect, validate(schemas.order), async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode, notes } = req.body;

  const cart = await Cart.findOne({
    where: { userId: req.user.id },
    include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
  });
  if (!cart?.items?.length) return res.status(400).json({ message: 'Your cart is empty' });

  for (const item of cart.items) {
    if (!item.product)                    return res.status(400).json({ message: 'A product no longer exists' });
    if (item.product.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for "${item.product.name}"` });
  }

  const itemsPrice = parseFloat(cart.items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0).toFixed(2));
  let discountAmount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase(), isActive: true } });
    if (!coupon)                                  return res.status(400).json({ message: 'Invalid or expired coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ message: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUsage)      return res.status(400).json({ message: 'Coupon usage limit reached' });
    if (itemsPrice < Number(coupon.minOrderAmount)) return res.status(400).json({ message: `Minimum order $${coupon.minOrderAmount} required for this coupon` });
    discountAmount = coupon.type === 'percentage'
      ? parseFloat((itemsPrice * Number(coupon.value) / 100).toFixed(2))
      : Math.min(Number(coupon.value), itemsPrice);
    await coupon.increment('usedCount');
  }

  const afterDiscount = Math.max(0, itemsPrice - discountAmount);
  const shippingPrice = afterDiscount >= 100 ? 0 : 9.99;
  const taxPrice      = parseFloat((afterDiscount * 0.08).toFixed(2));
  const totalPrice    = parseFloat((afterDiscount + shippingPrice + taxPrice).toFixed(2));

  // Convert total to ETB for Chapa payments
  let totalPriceETB = null;
  if (CHAPA_METHODS.includes(paymentMethod)) {
    const rate = await getUSDtoETB();
    totalPriceETB = parseFloat((totalPrice * rate).toFixed(2));
  }

  const order = await Order.create({
    userId: req.user.id,
    shippingFullName:    shippingAddress.fullName,
    shippingAddress:     shippingAddress.address,
    shippingCity:        shippingAddress.city,
    shippingPostalCode:  shippingAddress.postalCode,
    shippingCountry:     shippingAddress.country,
    shippingPhone:       shippingAddress.phone,
    paymentMethod, notes,
    couponCode: couponCode?.toUpperCase() || null,
    discountAmount, itemsPrice, shippingPrice, taxPrice, totalPrice, totalPriceETB,
  });

  await Promise.all(cart.items.map(i => OrderItem.create({
    orderId: order.id, productId: i.product.id,
    productName: i.product.name, productImage: i.product.image,
    price: i.product.price, quantity: i.quantity, selectedVariant: i.selectedVariant,
  })));

  await Promise.all(cart.items.map(i =>
    i.product.update({ stock: i.product.stock - i.quantity, sold: i.product.sold + i.quantity })
  ));
  await CartItem.destroy({ where: { cartId: cart.id } });

  const fullOrder = await populateOrder(order.id);
  sendEmail({ to: req.user.email, ...templates.orderConfirmation(fullOrder, req.user) }).catch(console.error);
  res.status(201).json(fullOrder);
});

// ─── Get ETB conversion rate ───────────────────────────────────────────────────
router.get('/etb-rate', protect, async (_req, res) => {
  const rate = await getUSDtoETB();
  res.json({ rate, currency: 'ETB', base: 'USD' });
});

// ─── Admin: all orders ─────────────────────────────────────────────────────────
router.get('/', protect, isAdmin, async (req, res) => {
  const { status, paymentMethod, isPaid, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status)        where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (isPaid !== undefined) where.isPaid = isPaid === 'true';
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: orders, count: total } = await Order.findAndCountAll({
    where, offset, limit: Number(limit),
    include: [{ model: OrderItem, as: 'items' }, { model: User, attributes: ['id','name','email'] }],
    order: [['createdAt','DESC']],
  });
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ─── Get user's orders ─────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, as: 'items' }],
    order: [['createdAt','DESC']],
  });
  res.json(orders);
});

// ─── Get single order ──────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  const order = await populateOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });
  res.json(order);
});

// ─── Admin: update order status ────────────────────────────────────────────────
router.put('/:id/status', protect, isAdmin, async (req, res) => {
  const { status, trackingNumber, trackingUrl, adminNotes } = req.body;
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const update = { status };
  if (trackingNumber) update.trackingNumber = trackingNumber;
  if (trackingUrl)    update.trackingUrl    = trackingUrl;
  if (adminNotes)     update.adminNotes     = adminNotes;
  if (status === 'delivered') update.deliveredAt = new Date();
  await order.update(update);
  const fullOrder = await populateOrder(order.id);
  if (status === 'shipped') {
    const user = await User.findByPk(order.userId);
    if (user) sendEmail({ to: user.email, ...templates.orderShipped(order, user) }).catch(console.error);
  }
  res.json(fullOrder);
});

// ─── Admin: refund ─────────────────────────────────────────────────────────────
router.put('/:id/refund', protect, isAdmin, async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  // Chapa refunds: handled manually via Chapa dashboard for now
  await order.update({ status: 'refunded', refundReason: reason, refundedAt: new Date(), paymentStatus: 'refunded' });
  res.json(await populateOrder(order.id));
});

module.exports = router;
