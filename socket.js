import { Server } from 'socket.io';

const connectedUsers = new Map(); // userId => socketId

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // change to your frontend domain in prod
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // ✅ User joins with userId
    socket.on('user:connect', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;

      io.emit('user:status', { userId, online: true });
      console.log(`✅ User connected: ${userId}`);
    });

    // ✅ Join chat room
    socket.on('chat:join', (chatId) => {
      socket.join(chatId);
    });

    socket.on("join:multiple", (chatIds) => {
      chatIds.forEach((chatId) => socket.join(chatId));
    });

    socket.on("user:reciever:active", (chatId) => {
      socket.join(chatId);
      socket.to(chatId).emit("user:reciever:active", {isActive: true});
    });
    
    socket.on("user:reciever:inactive", (chatId) => {
      socket.join(chatId);
      socket.to(chatId).emit("user:reciever:inactive", {isActive: false});
    });

    // ✅ Leave chat room
    socket.on('chat:leave', (chatId) => {
      // socket.leave(chatId);
    });

    // ✅ Send message
    socket.on('message:send', ({ chatId, message }) => {
      socket.join(chatId);
      socket.to(chatId).emit('message:receive', message);
    });

    // ✅ Typing indicators
    socket.on('typing:start', ({ chatId, userId }) => {
      socket.join(chatId);
      socket.to(chatId).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ chatId, userId }) => {
      socket.join(chatId);
      socket.to(chatId).emit('typing:stop', { userId });
    });

    // ✅ Message delivery
    socket.on('message:delivered', ({ messageId, toUserId }) => {
      const targetSocket = connectedUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('message:delivered', { messageId });
      }
    });

    // ✅ Message seen
    socket.on('message:seen', ({ messageId, toUserId }) => {
      const targetSocket = connectedUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('message:seen', { messageId });
      }
    });

    // ✅ Voice/video call signaling (WebRTC)
    socket.on('call:offer', ({ toUserId, offer, fromUserId }) => {
      const targetSocket = connectedUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('call:offer', { offer, fromUserId });
      }
    });

    socket.on('call:answer', ({ toUserId, answer }) => {
      const targetSocket = connectedUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('call:answer', { answer });
      }
    });

    socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
      const targetSocket = connectedUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit('call:ice-candidate', { candidate });
      }
    });

    // ✅ Retry message (e.g., on fail or reconnect)
    socket.on('message:retry', ({ chatId, message }) => {
      socket.to(chatId).emit('message:receive', message);
    });

    // ✅ Disconnect
    socket.on('disconnect', () => {
      const userId = socket.userId;
      if (userId) {
        connectedUsers.delete(userId);
        io.emit('user:status', { userId, online: false });
        console.log(`❌ User disconnected: ${userId}`);
      }
    });
  });

  return io;
};
