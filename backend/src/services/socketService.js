let io;

const init = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    socket.on('join-company', (companyId) => {
      socket.join(`company-${companyId}`);
      console.log(`[Socket] User joined company room: company-${companyId}`);
    });

    socket.on('join-agent', (agentId) => {
      socket.join(`agent-${agentId}`);
      console.log(`[Socket] Agent joined personal room: agent-${agentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Helper methods to emit events
const emitToCompany = (companyId, event, data) => {
  if (io) io.to(`company-${companyId}`).emit(event, data);
};

const emitToAgent = (agentId, event, data) => {
  if (io) io.to(`agent-${agentId}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};

module.exports = {
  init,
  getIO,
  emitToCompany,
  emitToAgent,
  emitToAll
};
