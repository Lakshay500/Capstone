const { Server } = require('socket.io');
const User = require('../models/User');
const { verifyAccess } = require('../utils/tokens');

let io = null;

exports.init = (httpServer) => {
  io = new Server(httpServer);

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
    socket.join(`user:${id}`);
    if (role === 'seller') socket.join(`seller:${id}`);
    if (role === 'admin') socket.join('admins');
    socket.emit('connected', { userId: id, role });
    console.log(`[socket] ${role} ${id} connected (${socket.id})`);
    socket.on('disconnect', () => console.log(`[socket] ${id} disconnected`));
  });
  return io;
};

exports.notify = (room, event, payload) => {
  if (io) io.to(room).emit(event, payload);
};
