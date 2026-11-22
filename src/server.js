require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const sockets = require('./sockets');
const registerListeners = require('./events/listeners');

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')} (copy .env.example to .env)`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
sockets.init(server);
registerListeners();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await mongoose.syncIndexes();
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
