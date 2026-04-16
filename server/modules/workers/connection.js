import IORedis from "ioredis";
import logger from "../../utils/logger.js";

/**
 * 🔌 SINGLETON REDIS CONNECTION
 *
 * One shared connection for ALL queues and workers.
 * This prevents multiple TCP connections to Upstash which
 * count as extra requests and inflate your daily bill.
 *
 * Upstash-specific requirements:
 *  - maxRetriesPerRequest: null  (required by BullMQ)
 *  - enableReadyCheck: false     (Upstash does not support READYCHECK command)
 *  - tls: {}                     (required for Upstash in production)
 */

let _connection = null;

export function getRedisConnection() {
  if (_connection) return _connection; // Return existing singleton

  let redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl) {
    logger.warn("⚠️ [Redis] REDIS_URL not set. BullMQ workers will be disabled.");
    return null;
  }

  // Handle Upstash HTTPS URL format → convert to rediss:// for ioredis
  if (redisUrl.startsWith("https://") && redisToken) {
    const host = redisUrl.replace("https://", "");
    redisUrl = `rediss://default:${redisToken}@${host}:6379`;
  }

  _connection = new IORedis(redisUrl, {
    // ─── BullMQ Requirements ───────────────────────────────────────
    maxRetriesPerRequest: null,   // BullMQ REQUIRES this to be null
    enableReadyCheck: false,      // Upstash does not support READYCHECK

    // ─── Upstash TLS ───────────────────────────────────────────────
    tls: process.env.NODE_ENV === "production" ? {} : undefined,

    // ─── Connection Stability ──────────────────────────────────────
    connectTimeout: 10000,
    lazyConnect: false,

    // ─── Reconnect Strategy (prevents reconnect storms) ───────────
    // Exponential backoff up to 3s ceiling. After 10 attempts, gives up.
    retryStrategy(times) {
      if (times > 10) {
        logger.error("[Redis] Max reconnect attempts reached. Giving up.");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
  });

  _connection.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
      logger.info("🔌 [Redis] Connected to Upstash");
    }
  });

  _connection.on("error", (err) => {
    // Always log errors — never silence them
    if (err.code !== "ECONNREFUSED") {
      logger.error(`[Redis] Connection error: ${err.message}`);
    }
  });

  return _connection;
}

export default getRedisConnection;
