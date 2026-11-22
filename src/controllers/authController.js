const bcrypt = require('bcrypt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { issuePair, verifyRefresh, hash } = require('../utils/tokens');

const DUMMY_HASH = bcrypt.hashSync('dummy-password', parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  const user = await User.create({ name, email, password, role });
  const tokens = await issuePair(user);
  res.status(201).json({ success: true, user, ...tokens });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  const ok = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
  if (!user || !ok) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account is disabled', 403);
  const tokens = await issuePair(user);
  res.json({ success: true, user, ...tokens });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch (e) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  const h = hash(refreshToken);
  const user = await User.findOne({ _id: payload.sub, 'refreshTokens.tokenHash': h });
  if (!user) {
    await User.updateOne({ _id: payload.sub }, { $set: { refreshTokens: [] } });
    throw new AppError('Refresh token reuse detected; please log in again', 401);
  }
  await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: { tokenHash: h } } });
  const tokens = await issuePair(user);
  res.json({ success: true, ...tokens });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: { tokenHash: hash(refreshToken) } } });
  res.json({ success: true, message: 'Logged out' });
});
