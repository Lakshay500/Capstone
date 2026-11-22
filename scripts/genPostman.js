// Generates postman/EcommerceAPI.postman_collection.json  ->  run with: npm run postman
// Import the file into Postman, run `npm run seed`, then run the collection top-to-bottom (Collection Runner).
const fs = require('fs');
const path = require('path');

const j = (o) => JSON.stringify(o, null, 2);
const test = (name, code) => `pm.test(${JSON.stringify(name)}, function () { ${code} });`;
const status = (n) => test(`Status is ${n}`, `pm.response.to.have.status(${n});`);

const request = (name, method, url, { token, body, tests = [], pre = [] } = {}) => ({
  name,
  event: [
    { listen: 'test', script: { type: 'text/javascript', exec: tests } },
    ...(pre.length ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } }] : []),
  ],
  request: {
    method,
    header: [
      { key: 'Content-Type', value: 'application/json' },
      ...(token ? [{ key: 'Authorization', value: `Bearer {{${token}}}` }] : []),
    ],
    url: `{{baseUrl}}${url}`,
    ...(body !== undefined ? { body: { mode: 'raw', raw: j(body) } } : {}),
  },
});

const addr = { fullName: 'Priya Customer', line1: '12 MG Road', city: 'Mumbai', postalCode: '400001', phone: '9999999999' };
const setVar = (k, expr) => `pm.collectionVariables.set('${k}', ${expr});`;

