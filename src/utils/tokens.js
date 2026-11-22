const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

exports.hash = hash;

exports.signAccess = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
  });

exports.verifyAccess = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
exports.verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Creates an access + refresh pair; only a SHA-256 hash of the refresh token is stored in the DB.
exports.issuePair = async (user) => {
  const accessToken = exports.signAccess(user);
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
  );
  const { exp } = jwt.decode(refreshToken);
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { $each: [{ tokenHash: hash(refreshToken), expiresAt: new Date(exp * 1000) }], $slice: -5 } } }
  );
  return { accessToken, refreshToken };
};
