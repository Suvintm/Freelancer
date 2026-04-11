import dotenv from "dotenv";
dotenv.config();

import "./config/env.js";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";

// Global BigInt JSON serialization fix
BigInt.prototype.toJSON = function () {
    return this.toString();
};

// Utils
import logger from "./utils/logger.js";
import { initSocket } from "./socket.js";

// Middleware
import { publicApiLimiter, redis } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { geoCheckMiddleware } from "./middleware/geoCheck.js";
import { vpnCheckMiddleware } from "./middleware/vpnCheck.js";

// Passport - must be imported AFTER dotenv.config()
import passport from "./config/passport.js";

// Routes
import authRoutes from "./modules/auth/routes/authRoutes.js";
import oauthRoutes from "./modules/auth/routes/oauthRoutes.js";
import userRoutes from "./modules/user/routes/userRoutes.js";
import notificationRoutes from "./modules/notification/routes/notificationRoutes.js";
import paymentGatewayRoutes from "./modules/payments/routes/paymentGatewayRoutes.js";

// PostgreSQL Support
import { connectPostgres } from "./config/prisma.js";
import prisma from "./config/prisma.js";

// Firebase Admin initialization
import { initFirebaseAdmin } from "./utils/firebaseAdmin.js";
initFirebaseAdmin();

// Initialize BullMQ Background Workers
import "./modules/workers/index.js";

// Validate required environment variables
if (process.env.NODE_ENV !== "test") {
  const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME"];
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);

// 🔍 DIAGNOSTIC: Global Request Logger
app.use((req, res, next) => {
  logger.info(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// ============ CORE MIDDLEWARE ============
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.ADMIN_URL, "wss:", "ws:"].filter(Boolean),
      frameSrc: ["'self'", "https://api.razorpay.com"],
      formAction: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "https://suvix.in",
  "https://admin.suvix.in",
  "https://api.suvix.in",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".suvix.in")) {
      return callback(null, true);
    }
    logger.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/api", publicApiLimiter);
app.use(geoCheckMiddleware);
app.use(compression());

// ============ BODY PARSING ============
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============ PASSPORT ============
// We only use Passport for OAuth flows (Google), running strictly in session=false mode.
app.use(passport.initialize());

// ============ PRISMA ROUTES (EXEMPT FROM NOSQL SANITIZE) ============
// These routes handle PostgreSQL data and are safely immune to NoSQL injection.
app.use("/api/auth", vpnCheckMiddleware, authRoutes); // Priority: Local Auth (/me, /login)
app.use("/api/auth", vpnCheckMiddleware, oauthRoutes); // Fallback: Social OAuth
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);

// ============ SECURITY: NOSQL SANITIZATION ============
// This protects MongoDB-specific routes (Reels, Feed, etc.)
app.use(mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    logger.warn(`[SECURITY] Sanitized potential NoSQL injection at field: "${key}" from IP: ${req.ip}`);
  },
}));
app.use(hpp());

// ============ REQUEST LOGGING ============
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// ============ RELEVANT API ROUTES ============
app.use("/api/payment-gateway", paymentGatewayRoutes);

// Health checks
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: {
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      postgres: "connected"
    }
  });
});

app.get("/", (req, res) => res.json({ success: true, message: "SuviX Backend is running!" }));

// ============ ERROR HANDLING ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ SERVER INIT ============
const PORT = process.env.PORT || 5000;

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
    logger.info("MongoDB connected successfully");
    const db = mongoose.connection.db;
    await Promise.all([
      db.collection("users").createIndex({ bio: "text", name: "text" }),
      db.collection("reels").createIndex({ isPublished: 1, createdAt: -1 }),
    ]);
    logger.info("Production database indexes verified ✅");
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    return false;
  }
};

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) process.exit(1);
  await connectPostgres();
  initSocket(server);
  server.listen(PORT, "0.0.0.0", () => logger.info(`✅ Server running on port ${PORT} (reachable at http://0.0.0.0:${PORT})`));
};

if (process.env.NODE_ENV !== "test") startServer();

const gracefulShutdown = async (signal) => {
  logger.info(`\n[${signal}] Received. Closing connections...`);
  server.close(() => logger.info("HTTP server closed."));
  await mongoose.connection.close();
  if (prisma) await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── GLOBAL ERROR HANDLERS (Safety Net) ───────────────────────────────────────────
// These handle errors that occur outside of Express or asynchronous rejections.
process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 [UNHANDLED REJECTION] at:", promise, "reason:", reason);
  // In production, consider sending to Sentry/Crashlytics
});

process.on("uncaughtException", (error) => {
  logger.error("🔥 [UNCAUGHT EXCEPTION]:", error.message);
  logger.error(error.stack);
  // Standard Production Practice: Restart on uncaught exceptions
  process.exit(1);
});

export { app, server };
