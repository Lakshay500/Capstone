const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccess } = require('../utils/tokens');

exports.authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = verifyAccess(token);
  } catch (e) {
    throw new AppError('Invalid or expired access token', 401);
  }
  const user = await User.findById(payload.sub).select('name email role isActive');
  if (!user || !user.isActive) throw new AppError('Account not found or disabled', 401);
  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('You do not have permission to perform this action', 403));
