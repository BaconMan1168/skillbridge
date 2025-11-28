const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function initializeSocket(server, options = {}){
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET','POST']
    },
    ...options
  });

  io.use(async (socket, next) => {
    try {
        const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) throw new Error('Authentication error');

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.userId;

        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id} user ${socket.userId}`);

    socket.on('joinSession', async ({ sessionId }) => {
      if (!sessionId) return socket.emit('error', 'Missing sessionId');

      const session = await prisma.session.findUnique({ where: { id: Number(sessionId) }});
      if (!session) return socket.emit('error', 'Session not found');

      if (session.mentorId !== socket.userId && session.learnerId !== socket.userId) {
        return socket.emit('error', 'Not a session participant');
      }

      const room = `session_${sessionId}`;
      socket.join(room);

      socket.to(room).emit('participantJoined', { userId: socket.userId, sessionId });

      const messages = await prisma.message.findMany({
        where: { sessionId: Number(sessionId) },
        orderBy: { createdAt: 'asc' }
      });
      socket.emit('recentMessages', messages);
    });

    socket.on('sendMessage', async ({ sessionId, content }) => {
      try {
        if (!sessionId || !content) return socket.emit('error', 'Invalid message payload');
        const session = await prisma.session.findUnique({ where: { id: Number(sessionId) }});
        if (!session) return socket.emit('error', 'Session not found');
        if (session.mentorId !== socket.userId && session.learnerId !== socket.userId) {
          return socket.emit('error', 'Not a session participant');
        }

        const message = await prisma.message.create({
          data: {
            sessionId: Number(sessionId),
            senderId: socket.userId,
            content
          }
        });

        const payload = {
          id: message.id,
          sessionId: message.sessionId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt
        };

        const room = `session_${sessionId}`;
        io.to(room).emit('receiveMessage', payload);
      } catch (err) {
        console.error('socket sendMessage err', err);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('leaveSession', ({ sessionId }) => {
      socket.leave(`session_${sessionId}`);
      socket.to(`session_${sessionId}`).emit('participantLeft', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`socket disconnected ${socket.id}`);
    });
  });

  return io;
}

module.exports = initializeSocket;