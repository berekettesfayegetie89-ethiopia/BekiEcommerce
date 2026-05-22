// ─── users.js ─────────────────────────────────────────────────────────────────
const express = require("express");
const userRouter = express.Router();
const { Op } = require("sequelize");
const { User } = require("../models/index");
const { protect, isAdmin } = require("../middleware/auth");

userRouter.get("/", protect, isAdmin, async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};
  const offset = (Number(page) - 1) * Number(limit);
  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    offset,
    limit: Number(limit),
    attributes: {
      exclude: ["password", "passwordResetToken", "passwordResetExpires"],
    },
    order: [["createdAt", "DESC"]],
  });
  res.json({
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});
userRouter.get("/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: {
      exclude: ["password", "passwordResetToken", "passwordResetExpires"],
    },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
userRouter.put("/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.update({
    name: req.body.name,
    email: req.body.email,
    isAdmin: req.body.isAdmin,
  });
  res.json(user.toSafeObject());
});
userRouter.delete("/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isAdmin)
    return res.status(400).json({ message: "Cannot delete admin" });
  await user.destroy();
  res.json({ message: "User deleted" });
});
module.exports.userRouter = userRouter;

// ─── wishlist.js ──────────────────────────────────────────────────────────────
const wishlistRouter = express.Router();
const { Wishlist, Product } = require("../models/index");

wishlistRouter.get("/", protect, async (req, res) => {
  let wl = await Wishlist.findOne({
    where: { userId: req.user.id },
    include: [{ model: Product, as: "products" }],
  });
  if (!wl) {
    wl = await Wishlist.create({ userId: req.user.id });
    wl.products = [];
  }
  res.json(wl);
});
wishlistRouter.post("/:productId", protect, async (req, res) => {
  let wl = await Wishlist.findOne({
    where: { userId: req.user.id },
    include: [{ model: Product, as: "products" }],
  });
  if (!wl) {
    wl = await Wishlist.create({ userId: req.user.id });
    wl.products = [];
  }
  const product = await Product.findByPk(req.params.productId);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (wl.products?.some((p) => p.id === req.params.productId))
    return res.status(400).json({ message: "Already in wishlist" });
  await wl.addProduct(product);
  res.json(
    await Wishlist.findOne({
      where: { id: wl.id },
      include: [{ model: Product, as: "products" }],
    }),
  );
});
wishlistRouter.delete("/:productId", protect, async (req, res) => {
  const wl = await Wishlist.findOne({ where: { userId: req.user.id } });
  if (!wl) return res.json({ products: [] });
  const product = await Product.findByPk(req.params.productId);
  if (product) await wl.removeProduct(product);
  res.json(
    await Wishlist.findOne({
      where: { id: wl.id },
      include: [{ model: Product, as: "products" }],
    }),
  );
});
module.exports.wishlistRouter = wishlistRouter;

// ─── coupon.js ────────────────────────────────────────────────────────────────
const couponRouter = express.Router();
const { Coupon } = require("../models/index");
const { validate, schemas } = require("../middleware/validate");

couponRouter.post("/validate", protect, async (req, res) => {
  const { code, orderTotal } = req.body;
  const coupon = await Coupon.findOne({
    where: { code: code.toUpperCase(), isActive: true },
  });
  if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return res.status(400).json({ message: "Coupon has expired" });
  if (coupon.usedCount >= coupon.maxUsage)
    return res.status(400).json({ message: "Coupon usage limit reached" });
  if (orderTotal < Number(coupon.minOrderAmount))
    return res
      .status(400)
      .json({ message: `Minimum order $${coupon.minOrderAmount} required` });
  const discount =
    coupon.type === "percentage"
      ? parseFloat(((orderTotal * Number(coupon.value)) / 100).toFixed(2))
      : Math.min(Number(coupon.value), orderTotal);
  res.json({
    coupon,
    discount,
    finalTotal: Math.max(0, orderTotal - discount),
  });
});

couponRouter.get("/", protect, isAdmin, async (req, res) => {
  res.json(await Coupon.findAll({ order: [["createdAt", "DESC"]] }));
});
couponRouter.post(
  "/",
  protect,
  isAdmin,
  validate(schemas.coupon),
  async (req, res) => {
    res
      .status(201)
      .json(
        await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() }),
      );
  },
);
couponRouter.put("/:id", protect, isAdmin, async (req, res) => {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: "Coupon not found" });
  res.json(await c.update(req.body));
});
couponRouter.delete("/:id", protect, isAdmin, async (req, res) => {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: "Coupon not found" });
  await c.destroy();
  res.json({ message: "Coupon deleted" });
});
module.exports.couponRouter = couponRouter;

// ─── admin.js ─────────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const { fn, col, literal } = require("sequelize");
const { Cart, CartItem, Order, OrderItem } = require("../models/index");

adminRouter.get("/stats", protect, isAdmin, async (req, res) => {
  const [totalUsers, totalProducts, totalOrders] = await Promise.all([
    User.count({ where: { isAdmin: false } }),
    Product.count(),
    Order.count(),
  ]);
  const rev = await Order.findOne({
    where: { isPaid: true },
    attributes: [[fn("SUM", col("totalPrice")), "total"]],
    raw: true,
  });
  const inv = await Product.findOne({
    attributes: [[literal("SUM(price * stock)"), "total"]],
    raw: true,
  });
  const statusCounts = await Order.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    group: ["status"],
    raw: true,
  });
  const paymentStats = await Order.findAll({
    attributes: ["paymentMethod", "isPaid", [fn("COUNT", col("id")), "count"]],
    group: ["paymentMethod", "isPaid"],
    raw: true,
  });
  const sixM = new Date();
  sixM.setMonth(sixM.getMonth() - 6);
  const monthlyRevenue = await Order.findAll({
    where: { isPaid: true, createdAt: { [Op.gte]: sixM } },
    attributes: [
      [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
      [fn("SUM", col("totalPrice")), "revenue"],
      [fn("COUNT", col("id")), "orders"],
    ],
    group: [fn("DATE_TRUNC", "month", col("createdAt"))],
    order: [[fn("DATE_TRUNC", "month", col("createdAt")), "ASC"]],
    raw: true,
  });
  const topProducts = await OrderItem.findAll({
    attributes: [
      "productId",
      "productName",
      "productImage",
      [fn("SUM", col("quantity")), "totalSold"],
      [
        fn("SUM", literal('"OrderItem"."price" * "OrderItem"."quantity"')),
        "revenue",
      ],
    ],
    group: ["productId", "productName", "productImage"],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit: 5,
    raw: true,
  });
  const totalCarts = await Cart.count({
    include: [{ model: CartItem, as: "items", required: true }],
  });
  const pendingCOD = await Order.count({
    where: {
      paymentMethod: "cod",
      isPaid: false,
      status: { [Op.ne]: "cancelled" },
    },
  });
  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    revenue: Number(rev?.total || 0),
    inventoryValue: Number(inv?.total || 0),
    statusCounts,
    paymentStats,
    monthlyRevenue,
    topProducts,
    totalCarts,
    pendingCOD,
  });
});

adminRouter.get("/carts", protect, isAdmin, async (req, res) => {
  const carts = await Cart.findAll({
    include: [
      { model: User, attributes: ["id", "name", "email"] },
      {
        model: CartItem,
        as: "items",
        required: true,
        include: [{ model: Product, as: "product" }],
      },
    ],
  });
  res.json(carts);
});

module.exports.adminRouter = adminRouter;
