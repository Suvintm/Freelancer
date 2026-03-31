/**
 * Rate Limiter Middleware — Phase 3 (Redis-backed via Upstash)
 *
 * Stores all counters in Redis so they survive server restarts.
 * Without Redis, limits reset every time Render restarts the container,
 * which allows brute-force bypasses.
 *
 * Falls back gracefully if Redis is unreachable (uses memory store).
 */

import rateLimit from "express-rate-limit";
import redis, { redisAvailable } from "../config/redisClient.js";
import { RedisStore } from "rate-limit-redis";

/**
 * Build a RedisStore for express-rate-limit.
 * Falls back to memory store (undefined) if Redis is unavailable.
 */
const makeRedisStore = (prefix) => {
  if (!redisAvailable) {
    return undefined;
  }
  
  try {
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    });
  } catch (err) {
    return undefined;
  }
};


// ─── General API limiter: 100 req / 15 min ────────────────────────────────
// 🛡️ PRODUCTION HARDENING: Lowered from 1000 to protect cloud usage quotas.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: makeRedisStore("rl:general:"),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Boot Profile Limiter: 20 req / 1 minute ──────────────────────────────
// 🚦 SAFETY VALVE: Prevents infinite loops during app startup from consuming bandwidth.
export const bootLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  store: makeRedisStore("rl:boot:"),
  message: {
    success: false,
    message: "App startup loop detected. Please restart the app.",
  },
});

// ─── Auth limiter: 10 login attempts / 15 min ─────────────────────────────
// ⚠️  Phase 3: Redis-backed — survives server restarts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: makeRedisStore("rl:auth:"),
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't penalise successful logins
});

// ─── Register limiter: 5 signups / hour per IP ────────────────────────────
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: makeRedisStore("rl:register:"),
  message: {
    success: false,
    message: "Too many registration attempts, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── File upload limiter: 100 uploads / hour ──────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  store: makeRedisStore("rl:upload:"),
  message: {
    success: false,
    message: "Too many uploads, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Explore limiter: 200 req / min ───────────────────────────────────────
export const exploreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  store: makeRedisStore("rl:explore:"),
});

// ─── Location search limiter: 10 searches / min ───────────────────────────
export const locationSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  store: makeRedisStore("rl:location:"),
  message: {
    success: false,
    message: "Too many location searches, please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Feed limiter: 30 req / min ──────────────────────────────────────────
// 🏎️ CONTENT FLOW PROTECTION: Optimized for Reels and Ads feeds.
export const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 pages per minute is more than enough for a real human
  store: makeRedisStore("rl:feed:"),
  message: {
    success: false,
    message: "Content stream busy. Please slow down.",
  },
});

// ─── Impression limiter: 100 req / min ──────────────────────────────────
// 📈 ANALYTICS PROTECTION: Safeguards ad view tracking endpoints.
export const impressionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: makeRedisStore("rl:impress:"),
  message: {
    success: false,
    message: "Telemetry quota exceeded.",
  },
});

// Export the redis client so server.js can health-check it on startup
export { redis };
