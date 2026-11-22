require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);

  // create() (not insertMany) so the bcrypt pre-save hook runs
  const admin = await User.create({ name: 'Admin', email: 'admin@shop.test', password: 'Admin@1234', role: 'admin' });
  const seller1 = await User.create({ name: 'Tech Seller', email: 'seller1@shop.test', password: 'Seller@1234', role: 'seller' });
  const seller2 = await User.create({ name: 'Book Seller', email: 'seller2@shop.test', password: 'Seller@1234', role: 'seller' });
  const customer = await User.create({ name: 'Priya Customer', email: 'customer@shop.test', password: 'Customer@1234', role: 'customer' });

  const [electronics, books, apparel] = await Category.insertMany([
    { name: 'Electronics', description: 'Gadgets and accessories' },
    { name: 'Books', description: 'Printed and digital books' },
    { name: 'Apparel', description: 'Clothing' },
  ]);

  await Product.insertMany([
    { name: 'Wireless Mouse', description: 'Ergonomic 2.4GHz mouse', price: 799, category: electronics._id, seller: seller1._id, stock: 40 },
    { name: 'Mechanical Keyboard', description: 'Hot-swappable, RGB', price: 4599, category: electronics._id, seller: seller1._id, stock: 3, lowStockThreshold: 5 },
    { name: 'USB-C Hub', description: '7-in-1 hub', price: 1999, category: electronics._id, seller: seller1._id, stock: 25 },
    { name: 'Node.js Design Patterns', description: 'Backend engineering book', price: 1299, category: books._id, seller: seller2._id, stock: 15 },
    { name: 'MongoDB in Action', description: 'Database fundamentals', price: 999, category: books._id, seller: seller2._id, stock: 12 },
    { name: 'Cotton T-Shirt', description: 'Unisex, 100% cotton', price: 599, category: apparel._id, seller: seller2._id, stock: 60 },
  ]);

  console.log('Seed complete. Logins:');
  console.log(`  admin     ${admin.email}     Admin@1234`);
  console.log(`  seller    ${seller1.email}  Seller@1234  (seller2@shop.test too)`);
  console.log(`  customer  ${customer.email}  Customer@1234`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
