const socketIo = require("socket.io");

let io;

// Initialize Socket.io and export it for use in other parts of the app
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Allow requests from any origin (adjust this as needed)
      methods: ["GET", "POST"],
    },
  });

  // Handle connection
  io.on("connection", (socket) => {
    // Connect user to personal room if userId is provided
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Handle joining a room (generic)
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId); // Join the specific room (e.g., fileId)
    });

    // Handle disconnection
    socket.on("disconnect", () => {
    });
  });
};

const getIO = () => io;

// Emit events for real-time updates
const emitVerificationUpdate = (fileId, status, filePath = null) => {
  if (io) {
    io.to(fileId).emit("verificationUpdate", { status, filePath });
  }
};

module.exports = { initSocket, emitVerificationUpdate, getIO };
