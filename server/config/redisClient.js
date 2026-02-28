/**
 * redisClient.js — ioredis singleton for server-side caching.
 *
 * Uses REDIS_URL from environment if available (Upstash / Redis Cloud / self-hosted).
 * Falls back gracefully if Redis is unavailable — all cache functions become no-ops.
 *
 * Usage:
 *   import { getCache, setCache, delCache } from '../config/redisClient.js';
 *   const cached = await getCache('key');
 *   await setCache('key', data, 300); // TTL in seconds
 *   await delCache('key');
 */
import Redis from "ioredis";
import logger from "../utils/logger.js";

let client = null;
let redisAvailable = false;

const connect = () => {
  if (client) return;

  let redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl) {
    logger.warn("[Redis] REDIS_URL not set — cache disabled.");
    return;
  }

  // Support Upstash HTTPS URLs by converting to standard Redis URI
  // rate-limit-redis and ioredis need the native protocol
  if (redisUrl.startsWith("https://") && redisToken) {
    const host = redisUrl.replace("https://", "");
    redisUrl = `rediss://default:${redisToken}@${host}:6379`;
  }

  try {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout:       5000,
      lazyConnect:          true,
      enableReadyCheck:     true,
    });

    client.on("connect", () => {
      redisAvailable = true;
      logger.info("[Redis] Connection established ✅");
    });

    client.on("error", (err) => {
      // Avoid spamming the same error if it keeps failing
      if (redisAvailable || !client.lastError || client.lastError !== err.message) {
        redisAvailable = false;
        client.lastError = err.message;
        logger.warn(`[Redis] Connectivity issue: ${err.message} — apps will fallback to DB.`);
      }
    });

    client.on("close", () => {
      redisAvailable = false;
    });

    client.connect().catch(() => {});
  } catch (err) {
    logger.warn(`[Redis] Init failed: ${err.message}`);
  }
};

connect();

/**
 * Get a cached value. Returns parsed JSON or null if miss / Redis unavailable.
 */
export const getCache = async (key) => {
  if (!redisAvailable || !client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    logger.debug(`[Redis] CACHE HIT: ${key}`);
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Set a cached value with a TTL (seconds). Defaults to 5 minutes.
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redisAvailable || !client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    logger.debug(`[Redis] CACHE SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch {
    // silent fail — cache set failure should never break the request
  }
};

/**
 * Delete a cached key (use after mutations to invalidate stale data).
 */
export const delCache = async (key) => {
  if (!redisAvailable || !client) return;
  try {
    await client.del(key);
    logger.debug(`[Redis] CACHE DEL: ${key}`);
  } catch {}
};

/**
 * Delete all keys matching a pattern (e.g. 'ads:*').
 */
export const delPattern = async (pattern) => {
  if (!redisAvailable || !client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
    logger.debug(`[Redis] CACHE DEL PATTERN: ${pattern} (${keys.length} keys)`);
  } catch {}
};

export default client;
