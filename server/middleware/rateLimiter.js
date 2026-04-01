/**
 * Rate Limiter Middleware — Phase 4 (Instagram-Grade Defenses)
 *
 * Implements a Multi-Layer Defensive Perimeter with tiered quotas,
 * Redis persistence (Upstash), and standard Retry-After headers.
 */

import rateLimit from "express-rate-limit";
import redis, { redisAvailable } from "../config/redisClient.js";
import { RedisStore } from "rate-limit-redis";
import logger from "../utils/logger.js";

/**
 * Build a RedisStore for express-rate-limit.
 * Falls back to memory store (undefined) if Redis is unavailable.
 */
const makeRedisStore = (prefix) => {
  if (!redisAvailable) return undefined;
  try {
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    return undefined;
  }
};

/**
 * Standard Production Handler
 * Logs the breach and sends a 429 with Retry-After headers.
 */
const limitHandler = (req, res, next, options) => {
  logger.warn(`[RateLimit] ${options.prefix || 'General'} breach by IP: ${req.ip} on ${req.originalUrl}`);
  res.status(options.statusCode).json(options.message);
};

// ─── TIER 1: AUTH (Fortress) ─────────────────────────────────────────────
// Protects sensitive entry points. 20 attempts / 15 min.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  store: makeRedisStore("auth"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'AUTH' }),
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// ─── TIER 2: FEED (The Stream) ────────────────────────────────────────────
// Optimized for content scrolling. 60 pages / min.
export const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: makeRedisStore("feed"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'FEED' }),
  message: { success: false, message: "Stream busy. Please slow down." },
});

// ─── TIER 3: SOCIAL (Interactions) ────────────────────────────────────────
// Likes, Comments, Follows. 100 actions / 15 min.
export const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: makeRedisStore("social"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'SOCIAL' }),
  message: { success: false, message: "Interaction quota exceeded. Please wait a moment." },
});

// ─── TIER 4: HEAVY (Computational/IO) ─────────────────────────────────────
// Search TRIE, AI, and Uploads. 10 req / min.
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  store: makeRedisStore("heavy"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'HEAVY' }),
  message: { success: false, message: "Server is processing heavy requests. Please wait a minute." },
});

// ─── TIER 5: TELEMETRY (Analytics) ────────────────────────────────────────
// Impressions and Watch-time. 200 req / 5 min.
// Higher limit as these are small and non-blocking.
export const impressionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  store: makeRedisStore("impress"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'TELEMETRY' }),
  message: { success: false, message: "Telemetry quota reached." },
});

// ─── TIER 6: PUBLIC API (General) ─────────────────────────────────────────
// Catch-all for API navigation. 300 req / 15 min.
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  store: makeRedisStore("general"),
  handler: (req, res, next, options) => limitHandler(req, res, next, { ...options, prefix: 'GENERAL' }),
  message: { success: false, message: "Too many navigation requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Legacy exports for backward compatibility during migration
export const generalLimiter = publicApiLimiter;
export const bootLimiter = publicApiLimiter;
export const registerLimiter = authLimiter;
export const uploadLimiter = heavyLimiter;
export const exploreLimiter = feedLimiter;
export const locationSearchLimiter = heavyLimiter;

export { redis };
