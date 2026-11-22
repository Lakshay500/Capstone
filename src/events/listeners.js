const bus = require('./eventBus');
const { notify } = require('../sockets');

module.exports = () => {
  bus.on('error', (err) => console.error('[eventBus error]', err.message));

  // New order -> notify each involved seller and the admins
  bus.on('order:placed', (order) => {
    console.log(`[event] order:placed ${order.id} total=${order.totalAmount}`);
    const sellerIds = [...new Set(order.items.map((i) => String(i.seller)))];
    sellerIds.forEach((sid) =>
      notify(`seller:${sid}`, 'order:new', { orderId: order.id, totalAmount: order.totalAmount, createdAt: order.createdAt })
    );
    notify('admins', 'order:new', { orderId: order.id, totalAmount: order.totalAmount });
  });

  // Status change -> notify the customer (and sellers when a customer cancels)
  bus.on('order:status-changed', ({ order, from, to }) => {
    console.log(`[event] order:status-changed ${order.id} ${from} -> ${to}`);
    const payload = { orderId: order.id, from, to, updatedAt: order.updatedAt };
    notify(`user:${order.user}`, 'order:status', payload);
    [...new Set(order.items.map((i) => String(i.seller)))].forEach((sid) => notify(`seller:${sid}`, 'order:status', payload));
  });

  // Stock fell to or below the product's threshold -> alert the seller and admins
  bus.on('stock:low', (product) => {
    console.log(`[event] stock:low "${product.name}" stock=${product.stock}`);
    const payload = { productId: product.id, name: product.name, stock: product.stock, threshold: product.lowStockThreshold };
    notify(`seller:${product.seller}`, 'stock:low', payload);
    notify('admins', 'stock:low', payload);
  });
};
