const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId, parsePagination } = require('../utils/query');

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: await User.findById(req.user._id) });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (req.body.name) user.name = req.body.name;
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json({ success: true, user });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const [total, users] = await Promise.all([User.countDocuments(filter), User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)]);
  res.json({ success: true, total, page, totalPages: Math.ceil(total / limit), users });
});

exports.updateUserByAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'user id');
  const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});
