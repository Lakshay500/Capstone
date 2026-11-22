const { Server } = require('socket.io');
const User = require('../models/User');
const { verifyAccess } = require('../utils/tokens');

let io = null;

exports.init = (httpServer) => {
  io = new Server(httpServer);

  // Only authenticated users may connect (access token in handshake auth)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyAccess(token);
      const user = await User.findById(payload.sub).select('role isActive');
      if (!user || !user.isActive) return next(new Error('Invalid user'));
      socket.data.user = { id: user.id, role: user.role };
      next();
    } catch (e) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`); // personal channel (order status updates)
    if (role === 'seller') socket.join(`seller:${id}`); // new orders + low stock for own products
    if (role === 'admin') socket.join('admins');
    socket.emit('connected', { userId: id, role });
    console.log(`[socket] ${role} ${id} connected (${socket.id})`);
    socket.on('disconnect', () => console.log(`[socket] ${id} disconnected`));
  });
  return io;
};

// Safe no-op if sockets are not initialised (e.g. seed scripts)
exports.notify = (room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};