const folders = [
  {
    name: '1. Auth',
    item: [
      request('Login admin (200)', 'POST', '/api/auth/login', { body: { email: 'admin@shop.test', password: 'Admin@1234' }, tests: [status(200), setVar('adminToken', 'pm.response.json().accessToken')] }),
      request('Login seller1 (200)', 'POST', '/api/auth/login', { body: { email: 'seller1@shop.test', password: 'Seller@1234' }, tests: [status(200), setVar('sellerToken', 'pm.response.json().accessToken')] }),
      request('Login seller2 (200)', 'POST', '/api/auth/login', { body: { email: 'seller2@shop.test', password: 'Seller@1234' }, tests: [status(200), setVar('seller2Token', 'pm.response.json().accessToken')] }),
      request('Login customer (200)', 'POST', '/api/auth/login', { body: { email: 'customer@shop.test', password: 'Customer@1234' }, tests: [status(200), setVar('customerToken', 'pm.response.json().accessToken'), setVar('customerRefresh', 'pm.response.json().refreshToken')] }),
      request('Register new customer (201)', 'POST', '/api/auth/register', {
        pre: [setVar('newEmail', "'user' + Date.now() + '@shop.test'")],
        body: { name: 'New User', email: '{{newEmail}}', password: 'Passw0rdX' },
        tests: [status(201), test('Password is never returned', 'pm.expect(pm.response.json().user.password).to.be.undefined;')],
      }),
      request('Register - duplicate email (409)', 'POST', '/api/auth/register', { body: { name: 'Dup', email: 'customer@shop.test', password: 'Passw0rdX' }, tests: [status(409)] }),
      request('Register - validation failure (400)', 'POST', '/api/auth/register', { body: { name: 'A', email: 'not-an-email', password: '123' }, tests: [status(400), test('Lists errors', 'pm.expect(pm.response.json().errors.length).to.be.above(0);')] }),
      request('Register - cannot self-assign admin (400)', 'POST', '/api/auth/register', { body: { name: 'Evil', email: 'evil@shop.test', password: 'Passw0rdX', role: 'admin' }, tests: [status(400)] }),
      request('Login - wrong password (401)', 'POST', '/api/auth/login', { body: { email: 'customer@shop.test', password: 'WrongPass1' }, tests: [status(401)] }),
      request('Refresh token (200)', 'POST', '/api/auth/refresh', { body: { refreshToken: '{{customerRefresh}}' }, tests: [status(200), setVar('oldRefresh', 'pm.collectionVariables.get("customerRefresh")'), setVar('customerRefresh', 'pm.response.json().refreshToken'), setVar('customerToken', 'pm.response.json().accessToken')] }),
      request('Refresh - reuse of old token revokes sessions (401)', 'POST', '/api/auth/refresh', { body: { refreshToken: '{{oldRefresh}}' }, tests: [status(401)] }),
      request('Login customer again (200)', 'POST', '/api/auth/login', { body: { email: 'customer@shop.test', password: 'Customer@1234' }, tests: [status(200), setVar('customerToken', 'pm.response.json().accessToken'), setVar('customerRefresh', 'pm.response.json().refreshToken')] }),
      request('Users/me - no token (401)', 'GET', '/api/users/me', { tests: [status(401)] }),
      request('Users/me - valid token (200)', 'GET', '/api/users/me', { token: 'customerToken', tests: [status(200)] }),
      request('Users list - customer forbidden (403)', 'GET', '/api/users', { token: 'customerToken', tests: [status(403)] }),
      request('Users list - admin (200)', 'GET', '/api/users', { token: 'adminToken', tests: [status(200)] }),
    ],
  },
  {
    name: '2. Categories',
    item: [
      request('List categories (200)', 'GET', '/api/categories', { tests: [status(200), setVar('seedCategoryId', 'pm.response.json().categories[0]._id')] }),
      request('Create category - admin (201)', 'POST', '/api/categories', { token: 'adminToken', pre: [setVar('catName', "'Cat' + Date.now()")], body: { name: '{{catName}}', description: 'Test category' }, tests: [status(201), setVar('categoryId', 'pm.response.json().category._id')] }),
      request('Create category - customer forbidden (403)', 'POST', '/api/categories', { token: 'customerToken', body: { name: 'Nope' }, tests: [status(403)] }),
      request('Create category - no token (401)', 'POST', '/api/categories', { body: { name: 'Nope' }, tests: [status(401)] }),
      request('Create category - validation failure (400)', 'POST', '/api/categories', { token: 'adminToken', body: { description: 'missing name' }, tests: [status(400)] }),
      request('Create category - duplicate (409)', 'POST', '/api/categories', { token: 'adminToken', body: { name: '{{catName}}' }, tests: [status(409)] }),
      request('Get category - not found (404)', 'GET', '/api/categories/64b7f0f0f0f0f0f0f0f0f0f0', { tests: [status(404)] }),
      request('Get category - invalid id (400)', 'GET', '/api/categories/abc', { tests: [status(400)] }),
    ],
  },
  {
    name: '3. Products',
    item: [
      request('Create product - seller1 (201)', 'POST', '/api/products', { token: 'sellerToken', body: { name: 'Postman Test Gadget', description: 'created by test', price: 250.5, category: '{{categoryId}}', stock: 6, lowStockThreshold: 2 }, tests: [status(201), setVar('productId', 'pm.response.json().product._id')] }),
      request('Create product - customer forbidden (403)', 'POST', '/api/products', { token: 'customerToken', body: { name: 'X', price: 1, category: '{{categoryId}}', stock: 1 }, tests: [status(403)] }),
      request('Create product - validation failure (400)', 'POST', '/api/products', { token: 'sellerToken', body: { name: 'Bad', price: -5, category: '{{categoryId}}', stock: 1.5 }, tests: [status(400)] }),
      request('Create product - unknown category (400)', 'POST', '/api/products', { token: 'sellerToken', body: { name: 'Orphan', price: 5, category: '64b7f0f0f0f0f0f0f0f0f0f0', stock: 1 }, tests: [status(400)] }),
      request('List products - public, paginated (200)', 'GET', '/api/products?page=1&limit=5&sort=-price', { tests: [status(200), test('Has pagination fields', 'const b = pm.response.json(); pm.expect(b).to.have.keys("success","total","page","totalPages","count","products");')] }),
      request('List products - filter + search (200)', 'GET', '/api/products?q=gadget&minPrice=100&maxPrice=500&inStock=true', { tests: [status(200)] }),
      request('List products - bad price filter (400)', 'GET', '/api/products?minPrice=abc', { tests: [status(400)] }),
      request('Get product (200)', 'GET', '/api/products/{{productId}}', { tests: [status(200)] }),
      request('Get product - not found (404)', 'GET', '/api/products/64b7f0f0f0f0f0f0f0f0f0f0', { tests: [status(404)] }),
      request("Update product - another seller's product (403)", 'PATCH', '/api/products/{{productId}}', { token: 'seller2Token', body: { price: 1 }, tests: [status(403)] }),
      request('Update product - owner (200)', 'PATCH', '/api/products/{{productId}}', { token: 'sellerToken', body: { price: 300 }, tests: [status(200), test('Price updated', 'pm.expect(pm.response.json().product.price).to.eql(300);')] }),
      request('Stock adjust - would go negative (409)', 'PATCH', '/api/products/{{productId}}/stock', { token: 'sellerToken', body: { change: -100 }, tests: [status(409)] }),
      request('Stock adjust - restock (200)', 'PATCH', '/api/products/{{productId}}/stock', { token: 'sellerToken', body: { change: 4 }, tests: [status(200), test('Stock is 10', 'pm.expect(pm.response.json().product.stock).to.eql(10);')] }),
    ],
  },
  {
    name: '4. Cart',
    item: [
      request('Cart - seller forbidden (403)', 'GET', '/api/cart', { token: 'sellerToken', tests: [status(403)] }),
      request('Cart - no token (401)', 'GET', '/api/cart', { tests: [status(401)] }),
      request('Clear cart (200)', 'DELETE', '/api/cart', { token: 'customerToken', tests: [status(200)] }),
      request('Add item (201)', 'POST', '/api/cart/items', { token: 'customerToken', body: { productId: '{{productId}}', quantity: 2 }, tests: [status(201), test('Total calculated by server', 'pm.expect(pm.response.json().cart.total).to.eql(600);')] }),
      request('Add item - exceeds stock (409)', 'POST', '/api/cart/items', { token: 'customerToken', body: { productId: '{{productId}}', quantity: 999 }, tests: [status(409)] }),
      request('Add item - invalid quantity (400)', 'POST', '/api/cart/items', { token: 'customerToken', body: { productId: '{{productId}}', quantity: 0 }, tests: [status(400)] }),
      request('Add item - unknown product (404)', 'POST', '/api/cart/items', { token: 'customerToken', body: { productId: '64b7f0f0f0f0f0f0f0f0f0f0', quantity: 1 }, tests: [status(404)] }),
      request('View cart (200)', 'GET', '/api/cart', { token: 'customerToken', tests: [status(200)] }),
    ],
  },
  {
    name: '5. Orders & Inventory',
    item: [
      request('Checkout - validation failure (400)', 'POST', '/api/orders', { token: 'customerToken', body: { shippingAddress: { city: 'Mumbai' } }, tests: [status(400)] }),
      request('Checkout (201)', 'POST', '/api/orders', { token: 'customerToken', body: { shippingAddress: addr }, tests: [status(201), setVar('orderId', 'pm.response.json().order._id'), test('Total is 600, status pending', 'const o = pm.response.json().order; pm.expect(o.totalAmount).to.eql(600); pm.expect(o.status).to.eql("pending");')] }),
      request('Stock decreased to 8 (200)', 'GET', '/api/products/{{productId}}', { tests: [status(200), test('Stock is 8', 'pm.expect(pm.response.json().product.stock).to.eql(8);')] }),
      request('Checkout again - empty cart (400)', 'POST', '/api/orders', { token: 'customerToken', body: { shippingAddress: addr }, tests: [status(400)] }),
      request('Order - owner can view (200)', 'GET', '/api/orders/{{orderId}}', { token: 'customerToken', tests: [status(200)] }),
      request('Order - unrelated seller cannot view (404)', 'GET', '/api/orders/{{orderId}}', { token: 'seller2Token', tests: [status(404)] }),
      request('Order list - seller sees own (200)', 'GET', '/api/orders', { token: 'sellerToken', tests: [status(200)] }),
      request('Status - customer cannot confirm (403)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'customerToken', body: { status: 'confirmed' }, tests: [status(403)] }),
      request('Status - invalid value (400)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'sellerToken', body: { status: 'teleported' }, tests: [status(400)] }),
      request('Status - illegal jump pending -> delivered (409)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'sellerToken', body: { status: 'delivered' }, tests: [status(409)] }),
      request('Status - seller confirms (200)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'sellerToken', body: { status: 'confirmed' }, tests: [status(200)] }),
      request('Status - seller cancels, stock restored (200)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'sellerToken', body: { status: 'cancelled' }, tests: [status(200)] }),
      request('Stock restored to 10 (200)', 'GET', '/api/products/{{productId}}', { tests: [status(200), test('Stock is 10', 'pm.expect(pm.response.json().product.stock).to.eql(10);')] }),
      request('Status - cancelled is final (409)', 'PATCH', '/api/orders/{{orderId}}/status', { token: 'adminToken', body: { status: 'confirmed' }, tests: [status(409)] }),
    ],
  },
  {
    name: '6. Reports',
    item: [
      request('Sales summary - seller (200)', 'GET', '/api/reports/sales-summary', { token: 'sellerToken', tests: [status(200)] }),
      request('Sales summary - bad date (400)', 'GET', '/api/reports/sales-summary?from=yesterday', { token: 'adminToken', tests: [status(400)] }),
      request('Best selling - admin (200)', 'GET', '/api/reports/best-selling?limit=3', { token: 'adminToken', tests: [status(200)] }),
      request('Inventory summary - admin (200)', 'GET', '/api/reports/inventory-summary', { token: 'adminToken', tests: [status(200)] }),
      request('Low stock - seller (200)', 'GET', '/api/reports/low-stock', { token: 'sellerToken', tests: [status(200)] }),
      request('Reports - customer forbidden (403)', 'GET', '/api/reports/low-stock', { token: 'customerToken', tests: [status(403)] }),
      request('Reports - no token (401)', 'GET', '/api/reports/low-stock', { tests: [status(401)] }),
    ],
  },
  {
    name: '7. Cleanup',
    item: [
      request('Delete product - other seller forbidden (403)', 'DELETE', '/api/products/{{productId}}', { token: 'seller2Token', tests: [status(403)] }),
      request('Delete product - owner (200)', 'DELETE', '/api/products/{{productId}}', { token: 'sellerToken', tests: [status(200)] }),
      request('Get deleted product (404)', 'GET', '/api/products/{{productId}}', { tests: [status(404)] }),
      request('Delete category (200)', 'DELETE', '/api/categories/{{categoryId}}', { token: 'adminToken', tests: [status(200)] }),
      request('Logout (200)', 'POST', '/api/auth/logout', { token: 'customerToken', body: { refreshToken: '{{customerRefresh}}' }, tests: [status(200)] }),
    ],
  },
];

const collection = {
  info: {
    name: 'E-Commerce & Inventory API',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description: 'Run `npm run seed` first, then run the whole collection in order with the Collection Runner.',
  },
  variable: [{ key: 'baseUrl', value: 'http://localhost:5000' }],
  item: folders,
};

const out = path.join(__dirname, '..', 'postman', 'EcommerceAPI.postman_collection.json');
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
const n = folders.reduce((s, f) => s + f.item.length, 0);
console.log(`Wrote ${out} (${n} requests)`);
