import "./config/env.js";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";

// IMPORTANT: Load env variables FIRST before any other imports that use them
dotenv.config();

// Utils
import logger from "./utils/logger.js";

// Middleware
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Passport - must be imported AFTER dotenv.config()
import passport from "./config/passport.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import reelRoutes from "./routes/reelRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import gigRoutes from "./routes/gigRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// Log OAuth status
if (process.env.GOOGLE_CLIENT_ID) {
  logger.info("Google OAuth is enabled");
} else {
  logger.warn("GOOGLE_CLIENT_ID not set - Google OAuth will be disabled");
}

import { app, server } from "./socket.js";

// ============ SECURITY MIDDLEWARE ============

// Helmet - Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiter (general)
app.use(generalLimiter);

// ============ BODY PARSING ============

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// ============ SESSION (for OAuth) ============

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ============ REQUEST LOGGING ============

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// ============ ROUTES ============

// Health check endpoint - for keep-alive pings (UptimeRobot, etc.)
// This prevents Render free tier from sleeping
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes); // OAuth routes under /api/auth
app.use("/api/profile", profileRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);

// Public maintenance status check (no auth required)
import { SiteSettings } from "./models/SiteSettings.js";
app.get("/api/maintenance-status", async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.status(200).json({
      success: true,
      maintenance: {
        isActive: settings.maintenanceMode,
        message: settings.maintenanceMessage,
        endTime: settings.maintenanceEndTime,
      },
    });
  } catch (error) {
    res.status(200).json({ success: true, maintenance: { isActive: false } });
  }
});

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/", (req, res) =>
  res.json({
    success: true,
    message: "SuviX Backend is running!",
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", (req, res) =>
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);

// ============ ERROR HANDLING ============

app.use(notFoundHandler);
app.use(errorHandler);

// ============ DATABASE & SERVER ============

const PORT = process.env.PORT || 5000;

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    logger.info("MongoDB connected successfully");
    return true;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      logger.info(`Retrying connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    return false;
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB error:", error);
});

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    logger.error("Failed to connect to MongoDB. Exiting...");
    process.exit(1);
  }

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
};

startServer();
