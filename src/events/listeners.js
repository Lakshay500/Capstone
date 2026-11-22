const bus = require('./eventBus');
const { notify } = require('../sockets');

module.exports = () => {
  bus.on('error', (err) => console.error('[eventBus error]', err.message));

  bus.on('order:placed', (order) => {
    console.log(`[event] order:placed ${order.id} total=${order.totalAmount}`);
    const sellerIds = [...new Set(order.items.map((i) => String(i.seller)))];
    sellerIds.forEach((sid) =>
      notify(`seller:${sid}`, 'order:new', { orderId: order.id, totalAmount: order.totalAmount, createdAt: order.createdAt })
    );
    notify('admins', 'order:new', { orderId: order.id, totalAmount: order.totalAmount });
  });

  bus.on('order:status-changed', ({ order, from, to }) => {
    console.log(`[event] order:status-changed ${order.id} ${from} -> ${to}`);
    const payload = { orderId: order.id, from, to, updatedAt: order.updatedAt };
    notify(`user:${order.user}`, 'order:status', payload);
    [...new Set(order.items.map((i) => String(i.seller)))].forEach((sid) => notify(`seller:${sid}`, 'order:status', payload));
  });

  bus.on('stock:low', (product) => {
    console.log(`[event] stock:low "${product.name}" stock=${product.stock}`);
    const payload = { productId: product.id, name: product.name, stock: product.stock, threshold: product.lowStockThreshold };
    notify(`seller:${product.seller}`, 'stock:low', payload);
    notify('admins', 'stock:low', payload);
  });
};
