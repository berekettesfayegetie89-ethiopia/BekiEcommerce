const express = require('express');
const router = express.Router();
const { Cart, CartItem, Product } = require('../models/index');
const { protect } = require('../middleware/auth');

const getCart = (userId) => Cart.findOne({ where: { userId }, include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }] });
const populateCart = (cartId) => Cart.findOne({ where: { id: cartId }, include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }] });

router.get('/', protect, async (req, res) => {
  let cart = await getCart(req.user.id);
  if (!cart) { cart = await Cart.create({ userId: req.user.id }); cart.items = []; }
  res.json(cart);
});

router.post('/', protect, async (req, res) => {
  const { productId, quantity = 1, selectedVariant } = req.body;
  const product = await Product.findByPk(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });
  let cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) cart = await Cart.create({ userId: req.user.id });
  const existing = await CartItem.findOne({ where: { cartId: cart.id, productId } });
  if (existing) await existing.update({ quantity: existing.quantity + quantity });
  else await CartItem.create({ cartId: cart.id, productId, quantity, selectedVariant });
  res.json(await populateCart(cart.id));
});

router.put('/:itemId', protect, async (req, res) => {
  const item = await CartItem.findByPk(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const cart = await Cart.findByPk(item.cartId);
  if (cart.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
  if (req.body.quantity <= 0) await item.destroy();
  else await item.update({ quantity: req.body.quantity });
  res.json(await populateCart(cart.id));
});

router.delete('/:itemId', protect, async (req, res) => {
  const item = await CartItem.findByPk(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const cart = await Cart.findByPk(item.cartId);
  if (cart.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
  await item.destroy();
  res.json(await populateCart(cart.id));
});

router.delete('/', protect, async (req, res) => {
  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
