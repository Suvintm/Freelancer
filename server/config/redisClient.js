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
let subClient = null;
export let redisAvailable = false;

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
      // 🛡️ Set to null to avoid MaxRetriesPerRequestError. 
      // ioredis will keep retrying based on retryStrategy instead of giving up.
      maxRetriesPerRequest: null, 
      connectTimeout:      10000, // 10s for slow warm-ups
      lazyConnect:          true,
      enableReadyCheck:     true,
      retryStrategy(times) {
        // Reconnect after 2, 4, 8... up to 10 seconds
        return Math.min(times * 200, 10000);
      },
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

    // Initialize subscriber client for Pub/Sub
    subClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      lazyConnect: true,
      retryStrategy(times) {
        return Math.min(times * 200, 10000);
      },
    });
    subClient.connect().catch(() => {});

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
  } catch (err) {
    // Fail silently for cache deletion errors
  }
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
  } catch (err) {
    // Fail silently for pattern deletion errors
  }
};

// Proxy object to ensure safe, non-blocking calls to the live ioredis client
const redisProxy = {
  get: (key) => {
    if (!redisAvailable || !client) return Promise.resolve(null);
    return client.get(key);
  },
  set: (key, value, ...args) => {
    if (!redisAvailable || !client) return Promise.resolve();
    // Ensure value is a string before passing to ioredis
    const toStore = typeof value === "string" ? value : JSON.stringify(value);
    return client.set(key, toStore, ...args);
  },
  incr: (key) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.incr(key);
  },
  expire: (key, ttl) => {
    if (!redisAvailable || !client) return Promise.resolve();
    return client.expire(key, ttl);
  },
  del: (key) => {
    if (!redisAvailable || !client) return Promise.resolve();
    return client.del(key);
  },
  ping: () => {
    if (!redisAvailable || !client) return Promise.reject(new Error("Redis not available"));
    return client.ping();
  },
  call: (...args) => {
    if (!redisAvailable || !client) return Promise.resolve();
    return client.call(...args);
  },

  setbit: (key, offset, value) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.setbit(key, offset, value);
  },

  getbit: (key, offset) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.getbit(key, offset);
  },

  // ── Redis Sorted Set helpers (used by scoreboard algorithm) ────────────────
  /**
   * Add/update a member's score in a sorted set.
   * Used to maintain the real-time reel score board.
   * O(log N)
   */
  zAdd: (key, score, member) => {
    if (!redisAvailable || !client) return Promise.resolve();
    return client.zadd(key, score, member);
  },

  /**
   * Get top-K members by score (highest first). O(log N + K)
   * @param {string} key
   * @param {number} start - 0-based start index
   * @param {number} stop  - 0-based stop index (-1 = all)
   * @returns {Promise<string[]>} array of member strings
   */
  zRevRange: (key, start, stop) => {
    if (!redisAvailable || !client) return Promise.resolve([]);
    return client.zrevrange(key, start, stop);
  },

  /**
   * Get the score of a specific member. O(log N)
   */
  zScore: (key, member) => {
    if (!redisAvailable || !client) return Promise.resolve(null);
    return client.zscore(key, member);
  },

  /**
   * Get sorted set size. O(1)
   */
  zCard: (key) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.zcard(key);
  },

  /**
   * Return a redis pipeline.
   */
  pipeline: () => {
    if (!redisAvailable || !client) {
      // Return a mock pipeline that does nothing if Redis is down
      const mock = {
        setbit: () => mock,
        getbit: () => mock,
        incr: () => mock,
        expire: () => mock,
        hincrby: () => mock, // standard ioredis name
        hIncrBy: () => mock, 
        exec: () => Promise.resolve([]),
      };
      return mock;
    }
    return client.pipeline();
  },

  // ── Redis Hash helpers (used by Bandit/Pacing) ──────────────────────────
  /**
   * Increment a hash field. O(1)
   */
  hIncrBy: (key, field, increment) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.hincrby(key, field, increment);
  },

  /**
   * Get all fields/values from a hash. O(N) where N is field count.
   */
  hGetAll: (key) => {
    if (!redisAvailable || !client) return Promise.resolve({});
    return client.hgetall(key);
  },
};

// Pub/Sub Helpers
export const publish = async (channel, message) => {
  if (!redisAvailable || !client) return;
  try {
    const payload = typeof message === "string" ? message : JSON.stringify(message);
    await client.publish(channel, payload);
    logger.debug(`[Redis] Published to ${channel}`);
  } catch (err) {
    logger.warn(`[Redis] Publish failed to ${channel}: ${err.message}`);
  }
};

export const subscribe = async (channel, callback) => {
  if (!subClient) return;
  try {
    await subClient.subscribe(channel);
    subClient.on("message", (chan, msg) => {

      if (chan === channel) {
        try {
          const parsed = JSON.parse(msg);
          callback(parsed);
        } catch {
          callback(msg);
        }
      }
    });
    logger.info(`[Redis] Subscribed to ${channel} ✅`);
  } catch (err) {
    logger.warn(`[Redis] Subscribe failed to ${channel}: ${err.message}`);
  }
};

export default redisProxy;
