const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId } = require('../utils/query');

exports.list = asyncHandler(async (req, res) => {
  res.json({ success: true, categories: await Category.find().sort({ name: 1 }) });
});

exports.get = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'category id');
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, category });
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, category: await Category.create(req.body) });
});

exports.update = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'category id');
  const category = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, category });
});

exports.remove = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'category id');
  if (await Product.exists({ category: req.params.id, isActive: true })) {
    throw new AppError('Cannot delete a category that still has active products', 409);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, message: 'Category deleted' });
});
