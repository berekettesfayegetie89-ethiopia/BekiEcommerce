const jwt  = require('jsonwebtoken');
const { User } = require('../models/index');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not logged in. Please sign in to continue.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password','passwordResetToken','passwordResetExpires'] },
    });
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });

    req.user = user;
    next();
  } catch (err) {
    // Covers JsonWebTokenError, TokenExpiredError, etc.
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired — please sign in again.'
      : 'Invalid session — please sign in again.';
    return res.status(401).json({ message: msg });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.isAdmin) return next();
  res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, isAdmin };
