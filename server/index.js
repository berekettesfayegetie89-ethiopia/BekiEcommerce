require('express-async-errors');
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { sequelize, testConnection } = require('./db/connection');
require('./models/index');

const app = express();

// Chapa webhook needs raw body — register BEFORE express.json()
app.use('/api/payment/chapa/webhook', express.raw({ type: '*/*' }));

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/payment',  require('./routes/payment'));   // ← Ethiopian payments

const { userRouter, wishlistRouter, couponRouter, adminRouter } = require('./routes/all');
app.use('/api/users',    userRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/coupons',  couponRouter);
app.use('/api/admin',    adminRouter);

app.get('/health', (_, res) => res.json({
  status: 'ok', db: 'PostgreSQL', app: 'BEKI Shop v4',
  payments: ['Chapa (Telebirr · CBEBirr · M-Pesa · Amole · Card)', 'COD'],
}));
app.use(require('./middleware/errorHandler'));

const start = async () => {
  await testConnection();
  await sequelize.sync({ alter: true });   // auto-adds new Chapa columns
  console.log('✅  Database tables synced');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅  BEKI Shop v4 running on http://localhost:${PORT}`));
};

start().catch(err => { console.error('❌ Startup error:', err.message); process.exit(1); });
