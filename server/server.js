import dotenv from "dotenv";
dotenv.config();

import "./config/env.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { SiteSettings } from "./modules/system/models/SiteSettings.js";

// Global BigInt JSON serialization fix
BigInt.prototype.toJSON = function () {
    return this.toString();
};


// Utils
import logger from "./utils/logger.js";

// Middleware
import { publicApiLimiter, redis } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { geoCheckMiddleware } from "./middleware/geoCheck.js";
import { vpnCheckMiddleware } from "./middleware/vpnCheck.js";

// Passport - must be imported AFTER dotenv.config()
import passport from "./config/passport.js";

// Routes
import authRoutes from "./modules/auth/routes/authRoutes.js";
import profileRoutes from "./modules/profiles/routes/profileRoutes.js";
import userRoutes from "./modules/user/routes/userRoutes.js";
import portfolioRoutes from "./modules/profiles/routes/portfolioRoutes.js";
import exploreRoutes from "./modules/explore/routes/exploreRoutes.js";
import oauthRoutes from "./modules/auth/routes/oauthRoutes.js";
import { initSearchTrie } from "./modules/reels/controllers/reelController.js";
import reelRoutes from "./modules/reels/routes/reelRoutes.js";
import notificationRoutes from "./modules/connectivity/routes/notificationRoutes.js";
import gigRoutes from "./modules/marketplace/routes/gigRoutes.js";
import orderRoutes from "./modules/marketplace/routes/orderRoutes.js";
import messageRoutes from "./modules/connectivity/routes/messageRoutes.js";
import editorAnalyticsRoutes from "./modules/analytics/routes/editorAnalyticsRoutes.js";
import clientAnalyticsRoutes from "./modules/analytics/routes/clientAnalyticsRoutes.js";
import suvixScoreRoutes from "./modules/user/routes/suvixScoreRoutes.js";
import badgeRoutes from "./modules/gamification/routes/badgeRoutes.js";
import quickReplyRoutes from "./modules/connectivity/routes/quickReplyRoutes.js";
import checklistRoutes from "./modules/marketplace/routes/checklistRoutes.js";
import finalDeliveryRoutes from "./modules/marketplace/routes/finalDeliveryRoutes.js";
import paymentRoutes from "./modules/payments/routes/paymentRoutes.js";
import paymentGatewayRoutes from "./modules/payments/routes/paymentGatewayRoutes.js";
import storageRoutes from "./modules/system/routes/storageRoutes.js";
import advertisementRoutes from "./modules/ads/routes/advertisementRoutes.js";
import briefRoutes from "./modules/jobs/routes/briefRoutes.js";
import proposalRoutes from "./modules/jobs/routes/proposalRoutes.js";
import ratingRoutes from "./modules/marketplace/routes/ratingRoutes.js";
import subscriptionRoutes from "./modules/payments/routes/subscriptionRoutes.js";
import profileInsightsRoutes from "./modules/profiles/routes/profileInsightsRoutes.js";
import clientKYCRoutes from "./modules/kyc/routes/clientKYCRoutes.js";
import refundRoutes from "./modules/payments/routes/refundRoutes.js";
import locationRoutes from "./modules/user/routes/locationRoutes.js";
import jobRoutes from "./modules/jobs/routes/jobRoutes.js";
import walletRoutes from "./modules/payments/routes/walletRoutes.js";
import withdrawalRoutes from "./modules/payments/routes/withdrawalRoutes.js";
import aiRoutes from "./modules/aiworkspace/routes/aiRoutes.js";
import adRequestRoutes from "./modules/ads/routes/adRequestRoutes.js";
import adPreviewRoutes from "./modules/ads/routes/adPreviewRoutes.js";
import finalOutputRoutes from "./modules/marketplace/routes/finalOutputRoutes.js";

// Validation logic and other top-level code follows...
 
// PostgreSQL Support
import { connectPostgres } from "./config/prisma.js";
import prisma from "./config/prisma.js";
// Scheduled Jobs
import { startScheduledJobs } from "./jobs/scheduledJobs.js";

// BullMQ Workers (Background Processing)
// import "./jobs/workers.js";

// Firebase Admin initialization
import { initFirebaseAdmin } from "./utils/firebaseAdmin.js";
initFirebaseAdmin();

// Validate required environment variables (Skip in test mode as services are mocked)
if (process.env.NODE_ENV !== "test") {
  const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME"];
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
  }
}

