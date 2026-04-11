import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./config/prisma.js";
import { subscribe } from "./config/redisClient.js";
import dotenv from "dotenv";

dotenv.config();

let io;
const userSocketMap = {};

/**
 * PRODUCTION-GRADE SOCKET INITIALIZER
 * Unifies Express and WebSockets on a single HTTP server to prevent connection errors.
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Absolute wildcard for dev
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 120000,
    pingInterval: 25000,
    upgradeTimeout: 60000,
    maxHttpBufferSize: 1e8,
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    allowEIO3: true,
  });

  // 🧪 [DEBUG] Check every request
  io.engine.on("connection_error", (err) => {
    console.error("❌ [SOCKET-ENGINE] Connection Error:", err);
  });

  setupSocketHandlers();
  return io;
};

const setupSocketHandlers = () => {
  // 🛡️ AUTHENTICATION MIDDLEWARE
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        console.warn("🔌 [SOCKET] Connection rejected: No token provided");
        return next(new Error("Authentication required"));
      }

      console.log("🔌 [SOCKET] Verifying token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = (decoded._id || decoded.id || decoded.userId)?.toString();
      
      if (!socket.userId) {
        console.warn("🔌 [SOCKET] Connection rejected: Token valid but no user ID found", decoded);
        return next(new Error("Invalid token"));
      }

      console.log(`🔌 [SOCKET] Token verified for user: ${socket.userId}`);
      next();
    } catch (error) {
      console.error("🔌 [SOCKET] Connection rejected: JWT Verification failed", error.message);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) userSocketMap[userId] = socket.id;

    console.log(`📡 [SOCKET] User connected: ${userId} (${socket.id})`);

    io.emit("users:online", Object.keys(userSocketMap));

    socket.on("room:join", ({ orderId }) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("message:send", async ({ orderId, message, senderId, receiverId, tempId }) => {
      try {
        const newMessage = await prisma.message.create({
          data: {
            sender_id: senderId,
            receiver_id: receiverId,
            content: message.content || message,
            type: message.type || "text",
          },
        });

        io.to(`order_${orderId}`).emit("message:new", {
          ...newMessage,
          tempId,
          status: "delivered",
        });
      } catch (error) {
        socket.emit("message:error", { error: "Failed to send message", tempId });
      }
    });

    socket.on("message:read", async ({ orderId, readBy }) => {
      try {
        await prisma.message.updateMany({
          where: { receiver_id: readBy, is_read: false },
          data: { is_read: true },
        });
        io.to(`order_${orderId}`).emit("message:read_receipt", { orderId, readBy });
      } catch (error) {
        console.error("Mark read error:", error);
      }
    });

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("users:online", Object.keys(userSocketMap));
      console.log(`🔌 [SOCKET] User disconnected: ${userId}`);
    });
  });

  // 🔄 REDIS SUBSCRIPTION (Cross-Instance / External Events)
  subscribe("admin:events", (payload) => {
    const { type, userId, data } = payload;
    if (type === "admin:maintenance") {
      io.emit("admin:maintenance", data);
    } else if (userSocketMap[userId]) {
      io.to(userSocketMap[userId]).emit(type, data);
    }
  });
};

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];
export const getIO = () => io;

export const emitToUser = (userId, event, data) => {
  if (!io) return false;
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

/**
 * Forcibly disconnect a user and notify their app to logout.
 * Used for bans or account deletions.
 */
export const kickUser = (userId, reason = "Session invalidated") => {
    if (!io) return false;
    const socketId = userSocketMap[userId];
    if (socketId) {
        console.log(`🔌 [SOCKET] Kicking user ${userId} for reason: ${reason}`);
        io.to(socketId).emit("session:invalidated", { reason });
        // Optional: Actually disconnect the socket after a tiny delay
        setTimeout(() => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) socket.disconnect(true);
        }, 500);
        return true;
    }
    return false;
};

