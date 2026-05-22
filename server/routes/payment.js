/**
 * ============================================================
 *  BEKISHOP — Ethiopian Payment Routes
 *  Integrations: Chapa (Telebirr, CBE Birr, M-Pesa, Amole, Card)
 *  + Cash on Delivery (COD)
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const crypto  = require('crypto');

const { Order, OrderItem, Product, User } = require('../models/index');
const { protect, isAdmin }                = require('../middleware/auth');
const { sendEmail, templates }            = require('../utils/email');

// ── helpers ──────────────────────────────────────────────────────────────────
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;         // sk-live-xxx  or sk-test-xxx
const CHAPA_URL    = 'https://api.chapa.co/v1';
const SERVER_URL   = process.env.SERVER_URL || 'http://localhost:5000';
const CLIENT_URL   = process.env.CLIENT_URL || 'http://localhost:5173';

const populateOrder = (id) => Order.findByPk(id, {
  include: [
    { model: OrderItem, as: 'items',
      include: [{ model: Product, as: 'product', attributes: ['id','name','image'] }] },
    { model: User, attributes: ['id','name','email','phone'] },
  ],
});

/** Verify a Chapa tx_ref hasn't been tampered with using our HMAC */
const signTxRef = (txRef) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET)
        .update(txRef)
        .digest('hex')
        .slice(0, 16);

// ── 1. INITIATE CHAPA PAYMENT ─────────────────────────────────────────────────
/**
 * POST /api/payment/chapa/initiate
 * Body: { orderId }
 *
 * Chapa handles: Telebirr · CBEBirr · M-Pesa · Amole · card — user picks on Chapa's page
 */
router.post('/chapa/initiate', protect, async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ message: 'orderId required' });

  const order = await populateOrder(orderId);
  if (!order)                         return res.status(404).json({ message: 'Order not found' });
  if (order.userId !== req.user.id)   return res.status(403).json({ message: 'Not authorised' });
  if (order.isPaid)                   return res.status(400).json({ message: 'Order already paid' });
  if (!['chapa','telebirr','cbebirr','mpesa','amole'].includes(order.paymentMethod)) {
    return res.status(400).json({ message: 'Not a Chapa-based order' });
  }

  // Idempotent: re-use existing tx_ref if still pending
  if (order.chapaCheckoutUrl) {
    // verify it is still live
    try {
      const verifyRes = await axios.get(
        `${CHAPA_URL}/transaction/verify/${order.chapaTxRef}`,
        { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
      );
      if (verifyRes.data?.data?.status === 'pending') {
        return res.json({ checkoutUrl: order.chapaCheckoutUrl, txRef: order.chapaTxRef });
      }
    } catch { /* tx expired or not found — create a new one */ }
  }

  const txRef   = `BEKI-${orderId.slice(0,8)}-${Date.now()}-${signTxRef(orderId)}`;
  const amountETB = Number(order.totalPriceETB || order.totalPrice).toFixed(2);

  const chapaPayload = {
    amount:           amountETB,
    currency:         'ETB',
    email:            req.user.email,
    first_name:       (order.shippingFullName || req.user.name).split(' ')[0],
    last_name:        (order.shippingFullName || req.user.name).split(' ').slice(1).join(' ') || 'Customer',
    phone_number:     order.shippingPhone || req.user.phone || '0900000000',
    tx_ref:           txRef,
    callback_url:     `${SERVER_URL}/api/payment/chapa/webhook`,
    return_url:       `${CLIENT_URL}/order-success/${orderId}?tx_ref=${txRef}`,
    title:            'BEKI Shop Order',
    description:      `Payment for Order #${orderId.slice(0,8).toUpperCase()}`,
    logo:             `${CLIENT_URL}/logo.png`,
    customization: {
      title:       'BEKI Shop',
      description: `Order #${orderId.slice(0,8).toUpperCase()}`,
    },
  };

  const initRes = await axios.post(
    `${CHAPA_URL}/transaction/initialize`,
    chapaPayload,
    { headers: { Authorization: `Bearer ${CHAPA_SECRET}`, 'Content-Type': 'application/json' } }
  );

  const checkoutUrl = initRes.data?.data?.checkout_url;
  if (!checkoutUrl) {
    return res.status(502).json({ message: 'Chapa did not return a checkout URL', detail: initRes.data });
  }

  await order.update({ chapaTxRef: txRef, chapaCheckoutUrl: checkoutUrl });
  res.json({ checkoutUrl, txRef });
});

