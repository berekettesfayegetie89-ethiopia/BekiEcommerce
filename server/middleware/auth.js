// ─── auth.js ──────────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password','passwordResetToken','passwordResetExpires'] } });
  if (!user) return res.status(401).json({ message: 'User not found' });
  req.user = user;
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user?.isAdmin) return next();
  res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, isAdmin };
