const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const bus = require('../events/eventBus');
const { assertObjectId, parsePagination, parseSort } = require('../utils/query');

// Sellers may touch only their own products; admins may touch all
const assertOwnerOrAdmin = (product, user) => {
  if (user.role !== 'admin' && String(product.seller) !== String(user._id)) {
    throw new AppError('You can only modify your own products', 403);
  }
};

// GET /api/products?q=&category=&seller=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=   (public)
exports.list = asyncHandler(async (req, res) => {
  const { q, category, seller, minPrice, maxPrice, inStock } = req.query;
  const filter = { isActive: true };
  if (q) filter.$text = { $search: String(q) };
  if (category) { assertObjectId(category, 'category'); filter.category = category; }
  if (seller) { assertObjectId(seller, 'seller'); filter.seller = seller; }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) { if (isNaN(minPrice)) throw new AppError('minPrice must be a number', 400); filter.price.$gte = Number(minPrice); }
    if (maxPrice !== undefined) { if (isNaN(maxPrice)) throw new AppError('maxPrice must be a number', 400); filter.price.$lte = Number(maxPrice); }
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };

  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['name', 'price', 'stock', 'createdAt']);
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name').populate('seller', 'name').lean(),
  ]);
  res.json({ success: true, total, page, totalPages: Math.ceil(total / limit), count: products.length, products });
});

exports.get = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('category', 'name').populate('seller', 'name');
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, product });
});

// POST /api/products  (seller or admin)
exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  assertObjectId(data.category, 'category');
  if (!(await Category.exists({ _id: data.category }))) throw new AppError('Category does not exist', 400);

  if (req.user.role === 'admin' && data.seller) {
    assertObjectId(data.seller, 'seller');
    if (!(await User.exists({ _id: data.seller, role: 'seller' }))) throw new AppError('seller must be an existing seller account', 400);
  } else {
    data.seller = req.user._id; // sellers can never create products for someone else
  }
  const product = await Product.create(data);
  if (product.stock <= product.lowStockThreshold) bus.emit('stock:low', product);
  res.status(201).json({ success: true, product });
});

// PATCH /api/products/:id
exports.update = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new AppError('Product not found', 404);
  assertOwnerOrAdmin(product, req.user);

  if (req.body.category) {
    assertObjectId(req.body.category, 'category');
    if (!(await Category.exists({ _id: req.body.category }))) throw new AppError('Category does not exist', 400);
  }
  const { seller, ...safe } = req.body; // ownership cannot be reassigned through this route
  product.set(safe);
  await product.save();
  res.json({ success: true, product });
});

// PATCH /api/products/:id/stock   body { change: +n | -n }  - atomic, never negative
exports.adjustStock = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const existing = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!existing) throw new AppError('Product not found', 404);
  assertOwnerOrAdmin(existing, req.user);

  const { change } = req.body;
  if (!Number.isInteger(change) || change === 0) throw new AppError('change must be a non-zero integer', 400);

  const filter = { _id: existing._id };
  if (change < 0) filter.stock = { $gte: -change };
  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: change } }, { new: true });
  if (!product) throw new AppError('Insufficient stock for this adjustment', 409);
  if (product.stock <= product.lowStockThreshold) bus.emit('stock:low', product);
  res.json({ success: true, product });
});

// DELETE /api/products/:id  - soft delete so historical orders stay valid
exports.remove = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new AppError('Product not found', 404);
  assertOwnerOrAdmin(product, req.user);
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product removed' });
});
