import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {Message } from "./models/Message.js";
import { Order } from "./models/Order.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users: { oderId: socketId }
const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// Export IO instance for use in controllers
export const getIO = () => io;

// Authenticate socket connection
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    console.log("🔐 Socket auth attempt, token exists:", !!token);
    
    if (!token) {
      console.log("❌ No token provided for socket auth");
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 JWT decoded:", JSON.stringify(decoded));
    
    // Handle different JWT payload structures
    socket.userId = decoded._id || decoded.id || decoded.userId;
    socket.userName = decoded.name || "Unknown";
    
    if (!socket.userId) {
      console.log("❌ No userId in JWT payload");
      return next(new Error("Invalid token - no userId"));
    }
    
    console.log(`✅ Socket authenticated: userId=${socket.userId}, name=${socket.userName}`);
    next();
  } catch (error) {
    console.error("❌ Socket auth error:", error.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log(`🔌 User connected: ${userId} (${socket.id})`);

  // Store user socket
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`👥 UserSocketMap updated:`, Object.keys(userSocketMap));
  }

  // Broadcast online users
  io.emit("users:online", Object.keys(userSocketMap));
  io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Legacy event
  io.emit("user:joined", userId);

  // ============ ROOM HANDLERS ============

  // Join a chat room (order)
  socket.on("room:join", ({ orderId }) => {
    socket.join(`order_${orderId}`);
    console.log(`📥 User ${userId} joined room: order_${orderId}`);
  });

  // Leave a chat room
  socket.on("room:leave", ({ orderId }) => {
    socket.leave(`order_${orderId}`);
    console.log(`📤 User ${userId} left room: order_${orderId}`);
  });

  // Legacy handlers for compatibility
  socket.on("joinOrderChat", (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on("leaveOrderChat", (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  // ============ TYPING HANDLERS ============

  socket.on("typing:start", ({ orderId, userId, userName }) => {
    socket.to(`order_${orderId}`).emit("typing:start", {
      orderId,
      userId,
      userName,
    });
  });

  socket.on("typing:stop", ({ orderId, userId }) => {
    socket.to(`order_${orderId}`).emit("typing:stop", {
      orderId,
      userId,
    });
  });

  // Legacy typing handler
  socket.on("typing", ({ orderId, isTyping }) => {
    socket.to(`order_${orderId}`).emit("userTyping", { userId, isTyping });
  });

  // ============ MESSAGE HANDLERS ============

  socket.on("message:send", async ({ orderId, message, senderId, senderName }) => {
    try {
      // Save message to database
      const newMessage = new Message({
        order: orderId,
        sender: senderId,
        content: message.content || message,
        type: message.type || "text",
        fileUrl: message.fileUrl,
        fileName: message.fileName,
      });
      await newMessage.save();

      // Populate sender info
      await newMessage.populate("sender", "name profilePicture");

      // Emit to room
      io.to(`order_${orderId}`).emit("message:new", {
        ...newMessage.toObject(),
        orderId,
        senderName: newMessage.sender?.name || senderName,
      });

      console.log(`💬 Message sent in order ${orderId} by ${senderName}`);
    } catch (error) {
      console.error("Message save error:", error);
      socket.emit("message:error", { error: "Failed to send message" });
    }
  });

  socket.on("message:read", async ({ orderId, readBy }) => {
    try {
      // Mark messages as read in database
      await Message.updateMany(
        { order: orderId, sender: { $ne: readBy }, seen: false },
        { seen: true, seenAt: new Date() }
      );

      // Notify other users
      socket.to(`order_${orderId}`).emit("message:read", { orderId, readBy });
    } catch (error) {
      console.error("Mark read error:", error);
    }
  });

  // ============ NOTIFICATION HANDLERS ============

  socket.on("notifications:read", ({ userId }) => {
    // Just acknowledge - actual marking done via API
    console.log(`🔔 Notifications marked read for ${userId}`);
  });

  // ============ USER PRESENCE ============

  socket.on("user:online", ({ userId }) => {
    userSocketMap[userId] = socket.id;
    io.emit("users:online", Object.keys(userSocketMap));
  });

  socket.on("user:offline", ({ userId }) => {
    delete userSocketMap[userId];
    io.emit("user:left", userId);
    io.emit("users:online", Object.keys(userSocketMap));
  });

  // ============ DISCONNECT ============

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId} (${socket.id})`);
    delete userSocketMap[userId];
    io.emit("user:left", userId);
    io.emit("users:online", Object.keys(userSocketMap));
  });
});

// Helper to emit notification to specific user
export const emitToUser = (userId, event, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

// Helper to emit to order room
export const emitToOrder = (orderId, event, data) => {
  io.to(`order_${orderId}`).emit(event, data);
};

export { app, io, server };
