const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { assertObjectId, round2 } = require('../utils/query');

const buildView = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price stock isActive');
  const items = [];
  let total = 0;
  for (const line of cart ? cart.items : []) {
    const p = line.product;
    if (!p || !p.isActive) continue;
    const subtotal = round2(p.price * line.quantity);
    total += subtotal;
    items.push({ productId: p.id, name: p.name, price: p.price, quantity: line.quantity, subtotal, available: p.stock >= line.quantity });
  }
  return { items, itemCount: items.reduce((n, i) => n + i.quantity, 0), total: round2(total) };
};

exports.getCart = asyncHandler(async (req, res) => {
  res.json({ success: true, cart: await buildView(req.user._id) });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  assertObjectId(productId, 'productId');
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError('Product not found', 404);

  const cart = (await Cart.findOne({ user: req.user._id })) || new Cart({ user: req.user._id, items: [] });
  const line = cart.items.find((i) => String(i.product) === productId);
  const newQty = (line ? line.quantity : 0) + quantity;
  if (newQty > product.stock) throw new AppError(`Only ${product.stock} unit(s) of "${product.name}" available`, 409);

  if (line) line.quantity = newQty;
  else cart.items.push({ product: product._id, quantity });
  await cart.save();
  res.status(201).json({ success: true, cart: await buildView(req.user._id) });
});

exports.updateItem = asyncHandler(async (req, res) => {
  assertObjectId(req.params.productId, 'productId');
  const cart = await Cart.findOne({ user: req.user._id });
  const line = cart && cart.items.find((i) => String(i.product) === req.params.productId);
  if (!line) throw new AppError('Item not in cart', 404);
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) throw new AppError('Product no longer available', 404);
  if (req.body.quantity > product.stock) throw new AppError(`Only ${product.stock} unit(s) available`, 409);
  line.quantity = req.body.quantity;
  await cart.save();
  res.json({ success: true, cart: await buildView(req.user._id) });
});

exports.removeItem = asyncHandler(async (req, res) => {
  assertObjectId(req.params.productId, 'productId');
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || !cart.items.some((i) => String(i.product) === req.params.productId)) throw new AppError('Item not in cart', 404);
  cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart: await buildView(req.user._id) });
});

exports.clear = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.json({ success: true, message: 'Cart cleared' });
});
