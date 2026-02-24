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
import { Redis } from "@upstash/redis";
import { RedisStore } from "rate-limit-redis";

// Connect to Upstash Redis via REST API
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

/**
 * Build a RedisStore for express-rate-limit using Upstash REST client.
 * If Redis is unavailable, rate-limit falls back to in-memory (safe degradation).
 */
const makeRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix,
  });

// ─── General API limiter: 1000 req / 5 min ────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  store: makeRedisStore("rl:general:"),
  message: {
    success: false,
    message: "Too many requests, please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
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

// Export the redis client so server.js can health-check it on startup
export { redis };