// ── 2. CHAPA WEBHOOK (server-to-server — most reliable) ───────────────────────
/**
 * POST /api/payment/chapa/webhook
 * Chapa posts here on every status change.
 * Docs: https://developer.chapa.co/docs/inline/#webhook
 */
router.post('/chapa/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  // Verify Chapa webhook signature (Chapa-Signature header)
  const chapaSignature = req.headers['chapa-signature'] || req.headers['x-chapa-signature'];
  if (process.env.CHAPA_WEBHOOK_SECRET && chapaSignature) {
    const expected = crypto
      .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    if (expected !== chapaSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
  }

  let event;
  try { event = JSON.parse(req.body.toString()); }
  catch { return res.status(400).json({ message: 'Invalid JSON body' }); }

  const { status, tx_ref, trx_ref } = event;

  if (status === 'success' && tx_ref) {
    // Verify independently — never trust the payload alone
    try {
      const verifyRes = await axios.get(
        `${CHAPA_URL}/transaction/verify/${tx_ref}`,
        { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
      );
      const txData = verifyRes.data?.data;

      if (txData?.status === 'success') {
        const order = await Order.findOne({ where: { chapaTxRef: tx_ref } });
        if (order && !order.isPaid) {
          await order.update({
            isPaid: true, paidAt: new Date(), status: 'processing',
            paymentId: trx_ref || txData.id || tx_ref,
            paymentStatus: 'paid',
          });
          const user = await User.findByPk(order.userId);
          const fullOrder = await populateOrder(order.id);
          if (user) {
            sendEmail({ to: user.email, ...templates.paymentConfirmed(fullOrder, user) }).catch(console.error);
          }
        }
      }
    } catch (err) {
      console.error('Chapa webhook verify error:', err.message);
    }
  }

  res.json({ received: true });
});

// ── 3. VERIFY PAYMENT (called from frontend return_url) ───────────────────────
/**
 * GET /api/payment/chapa/verify/:txRef
 * Frontend calls this after Chapa redirects back.
 */
router.get('/chapa/verify/:txRef', protect, async (req, res) => {
  const { txRef } = req.params;

  // Find the order by tx_ref
  const order = await Order.findOne({ where: { chapaTxRef: txRef } });
  if (!order) return res.status(404).json({ message: 'Order not found for this tx_ref' });
  if (order.userId !== req.user.id) return res.status(403).json({ message: 'Not authorised' });

  // Already confirmed (webhook beat us)
  if (order.isPaid) {
    return res.json({ success: true, order: await populateOrder(order.id) });
  }

  // Ask Chapa directly
  const verifyRes = await axios.get(
    `${CHAPA_URL}/transaction/verify/${txRef}`,
    { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } }
  );
  const txData = verifyRes.data?.data;

  if (txData?.status !== 'success') {
    return res.status(400).json({
      success: false,
      message: `Payment not completed. Chapa status: ${txData?.status || 'unknown'}`,
      chapaStatus: txData?.status,
    });
  }

  // All good — mark paid
  await order.update({
    isPaid: true, paidAt: new Date(), status: 'processing',
    paymentId: txData.id || txRef,
    paymentStatus: 'paid',
  });

  const user = await User.findByPk(order.userId);
  const fullOrder = await populateOrder(order.id);
  if (user) sendEmail({ to: user.email, ...templates.paymentConfirmed(fullOrder, user) }).catch(console.error);

  res.json({ success: true, order: fullOrder });
});

// ── 4. ADMIN: VERIFY COD ──────────────────────────────────────────────────────
router.put('/cod/verify/:orderId', protect, isAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order)                    return res.status(404).json({ message: 'Order not found' });
  if (order.paymentMethod !== 'cod') return res.status(400).json({ message: 'Not a COD order' });
  if (order.isPaid)              return res.status(400).json({ message: 'Already marked paid' });

  await order.update({
    isPaid: true, paidAt: new Date(), status: 'delivered',
    codVerified: true, codVerifiedAt: new Date(), codVerifiedBy: req.user.name,
    paymentStatus: 'cod_collected',
  });

  const user = await User.findByPk(order.userId);
  if (user) sendEmail({ to: user.email, ...templates.codVerified(order, user) }).catch(console.error);
  res.json(await populateOrder(order.id));
});

module.exports = router;
