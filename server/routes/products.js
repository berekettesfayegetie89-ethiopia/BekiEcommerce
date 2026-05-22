const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Review, User } = require('../models/index');
const { protect, isAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { upload, cloudinary } = require('../utils/cloudinary');

router.get('/', async (req, res) => {
  const { category, sort, search, page = 1, limit = 16, featured, flashSale, minPrice, maxPrice } = req.query;
  const where = {};
  if (category) where.category = category;
  if (featured === 'true') where.isFeatured = true;
  if (flashSale === 'true') { where.isFlashSale = true; where.flashSaleEnds = { [Op.gt]: new Date() }; }
  if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { brand: { [Op.iLike]: `%${search}%` } }];
  if (minPrice || maxPrice) where.price = { ...(minPrice && { [Op.gte]: Number(minPrice) }), ...(maxPrice && { [Op.lte]: Number(maxPrice) }) };
  const sortMap = { price_asc:[['price','ASC']], price_desc:[['price','DESC']], newest:[['createdAt','DESC']], rating:[['rating','DESC']], popular:[['sold','DESC']] };
  const order = sortMap[sort] || [['createdAt','DESC']];
  const offset = (Number(page)-1)*Number(limit);
  const { rows: products, count: total } = await Product.findAndCountAll({ where, order, offset, limit: Number(limit) });
  res.json({ products, total, page: Number(page), pages: Math.ceil(total/Number(limit)) });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: [{ model: Review, as: 'reviews', include: [{ model: User, attributes: ['id','name','avatar'] }], order: [['createdAt','DESC']] }] });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

router.post('/', protect, isAdmin, validate(schemas.product), async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

router.put('/:id', protect, isAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await product.update(req.body);
  res.json(product);
});

router.delete('/:id', protect, isAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.image?.includes('cloudinary.com')) {
    const parts = product.image.split('/');
    await cloudinary.uploader.destroy(`bekishop/products/${parts[parts.length-1].split('.')[0]}`).catch(console.error);
  }
  await product.destroy();
  res.json({ message: 'Product deleted' });
});

router.post('/upload', protect, isAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image provided' });
  res.json({ imageUrl: req.file.path });
});

router.post('/:id/reviews', protect, validate(schemas.review), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const existing = await Review.findOne({ where: { productId: req.params.id, userId: req.user.id } });
  if (existing) return res.status(400).json({ message: 'You already reviewed this product' });
  await Review.create({ ...req.body, productId: req.params.id, userId: req.user.id, userName: req.user.name, isVerifiedPurchase: false });
  const reviews = await Review.findAll({ where: { productId: req.params.id } });
  await product.update({ rating: (reviews.reduce((s,r) => s+r.rating, 0)/reviews.length).toFixed(2), numReviews: reviews.length });
  res.status(201).json({ message: 'Review added' });
});

module.exports = router;
