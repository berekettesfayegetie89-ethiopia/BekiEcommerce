const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connection');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ─── USER ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true,
    set(v) { this.setDataValue('email', v.toLowerCase().trim()); } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  phone: { type: DataTypes.STRING(50), allowNull: true },
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  loyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  passwordResetToken: { type: DataTypes.STRING(255), allowNull: true },
  passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users', timestamps: true,
  hooks: {
    beforeSave: async (u) => {
      if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12);
    },
  },
});
User.prototype.matchPassword = async function(pw) { return bcrypt.compare(pw, this.password); };
User.prototype.createPasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  return token;
};
User.prototype.toSafeObject = function() {
  const { password, passwordResetToken, passwordResetExpires, ...safe } = this.toJSON();
  return safe;
};

// ─── PRODUCT ──────────────────────────────────────────────────────────────────
const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false, validate: { min: 0 } },
  originalPrice: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  category: { type: DataTypes.ENUM('Electronics','Clothing','Home','Sports','Books','Beauty','Toys','Automotive'), allowNull: false },
  brand: { type: DataTypes.STRING(100), defaultValue: 'Generic' },
  image: { type: DataTypes.STRING(500), allowNull: false },
  images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  sold: { type: DataTypes.INTEGER, defaultValue: 0 },
  rating: { type: DataTypes.DECIMAL(3,2), defaultValue: 0 },
  numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isFlashSale: { type: DataTypes.BOOLEAN, defaultValue: false },
  flashSalePrice: { type: DataTypes.DECIMAL(10,2), allowNull: true },
  flashSaleEnds: { type: DataTypes.DATE, allowNull: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  variants: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'products', timestamps: true });

// ─── REVIEW ───────────────────────────────────────────────────────────────────
const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  title: { type: DataTypes.STRING(200), allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: false },
  userName: { type: DataTypes.STRING(100), allowNull: false },
  isVerifiedPurchase: { type: DataTypes.BOOLEAN, defaultValue: false },
  helpful: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'reviews', timestamps: true });

// ─── CART ─────────────────────────────────────────────────────────────────────
const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, { tableName: 'carts', timestamps: true });

const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  selectedVariant: { type: DataTypes.JSONB, allowNull: true },
}, { tableName: 'cart_items', timestamps: true });

// ─── ORDER ────────────────────────────────────────────────────────────────────
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  shippingFullName: { type: DataTypes.STRING(100), allowNull: false },
  shippingAddress: { type: DataTypes.STRING(300), allowNull: false },
  shippingCity: { type: DataTypes.STRING(100), allowNull: false },
  shippingPostalCode: { type: DataTypes.STRING(20), allowNull: false },
  shippingCountry: { type: DataTypes.STRING(100), allowNull: false },
  shippingPhone: { type: DataTypes.STRING(30), allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('chapa','telebirr','cbebirr','mpesa','amole','cod'), allowNull: false },
  paymentId: { type: DataTypes.STRING(255), allowNull: true },
  paymentStatus: { type: DataTypes.STRING(50), allowNull: true },
  stripePaymentIntentId: { type: DataTypes.STRING(255), allowNull: true },
  stripeClientSecret: { type: DataTypes.STRING(500), allowNull: true },
  chapaTxRef: { type: DataTypes.STRING(255), allowNull: true },
  chapaCheckoutUrl: { type: DataTypes.STRING(500), allowNull: true },
  totalPriceETB: { type: DataTypes.DECIMAL(12,2), allowNull: true },
  couponCode: { type: DataTypes.STRING(50), allowNull: true },
  discountAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  itemsPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  shippingPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
  taxPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
  totalPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending','processing','shipped','delivered','cancelled','refunded'),
    defaultValue: 'pending',
  },
  isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  deliveredAt: { type: DataTypes.DATE, allowNull: true },
  trackingNumber: { type: DataTypes.STRING(100), allowNull: true },
  trackingUrl: { type: DataTypes.STRING(500), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
  codVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  codVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  codVerifiedBy: { type: DataTypes.STRING(100), allowNull: true },
  refundReason: { type: DataTypes.TEXT, allowNull: true },
  refundedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'orders', timestamps: true });

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productName: { type: DataTypes.STRING(300), allowNull: false },
  productImage: { type: DataTypes.STRING(500), allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  selectedVariant: { type: DataTypes.JSONB, allowNull: true },
}, { tableName: 'order_items', timestamps: false });

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, { tableName: 'wishlists', timestamps: true });

// ─── COUPON ───────────────────────────────────────────────────────────────────
const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('percentage','fixed'), allowNull: false },
  value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  minOrderAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  maxUsage: { type: DataTypes.INTEGER, defaultValue: 100 },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'coupons', timestamps: true });

// ─── ASSOCIATIONS ──────────────────────────────────────────────────────────────
User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });
Wishlist.belongsToMany(Product, { through: 'WishlistProducts', foreignKey: 'wishlistId', as: 'products' });
Product.belongsToMany(Wishlist, { through: 'WishlistProducts', foreignKey: 'productId' });

module.exports = { User, Product, Review, Cart, CartItem, Order, OrderItem, Wishlist, Coupon };
