import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Message } from "./models/Message.js";
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
  // Production-ready heartbeat settings
  pingTimeout: 60000,    // 60 seconds before considering connection dead
  pingInterval: 25000,   // Ping every 25 seconds
  upgradeTimeout: 30000, // Timeout for upgrade
  maxHttpBufferSize: 1e8, // 100MB max for file transfers
});

// Store online users: { userId: socketId }
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
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  io.emit("user:joined", userId);

  // ============ ROOM HANDLERS ============

  socket.on("room:join", ({ orderId }) => {
    socket.join(`order_${orderId}`);
    console.log(`📥 User ${userId} joined room: order_${orderId}`);
    
    // Send current message statuses when joining room
    Message.find({ order: orderId })
      .select("_id seen seenAt delivered deliveredAt")
      .then(messages => {
        socket.emit("messages:status_update", {
          orderId,
          messages: messages.map(m => ({
            _id: m._id,
            seen: m.seen,
            seenAt: m.seenAt,
            delivered: m.delivered || true,
            deliveredAt: m.deliveredAt,
          })),
        });
      })
      .catch(err => console.error("Error fetching message statuses:", err));
  });

  socket.on("room:leave", ({ orderId }) => {
    socket.leave(`order_${orderId}`);
    console.log(`📤 User ${userId} left room: order_${orderId}`);
  });

  // Legacy handlers
  socket.on("joinOrderChat", (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on("leaveOrderChat", (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  // ============ ONLINE USERS REQUEST ============
  
  socket.on("request:online_users", () => {
    socket.emit("users:online", Object.keys(userSocketMap));
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

  socket.on("typing", ({ orderId, isTyping }) => {
    socket.to(`order_${orderId}`).emit("userTyping", { userId, isTyping });
  });

  // ============ MESSAGE HANDLERS ============

  socket.on("message:send", async ({ orderId, message, senderId, senderName, tempId }) => {
    try {
      const newMessage = new Message({
        order: orderId,
        sender: senderId,
        content: message.content || message,
        type: message.type || "text",
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        delivered: true,
        deliveredAt: new Date(),
      });
      await newMessage.save();

      await newMessage.populate("sender", "name profilePicture");

      // Get the other party in the order to send delivered notification
      const order = await Order.findById(orderId);
      const receiverId = order.client.toString() === senderId ? order.editor.toString() : order.client.toString();

      // Emit to room with full message data including status
      io.to(`order_${orderId}`).emit("message:new", {
        ...newMessage.toObject(),
        orderId,
        senderName: newMessage.sender?.name || senderName,
        tempId, // Include tempId for optimistic update matching
        status: "delivered",
      });

      // Emit delivered status specifically
      io.to(`order_${orderId}`).emit("message:delivered", {
        messageId: newMessage._id,
        orderId,
        deliveredAt: newMessage.deliveredAt,
      });

      console.log(`💬 Message sent in order ${orderId} by ${senderName}`);
    } catch (error) {
      console.error("Message save error:", error);
      socket.emit("message:error", { error: "Failed to send message", tempId });
    }
  });

  // Real-time read receipts with immediate broadcast
  socket.on("message:read", async ({ orderId, readBy }) => {
    try {
      const now = new Date();
      
      // Mark all unread messages as read
      const result = await Message.updateMany(
        { order: orderId, sender: { $ne: readBy }, seen: false },
        { seen: true, seenAt: now }
      );

      console.log(`✓✓ Marked ${result.modifiedCount} messages as read in order ${orderId}`);

      // Get the updated messages to broadcast their IDs
      const updatedMessages = await Message.find({
        order: orderId,
        sender: { $ne: readBy },
        seen: true,
        seenAt: now,
      }).select("_id");

      // Broadcast seen status to all users in the room
      io.to(`order_${orderId}`).emit("message:read", { 
        orderId, 
        readBy,
        seenAt: now,
        messageIds: updatedMessages.map(m => m._id),
      });

      // Also emit individual seen events for each message
      updatedMessages.forEach(msg => {
        io.to(`order_${orderId}`).emit("message:seen", {
          messageId: msg._id,
          orderId,
          seenBy: readBy,
          seenAt: now,
        });
      });

    } catch (error) {
      console.error("Mark read error:", error);
    }
  });

  // ============ NOTIFICATION HANDLERS ============

  socket.on("notifications:read", ({ userId }) => {
    console.log(`🔔 Notifications marked read for ${userId}`);
  });

  // ============ USER PRESENCE ============

  socket.on("user:online", ({ userId }) => {
    userSocketMap[userId] = socket.id;
    io.emit("users:online", Object.keys(userSocketMap));
    io.emit("user:joined", userId);
  });

  socket.on("user:offline", ({ userId }) => {
    delete userSocketMap[userId];
    io.emit("user:left", userId);
    io.emit("users:online", Object.keys(userSocketMap));
  });

  // ============ DISCONNECT ============

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${userId} (${socket.id}) - Reason: ${reason}`);
    delete userSocketMap[userId];
    io.emit("user:left", userId);
    io.emit("users:online", Object.keys(userSocketMap));
  });

  // Error handling
  socket.on("error", (error) => {
    console.error(`❌ Socket error for user ${userId}:`, error);
  });
});

// Helper to emit notification to specific user
export const emitToUser = (userId, event, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

// Helper to emit to order room
export const emitToOrder = (orderId, event, data) => {
  io.to(`order_${orderId}`).emit(event, data);
};

// Helper to emit message status update
export const emitMessageStatus = (orderId, messageId, status, data = {}) => {
  io.to(`order_${orderId}`).emit(`message:${status}`, {
    messageId,
    orderId,
    ...data,
  });
};

export { app, io, server };
