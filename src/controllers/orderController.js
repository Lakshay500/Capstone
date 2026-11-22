const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const bus = require('../events/eventBus');
const {assertObjectId, parsePagination, round2 } = require('../utils/query');

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const restoreStock = (lines) =>
  Product.bulkWrite(lines.map((l) => ({updateOne: {filter: {_id: l.product}, update: {$inc: {stock: l.quantity}}}})));

const canView = (order, user) =>
  user.role === 'admin' ||
  String(order.user) === String(user._id) ||
  (user.role === 'seller' && order.items.some((i) => String(i.seller) === String(user._id)));

exports.placeOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  const reserved = [];
  const items = [];
  const lowStock = [];
  let order;

  try {
    for (const line of cart.items) {
      const product = await Product.findOneAndUpdate(
        { _id: line.product, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
        { new: true }
      );
      if (!product) {
        const p = await Product.findById(line.product).select('name stock isActive');
        throw new AppError(
          p && p.isActive ? `Insufficient stock for "${p.name}" (available: ${p.stock})` : 'A product in your cart is no longer available',
          409
        );
      }
      reserved.push({ product: product._id, quantity: line.quantity });
      items.push({ product: product._id, seller: product.seller, name: product.name, price: product.price, quantity: line.quantity });
      if (product.stock <= product.lowStockThreshold) lowStock.push(product);
    }

    const totalAmount = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress: req.body.shippingAddress,
      statusHistory: [{ status: 'pending', by: req.user._id }],
    });
  } catch (err) {
    if (reserved.length) await restoreStock(reserved);
    throw err;
  }

  await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } });
  bus.emit('order:placed', order);
  lowStock.forEach((p) => bus.emit('stock:low', p));
  res.status(201).json({ success: true, message: 'Order placed (payment simulated)', order });
});

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'customer') filter.user = req.user._id;
  if (req.user.role === 'seller') filter['items.seller'] = req.user._id;
  if (req.query.status) {
    if (!Order.STATUSES.includes(req.query.status)) throw new AppError('Invalid status filter', 400);
    filter.status = req.query.status;
  }
  const { page, limit, skip } = parsePagination(req.query);
  const [total, orders] = await Promise.all([Order.countDocuments(filter), Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)]);
  res.json({ success: true, total, page, totalPages: Math.ceil(total / limit), orders });
});

exports.get = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id);
  if (!order || !canView(order, req.user)) throw new AppError('Order not found', 404);
  res.json({ success: true, order });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id);
  if (!order || !canView(order, req.user)) throw new AppError('Order not found', 404);

  const to = req.body.status;
  const from = order.status;
  if (req.user.role === 'customer' && !(to === 'cancelled' && from === 'pending')) {
    throw new AppError('Customers may only cancel their own pending orders', 403);
  }
  if (!TRANSITIONS[from].includes(to)) throw new AppError(`Invalid status change: ${from} -> ${to}`, 409);

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: from },
    { $set: { status: to }, $push: { statusHistory: { status: to, by: req.user._id } } },
    { new: true }
  );
  if (!updated) throw new AppError('Order was modified by another request; reload and retry', 409);
  if (to === 'cancelled') await restoreStock(updated.items);
  bus.emit('order:status-changed', { order: updated, from, to });
  res.json({ success: true, order: updated });
});
