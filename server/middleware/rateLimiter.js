import rateLimit from "express-rate-limit";

// General API rate limiter - 1000 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000,
  message: {
    success: false,
    message: "Too many requests, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Relaxed for testing
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Registration limiter - 3 attempts per hour
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: "Too many registration attempts, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter - 10 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    message: "Too many uploads, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// Explore limiter - 200 requests per minute
export const exploreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute (safe)
});

// Location search limiter - 10 requests per minute (prevent scraping)
export const locationSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 searches per minute
  message: {
    success: false,
    message: "Too many location searches, please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
