import express from "express";
import http from "http";
import mongoose from "mongoose";
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
import passport from "../config/passport.js";
import v1Router from "./platform/gateway/v1.router.js";

import { healthRouter } from "./platform/health/health.controller.js";

export function createApp() {
  // Initialize Sentry
  initSentry();

  const app = express();
  const server = http.createServer(app);

  // Global BigInt JSON serialization fix
  BigInt.prototype.toJSON = function () {
      return this.toString();
  };

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

  // ============ STATIC FILES ============
  app.use("/uploads", express.static("uploads"));

  // ============ BODY PARSING ============
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ============ PASSPORT ============
  app.use(passport.initialize());

  // ============ API GATEWAY ============
  app.use("/api/v1", v1Router);

  // Platform Routes
  app.use("/api", healthRouter);

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