// Redis connectivity check (Disabled for Dev to avoid Upstash limits)
/*
redis.ping().then(() => {
  logger.info("[Redis] Connected to Upstash Redis ✅");
}).catch((err) => {
  logger.error("[Redis] Could not connect to Upstash Redis — rate limits will use memory fallback", err.message);
});
*/

// Log OAuth status
if (process.env.GOOGLE_CLIENT_ID) {
  logger.info("Google OAuth is enabled");
} else {
  logger.warn("GOOGLE_CLIENT_ID not set - Google OAuth will be disabled");
}

import { app, server } from "./socket.js";

// ============ SECURITY MIDDLEWARE ============

// Trust proxy for production (Render, Vercel, etc.)
// This is required for express-rate-limit to work correctly behind a reverse proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Helmet - Security Headers + Content Security Policy
// CSP is only enforced in production to avoid breaking dev hot-reload
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // ── Content Security Policy ──────────────────────────────────────────────
  // Restricts where the browser can load scripts, images, fonts, etc. from.
  // This is the primary defence against XSS attacks.
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc:     ["'self'"],

      // Scripts: self + Razorpay checkout (payment popup)
      scriptSrc:      ["'self'", "https://checkout.razorpay.com"],

      // Styles: self + inline styles (needed for Razorpay popup)
      styleSrc:       ["'self'", "'unsafe-inline'"],

      // Images: self + Cloudinary CDN + data URIs (base64 previews)
      imgSrc:         ["'self'", "data:", "https://res.cloudinary.com", "https://lh3.googleusercontent.com"],

      // Fonts: self only (we use system/Google-imported fonts)
      fontSrc:        ["'self'", "data:"],

      // API and WebSocket connections
      connectSrc:     [
        "'self'",
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        "wss:",   // Allow WebSocket upgrades (Socket.io)
        "ws:",
      ].filter(Boolean),

      // iFrames: self + Razorpay (payment iFrame)
      frameSrc:       ["'self'", "https://api.razorpay.com"],

      // Forms: self + Google OAuth redirect
      formAction:     ["'self'", "https://accounts.google.com"],

      // Block all plugins (Flash, etc.)
      objectSrc:      ["'none'"],

      // Upgrade all HTTP requests to HTTPS in production
      upgradeInsecureRequests: [],
    },
  } : false,  // Disabled in development
}));


// CORS configuration
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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow ANY Vercel preview URL (*.vercel.app) or suvix.in subdomains
      if (origin.endsWith(".vercel.app") || origin.endsWith(".suvix.in")) {
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

// ============ RATE LIMITING (Production-Grade Tiers) ============
// 🚨 PRE-MIDDLEWARE EXEMPTIONS: Standard browser assets like favicon.ico
// This ensures visual branding always loads even under heavy API load.
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Apply General Tier specifically to API routes (Exempts static loads)
app.use("/api", publicApiLimiter);

// ============ REGIONAL SECURITY ============
// Layer 1: Country-level block (India Only)
app.use(geoCheckMiddleware);

// Response compression (must be before routes)
app.use(compression());

// ============ BODY PARSING ============
// ⚠️ 10mb limit — prevents DoS via oversized payloads
// File uploads stream directly to Cloudinary — not limited here
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============ SESSION (for OAuth) ============
// 🚨 MUST be before passport.initialize() and passport.session()

// Initialize Redis Store for sessions
const redisStore = new RedisStore({
  client: redis,
  prefix: "sess:",
});

app.use(
  session({
    store: redisStore,
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
// 🚨 MUST be after session() and before routes
app.use(passport.initialize());
app.use(passport.session());

// ============ EXEMPTIONS FROM GLOBAL SANITIZATION ============
// 🚨 IMPORTANT: These routes are moved ABOVE mongoSanitize to prevent 
// mangling of external URLs (which contain dots that mongoSanitize replaces with '_').
// These routes handle their own specific validation and security.
app.use("/api/ad-requests", adRequestRoutes);
app.use("/api/ad-previews", adPreviewRoutes);
app.use("/api/ads", advertisementRoutes);
app.use("/api/messages", messageRoutes); // Drive link URLs contain dots — must bypass sanitizer
app.use("/api/auth", vpnCheckMiddleware, oauthRoutes); // OAuth codes contain dots — must bypass sanitizer

// ============ SECURITY: INPUT SANITIZATION ============

// Prevent MongoDB NoSQL injection — strips $ and . from user input
app.use(mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    logger.warn(`[SECURITY] Sanitized potential NoSQL injection at field: "${key}" from IP: ${req.ip}`);
  },
}));

// Prevent HTTP Parameter Pollution — keeps only the last value of duplicate params
app.use(hpp());

// ============ REQUEST LOGGING ============

// ============ REQUEST LOGGING ============

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
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
    database: {
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      postgres: "initialized" // We'll add a live check in a specialized route
    }

  });
});

