const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const sellerId = (req) => (req.user.role === 'seller' ? new mongoose.Types.ObjectId(req.user.id) : null);

const parseDate = (v, label) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new AppError(`${label} must be a valid date (YYYY-MM-DD)`, 400);
  return d;
};

const orderMatch = (req) => {
  const from = parseDate(req.query.from, 'from');
  const to = parseDate(req.query.to, 'to');
  const match = { status: { $ne: 'cancelled' } };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = from;
    if (to) match.createdAt.$lte = to;
  }
  return match;
};

exports.salesSummary = asyncHandler(async (req, res) => {
  const seller = sellerId(req);
  const pipeline = [{ $match: orderMatch(req) }, { $unwind: '$items' }];
  if (seller) pipeline.push({ $match: { 'items.seller': seller } });
  pipeline.push(
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        unitsSold: { $sum: '$items.quantity' },
        orders: { $addToSet: '$_id' },
      },
    },
    { $project: { _id: 0, date: '$_id', revenue: { $round: ['$revenue', 2] }, unitsSold: 1, orders: { $size: '$orders' } } },
    { $sort: { date: 1 } }
  );
  const daily = await Order.aggregate(pipeline);
  const totals = daily.reduce((t, d) => ({ revenue: t.revenue + d.revenue, unitsSold: t.unitsSold + d.unitsSold }), { revenue: 0, unitsSold: 0 });
  res.json({ success: true, totals: { revenue: Math.round(totals.revenue * 100) / 100, unitsSold: totals.unitsSold }, daily });
});

exports.bestSelling = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
  const seller = sellerId(req);
  const pipeline = [{ $match: orderMatch(req) }, { $unwind: '$items' }];
  if (seller) pipeline.push({ $match: { 'items.seller': seller } });
  pipeline.push(
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: limit },
    { $project: { _id: 0, productId: '$_id', name: 1, unitsSold: 1, revenue: { $round: ['$revenue', 2] } } }
  );
  res.json({ success: true, products: await Order.aggregate(pipeline) });
});

exports.inventorySummary = asyncHandler(async (req, res) => {
  const seller = sellerId(req);
  const match = { isActive: true };
  if (seller) match.seller = seller;
  const summary = await Product.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
        totalUnits: { $sum: '$stock' },
        stockValue: { $sum: { $multiply: ['$price', '$stock'] } },
        lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        category: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Unknown'] },
        totalProducts: 1, totalUnits: 1, lowStockCount: 1,
        stockValue: { $round: ['$stockValue', 2] },
      },
    },
    { $sort: { stockValue: -1 } },
  ]);
  res.json({ success: true, summary });
});

exports.lowStock = asyncHandler(async (req, res) => {
  const seller = sellerId(req);
  const match = { isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } };
  if (seller) match.seller = seller;
  const products = await Product.find(match).sort({ stock: 1 }).select('name stock lowStockThreshold seller').lean();
  res.json({ success: true, count: products.length, products });
});
