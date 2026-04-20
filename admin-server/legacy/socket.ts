import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import logger from "./utils/logger.js";
import { AuthPayload } from "./types/auth.types.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        "https://suvix.in",
        "https://admin.suvix.in",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ].filter(Boolean) as string[];

      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".suvix.in")) {
        callback(null, true);
      } else {
        logger.warn(`⚠️ Socket.io: Blocked connection from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 120000,
  pingInterval: 25000,
  transports: ["polling", "websocket"],
});

// Store online admins: { adminId: socketId }
const adminSocketMap: Record<string, string> = {};

// Authenticate socket connection
io.use((socket: Socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    
    (socket as any).adminId = decoded.id;
    (socket as any).adminName = decoded.email;
    
    next();
  } catch (error: any) {
    logger.error("❌ Socket auth error: " + error.message);
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket: Socket) => {
  const adminId = (socket as any).adminId;
  logger.info(`🔌 Admin connected: ${adminId} (${socket.id})`);

  if (adminId) {
    adminSocketMap[adminId] = socket.id;
  }

  socket.on("disconnect", (reason) => {
    logger.info(`❌ Admin disconnected: ${adminId} - Reason: ${reason}`);
    delete adminSocketMap[adminId];
  });
});

// Helper to emit to all admins
export const emitToAdmins = (event: string, data: any) => {
  io.emit(event, data);
};

// Helper for maintenance broadcasts
export const emitMaintenance = (isActive: boolean, message: string) => {
  io.emit("admin:maintenance", { isActive, message });
};

export { app, io, server };
