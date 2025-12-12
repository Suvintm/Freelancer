import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Export IO instance for use in controllers
export const getIO = () => io;

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId != "undefined") userSocketMap[userId] = socket.id;

    // io.emit() is used to send events to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Join order chat room
    socket.on("joinOrderChat", (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`User ${userId} joined order chat: ${orderId}`);
    });

    // Leave order chat room
    socket.on("leaveOrderChat", (orderId) => {
        socket.leave(`order_${orderId}`);
        console.log(`User ${userId} left order chat: ${orderId}`);
    });

    // Typing indicator
    socket.on("typing", ({ orderId, isTyping }) => {
        socket.to(`order_${orderId}`).emit("userTyping", { userId, isTyping });
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };
