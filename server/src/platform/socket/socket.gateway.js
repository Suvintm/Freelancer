import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../../infrastructure/database/postgres.js";
import { subscribe, publish } from "../../infrastructure/cache/redis.client.js";
import logger from "../../infrastructure/monitoring/logger.js";
import dotenv from "dotenv";

dotenv.config();

import { EventEmitter } from "events";

let io;
const userSocketMap = {};
// 🌉 [FAIL-SAFE BRIDGE] Internal emitter for same-process communication (Dev Fallback)
const localBridge = new EventEmitter();

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

  // Monitor engine-level connection errors
  io.engine.on("connection_error", (err) => {
    logger.error("❌ [SOCKET-ENGINE] Connection Error:", { code: err.code, message: err.message });
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
        logger.warn("🔌 [SOCKET] Connection rejected: No token provided");
        return next(new Error("Authentication required"));
      }

      logger.debug("🔌 [SOCKET] Verifying token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = (decoded._id || decoded.id || decoded.userId)?.toString();
      
      if (!socket.userId) {
        logger.warn("🔌 [SOCKET] Connection rejected: Token valid but no user ID found", { decoded });
        return next(new Error("Invalid token"));
      }

      logger.info(`🔌 [SOCKET] Token verified for user: ${socket.userId}`);
      next();
    } catch (error) {
      logger.error("🔌 [SOCKET] Connection rejected: JWT Verification failed", { message: error.message });
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) {
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
      }
      userSocketMap[userId].add(socket.id);
    }

    logger.info(`📡 [SOCKET] User connected: ${userId} (socketId: ${socket.id})`);

    socket.on("join_room", (roomName) => {
      logger.debug(`📡 [SOCKET] User ${userId} joining room: ${roomName}`);
      socket.join(roomName);
    });

    socket.on("leave_room", (roomName) => {
      logger.debug(`📡 [SOCKET] User ${userId} leaving room: ${roomName}`);
      socket.leave(roomName);
    });

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
        logger.error("[SOCKET] Mark read error:", { message: error.message });
      }
    });

    socket.on("typing:start", ({ receiverId }) => {
      if (socket.userId) {
        emitToUser(receiverId, "typing:start", { senderId: socket.userId });
      }
    });

    socket.on("typing:stop", ({ receiverId }) => {
      if (socket.userId) {
        emitToUser(receiverId, "typing:stop", { senderId: socket.userId });
      }
    });

    socket.on("disconnect", () => {
      if (userId && userSocketMap[userId]) {
        userSocketMap[userId].delete(socket.id);
        if (userSocketMap[userId].size === 0) {
          delete userSocketMap[userId];
        }
      }
      logger.info(`🔌 [SOCKET] User disconnected: ${userId} (socketId: ${socket.id})`);
    });
  });

  localBridge.on("signal", (payload) => {
    const { type, userId, data } = payload;
    const sockets = userSocketMap[userId];
    if (sockets && sockets.size > 0) {
      sockets.forEach(socketId => {
        io.to(socketId).emit(type, data);
      });
    }
  });

  // 🔄 REDIS SUBSCRIPTION (Cross-Instance / External Events)
  subscribe("admin:events", (payload) => {
    const { type, userId, data } = payload;
    if (type === "admin:maintenance") {
      io.emit("admin:maintenance", data);
    } else {
      const sockets = userSocketMap[userId];
      if (sockets && sockets.size > 0) {
        sockets.forEach(socketId => {
          io.to(socketId).emit(type, data);
        });
      }
    }
  });
};

export const getReceiverSocketId = (receiverId) => {
  const sockets = userSocketMap[receiverId];
  return sockets ? Array.from(sockets)[0] : undefined;
};
export const getIO = () => io;

export const emitToUser = (userId, event, data) => {
  if (!io) return false;

  // 1. Try local emit first (for speed — only works if user is on this specific instance)
  const sockets = userSocketMap[userId];
  if (sockets && sockets.size > 0) {
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }

  // 2. 🌉 [BRIDGE] Trigger Internal Signal Hub (Fail-Safe for Dev/Solo Process)
  localBridge.emit("signal", { type: event, userId, data });

  // 3. 🚀 CROSS-PROCESS HUB: Publish to Redis (Scale-out Production)
  publish("admin:events", { 
    type: event, 
    userId, 
    data 
  });

  return true;
};

/**
 * Forcibly disconnect a user and notify their app to logout.
 * Used for bans or account deletions.
 */
export const kickUser = (userId, reason = "Session invalidated") => {
    if (!io) return false;
    const sockets = userSocketMap[userId];
    if (sockets && sockets.size > 0) {
        logger.info(`🔌 [SOCKET] Kicking user ${userId} for reason: ${reason}`);
        sockets.forEach(socketId => {
            io.to(socketId).emit("session:invalidated", { reason });
            // Optional: Actually disconnect the socket after a tiny delay
            setTimeout(() => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) socket.disconnect(true);
            }, 500);
        });
        return true;
    }
    return false;
};

