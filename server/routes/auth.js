const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models/index');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { sendEmail, templates } = require('../utils/email');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', validate(schemas.register), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ where: { email: email.toLowerCase() } })) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password });
  sendEmail({ to: user.email, ...templates.welcome(user) }).catch(console.error);
  res.status(201).json({ token: genToken(user.id), user: user.toSafeObject() });
});

router.post('/login', validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: genToken(user.id), user: user.toSafeObject() });
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

router.put('/profile', protect, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

router.post('/forgot-password', validate(schemas.forgotPassword), async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email.toLowerCase() } });
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });
  const token = user.createPasswordResetToken();
  await user.save();
  try {
    await sendEmail({ to: user.email, ...templates.passwordReset(`${process.env.CLIENT_URL}/reset-password/${token}`) });
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch {
    user.passwordResetToken = null; user.passwordResetExpires = null; await user.save();
    res.status(500).json({ message: 'Email failed. Try again later.' });
  }
});

router.post('/reset-password/:token', validate(schemas.resetPassword), async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ where: { passwordResetToken: hashed } });
  if (!user || user.passwordResetExpires < new Date()) return res.status(400).json({ message: 'Token invalid or expired' });
  user.password = req.body.password; user.passwordResetToken = null; user.passwordResetExpires = null;
  await user.save();
  res.json({ message: 'Password reset successful.' });
});

module.exports = router;
