const express = require('express');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const cart = require('../controllers/cartController');
const orders = require('../controllers/orderController');
const reports = require('../controllers/reportController');

const router = express.Router();

const PASSWORD = { type: 'string', required: true, minLength: 8, pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'password must be at least 8 characters and contain a letter and a digit' };
const EMAIL = { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'email is invalid' };

router.post('/auth/register', validate({ name: { type: 'string', required: true, minLength: 2 }, email: EMAIL, password: PASSWORD, role: { type: 'string', enum: ['customer', 'seller'] } }), auth.register);
router.post('/auth/login', validate({ email: EMAIL, password: { type: 'string', required: true } }), auth.login);
router.post('/auth/refresh', validate({ refreshToken: { type: 'string', required: true } }), auth.refresh);
router.post('/auth/logout', authenticate, validate({ refreshToken: { type: 'string', required: true } }), auth.logout);

router.get('/users/me', authenticate, users.getMe);
router.patch('/users/me', authenticate, validate({ name: { type: 'string', minLength: 2 }, password: { ...PASSWORD, required: false } }, { partial: true }), users.updateMe);
router.get('/users', authenticate, authorize('admin'), users.listUsers);
router.patch('/users/:id', authenticate, authorize('admin'), validate({ role: { type: 'string', enum: ['customer', 'seller', 'admin'] }, isActive: { type: 'boolean' } }, { partial: true }), users.updateUserByAdmin);

const categoryRules = { name: { type: 'string', required: true, minLength: 2 }, description: { type: 'string' } };
router.get('/categories', categories.list);
router.get('/categories/:id', categories.get);
router.post('/categories', authenticate, authorize('admin'), validate(categoryRules), categories.create);
router.patch('/categories/:id', authenticate, authorize('admin'), validate(categoryRules, { partial: true }), categories.update);
router.delete('/categories/:id', authenticate, authorize('admin'), categories.remove);

const productRules = {
  name: { type: 'string', required: true, minLength: 2 },
  description: { type: 'string' },
  price: { type: 'number', required: true, min: 0.01 },
  category: { type: 'string', required: true },
  stock: { type: 'integer', required: true, min: 0 },
  lowStockThreshold: { type: 'integer', min: 0 },
  seller: { type: 'string' },
};
router.get('/products', products.list);
router.get('/products/:id', products.get);
router.post('/products', authenticate, authorize('seller', 'admin'), validate(productRules), products.create);
router.patch('/products/:id', authenticate, authorize('seller', 'admin'), validate(productRules, { partial: true }), products.update);
router.patch('/products/:id/stock', authenticate, authorize('seller', 'admin'), products.adjustStock);
router.delete('/products/:id', authenticate, authorize('seller', 'admin'), products.remove);

router.use('/cart', authenticate, authorize('customer'));
router.get('/cart', cart.getCart);
router.delete('/cart', cart.clear);
router.post('/cart/items', validate({ productId: { type: 'string', required: true }, quantity: { type: 'integer', required: true, min: 1, max: 100 } }), cart.addItem);
router.patch('/cart/items/:productId', validate({ quantity: { type: 'integer', required: true, min: 1, max: 100 } }), cart.updateItem);
router.delete('/cart/items/:productId', cart.removeItem);

const address = { shippingAddress: { type: 'object', required: true } };
router.post('/orders', authenticate, authorize('customer'), validate(address), orders.placeOrder);
router.get('/orders', authenticate, orders.list);
router.get('/orders/:id', authenticate, orders.get);
router.patch('/orders/:id/status', authenticate, validate({ status: { type: 'string', required: true, enum: ['confirmed', 'shipped', 'delivered', 'cancelled'] } }), orders.updateStatus);

router.use('/reports', authenticate, authorize('seller', 'admin'));
router.get('/reports/sales-summary', reports.salesSummary);
router.get('/reports/best-selling', reports.bestSelling);
router.get('/reports/inventory-summary', reports.inventorySummary);
router.get('/reports/low-stock', reports.lowStock);

module.exports = router;
