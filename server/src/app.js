import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";

import logger from "./infrastructure/monitoring/logger.js";
import { initSentry } from "./infrastructure/monitoring/sentry.js";
import * as Sentry from "@sentry/node";

import { publicApiLimiter } from "./shared/middleware/rate-limiter.middleware.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler.middleware.js";
import { geoCheckMiddleware } from "./shared/middleware/geo-check.middleware.js";
import passport from "./infrastructure/config/passport.js";
import v1Router from "./platform/gateway/v1.router.js";

import { healthRouter } from "./platform/health/health.controller.js";
import { metricsMiddleware } from "./shared/middleware/metrics.middleware.js";
import { getMetrics } from "./platform/metrics/metrics.controller.js";

export function createApp() {
  // Initialize Sentry
  initSentry();

  const app = express();
  const server = http.createServer(app);

  // Global BigInt JSON serialization fix
  BigInt.prototype.toJSON = function () {
      return this.toString();
  };

  // ============ MONITORING & METRICS ============
  app.use(metricsMiddleware);

  // ============ CORE PROXY & REQUEST TRACING ============
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    req.realIp = req.headers["x-real-ip"] || req.ip;
    req.requestId = req.headers["x-request-id"] || req.headers["x-correlation-id"] || crypto.randomUUID();
    res.setHeader("X-Request-ID", req.requestId);

    const isViaGateway = Boolean(req.headers["x-request-id"] || req.headers["x-real-ip"] || req.headers["x-forwarded-for"]);
    const gatewayTag = isViaGateway ? "🛡️ [CALL FROM API GATEWAY]" : "🌐 [DIRECT CALL]";

    logger.info(`${gatewayTag} ${req.method} ${req.originalUrl} | IP: ${req.realIp} | ID: ${req.requestId}`);
    next();
  });

  // ============ CORE MIDDLEWARE ============
  app.use(cookieParser());

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://challenges.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'", 
          "data:", 
          "blob:",
          "https://res.cloudinary.com", 
          "https://lh3.googleusercontent.com", 
          "https://challenges.cloudflare.com",
          "https://*.amazonaws.com",
          "https://*.s3.amazonaws.com",
          "https://*.s3.ap-south-1.amazonaws.com",
          "https://cdn.suvix.in",
          "https://*.cloudfront.net",
          "https://images.unsplash.com",
          "https://*.ytimg.com",
          "https://*.ggpht.com"
        ],
        mediaSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://*.amazonaws.com",
          "https://*.s3.amazonaws.com",
          "https://*.s3.ap-south-1.amazonaws.com",
          "https://cdn.suvix.in",
          "https://*.cloudfront.net",
          "https://res.cloudinary.com"
        ],
        fontSrc: ["'self'", "data:", "https://challenges.cloudflare.com"],
        connectSrc: [
          "'self'", 
          process.env.FRONTEND_URL, 
          process.env.ADMIN_URL, 
          "https://suvix.in",
          "https://api.suvix.in",
          "https://cdn.suvix.in",
          "https://challenges.cloudflare.com",
          "https://*.amazonaws.com",
          "https://*.s3.amazonaws.com",
          "https://*.s3.ap-south-1.amazonaws.com",
          "https://*.cloudfront.net",
          "wss:", 
          "ws:"
        ].filter(Boolean),
        frameSrc: ["'self'", "https://api.razorpay.com", "https://challenges.cloudflare.com"],
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

  // ============ STATIC FILES ============
  app.use("/uploads", express.static("uploads"));

  // ============ BODY PARSING ============
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ============ PASSPORT ============
  app.use(passport.initialize());

  // Platform Routes
  app.use("/api", healthRouter);
  app.get("/metrics", getMetrics);

  // ============ API GATEWAY ============
  app.use("/api/v1", v1Router);
  app.use("/api", v1Router); // Backward compatibility fallback (also for tests)

  app.get("/", (req, res) => res.json({ success: true, message: "SuviX Backend is running!" }));

  // ============ SECURITY: NOSQL SANITIZATION ============
  app.use(mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      logger.warn(`[SECURITY] Sanitized potential NoSQL injection at field: "${key}" from IP: ${req.ip}`);
    },
  }));
  app.use(hpp());

  // ============ ERROR HANDLING ============
  Sentry.setupExpressErrorHandler(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, server };
}
