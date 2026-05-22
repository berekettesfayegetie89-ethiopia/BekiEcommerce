const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url} — ${err.message}`);
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError')
    return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
  if (err.name === 'SequelizeDatabaseError')
    return res.status(400).json({ message: 'Database error: ' + err.message });
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired, please login again' });
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
};
module.exports = errorHandler;