app.use("/api/auth", vpnCheckMiddleware, authRoutes);
 app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", userRoutes); // Support plural version for Reels/Follow system
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
// app.use("/api/messages", messageRoutes); // Moved above sanitization block (drive link URLs need dots preserved)
app.use("/api/quick-replies", quickReplyRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/delivery", finalDeliveryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-gateway", paymentGatewayRoutes);
app.use("/api/editor/analytics", editorAnalyticsRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/client/analytics", clientAnalyticsRoutes);
// Open Briefs Feature Routes
app.use("/api/briefs", briefRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/profile-insights", profileInsightsRoutes);
app.use("/api/suvix-score", suvixScoreRoutes);
console.log("✅ Mounting Client KYC Routes at /api/client-kyc");
app.use("/api/client-kyc", clientKYCRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/ai-workspace", aiRoutes);

// Badge/Achievement Routes
app.use("/api/badges", badgeRoutes);

// Final Output Routes (Cloudflare R2)
app.use("/api/final-output", finalOutputRoutes);

// Public maintenance status check (no auth required)
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

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    logger.info("MongoDB connected successfully");

    // Production AI - Create Text & Compound Indexes for rapid matching
    const db = mongoose.connection.db;
    Promise.all([
      // Text Indexes for Global Search
      db.collection("profiles").createIndex({ about: "text", skills: "text", softwares: "text" }),
      db.collection("users").createIndex({ bio: "text", name: "text" }),
      db.collection("reels").createIndex({ title: "text", description: "text", hashtags: "text" }),

      // Compound Indexes for Performance (Top-tier optimization)
      db.collection("reels").createIndex({ isPublished: 1, createdAt: -1 }), // For Feed/Trending
      db.collection("users").createIndex({ role: 1, profileCompleted: 1 }),  // For Editor discovery
      db.collection("orders").createIndex({ status: 1, createdAt: -1 }),     // For Admin/User dashboards
    ]).then(() => {
      logger.info("Production database indexes verified/created ✅");
    }).catch(err => {
      logger.error("Failed to create database indexes:", err.message);
    });

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
  logger.info("🚀 Starting SuviX Server...");
  
  const dbConnected = await connectDB();
  if (!dbConnected) {
    logger.error("❌ Failed to connect to MongoDB. Exiting...");
    process.exit(1);
  }

  // Connect to PostgreSQL (Neon)
  const pgConnected = await connectPostgres();
  if (pgConnected) {
    logger.info("🐘 PostgreSQL connectivity established");
  } else {
    logger.warn("⚠️ PostgreSQL connection failed, but proceeding with MongoDB only");
  }


  // Start scheduled jobs (auto-cancel expired orders, etc.)
  logger.info("⏰ Starting scheduled jobs...");
  startScheduledJobs();

  // Initialize Search TRIE (O(L) Autocomplete)
  logger.info("🔍 Initializing Search TRIE...");
  initSearchTrie();

  logger.info(`🌐 Attempting to listen on port ${PORT}...`);
  server.listen(PORT, () => {
    logger.info(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

// ============ GRACEFUL SHUTDOWN ============

const gracefulShutdown = async (signal) => {
  logger.info(`\n[${signal}] Received. Starting graceful shutdown...`);
  
  // Set a timeout to force exit if cleanup takes too long (e.g. 5 seconds)
  // This is critical since Redis limit hits can cause hanging
  const forceExitTimeout = setTimeout(() => {
    logger.error("Forcefully exiting after 5s timeout.");
    process.exit(1);
  }, 5000);

  try {
    if (server.listening) {
      server.close(() => {
        logger.info("HTTP server closed.");
      });
    }

    await mongoose.connection.close();
    logger.info("MongoDB connection closed.");

    if (prisma) {
      await prisma.$disconnect();
      logger.info("PostgreSQL connection closed.");
    }

    clearTimeout(forceExitTimeout);
    logger.info("Graceful shutdown complete. ✅");
    process.exit(0);
  } catch (err) {
    logger.error("Error during graceful shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { app, server };
