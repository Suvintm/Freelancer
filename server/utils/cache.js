/**
 * Redis Cache Utility
 *
 * Thin wrapper around @upstash/redis providing:
 * - getCache / setCache / deleteCache helpers
 * - Automatic JSON serialization/deserialization
 * - Silent failure (never crashes the app if Redis is down)
 * - Cache key constants for all features
 */

import { redis } from "../middleware/rateLimiter.js";
import logger from "./logger.js";

// ─── TTL Constants (seconds) ───────────────────────────────────────────────
export const TTL = {
  SUBSCRIPTION_PLANS: 60 * 60,    // 1 hour   — plans rarely change
  USER_PROFILE:       60 * 5,     // 5 minutes — auth middleware
  EXPLORE_EDITORS:    60 * 2,     // 2 minutes — explore page
  EXPLORE_FILTERS:    60 * 10,    // 10 minutes — filter options (skills/countries)
  NOTIFICATION_COUNT: 30,         // 30 seconds — unread badge
};

// ─── Cache Key Builders ────────────────────────────────────────────────────
export const CacheKey = {
  subscriptionPlans: (feature = "all") => `cache:subscription:plans:${feature}`,
  userProfile:       (userId)          => `cache:user:${userId}`,
  exploreEditors:    (queryHash)       => `cache:explore:editors:${queryHash}`,
  exploreFilters:    ()                => `cache:explore:filters`,
  notificationCount: (userId)          => `cache:notifications:unread:${userId}`,
};

// ─── Core Helpers ──────────────────────────────────────────────────────────

/**
 * Try to get a cached value.
 * Returns parsed data or null (also returns null on any Redis error).
 */
export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ?? null;
  } catch (err) {
    logger.warn(`[Cache] GET failed for key "${key}": ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value with a TTL.
 * Silently ignores errors so the app never crashes due to Redis issues.
 */
export const setCache = async (key, value, ttlSeconds) => {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    logger.warn(`[Cache] SET failed for key "${key}": ${err.message}`);
  }
};

/**
 * Delete one or more cache keys.
 * Accepts a single key (string) or an array of keys.
 */
export const deleteCache = async (keys) => {
  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return;
    await redis.del(...keyArray);
    logger.debug(`[Cache] Invalidated ${keyArray.length} key(s): ${keyArray.join(", ")}`);
  } catch (err) {
    logger.warn(`[Cache] DEL failed: ${err.message}`);
  }
};

/**
 * Cache-aside helper — the most common pattern.
 *
 * Usage:
 *   const data = await withCache(key, TTL.USER_PROFILE, () => User.findById(id).lean());
 *
 * It checks the cache first. If hit → returns cached data.
 * If miss → calls the fetcher, caches the result, and returns it.
 */
export const withCache = async (key, ttlSeconds, fetcher) => {
  const cached = await getCache(key);
  if (cached !== null) {
    // @upstash/redis auto-parses JSON, so cached may already be an object
    return typeof cached === "string" ? JSON.parse(cached) : cached;
  }

  const data = await fetcher();
  if (data !== null && data !== undefined) {
    await setCache(key, data, ttlSeconds);
  }
  return data;
};

/**
 * Build a short hash from an object (for cache key generation from query params).
 * Uses a simple deterministic stringify — good enough for cache keys.
 */
export const hashQuery = (obj) => {
  const sorted = Object.keys(obj)
    .sort()
    .reduce((acc, k) => {
      if (obj[k] !== "" && obj[k] !== undefined) acc[k] = obj[k];
      return acc;
    }, {});
  return Buffer.from(JSON.stringify(sorted)).toString("base64url").slice(0, 32);
};
