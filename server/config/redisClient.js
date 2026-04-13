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
      maxRetriesPerRequest: null, 
      connectTimeout:      10000, 
      lazyConnect:          true,
      enableReadyCheck:     true,
      retryStrategy(times) {
        // 🛡️ [RESILIENCE] Increase retry delay significantly if it keeps failing
        // If it fails more than 3 times, wait 30 seconds between attempts to stop log spam
        if (times > 3) {
            return 30000; 
        }
        return Math.min(times * 1000, 10000);
      },
    });

    client.on("connect", () => {
      redisAvailable = true;
      logger.info("[Redis] Connection established ✅");
    });

    client.on("error", (err) => {
      // 🛡️ [RESILIENCE] Mute redundant "ECONNREFUSED" errors to prevent log flood
      if (err.code === 'ECONNREFUSED') {
          if (!client._hasLoggedError) {
              logger.warn(`[Redis] Connectivity issue: No local Redis found (127.0.0.1:6379). Backend will use DB-only mode.`);
              client._hasLoggedError = true;
          }
          return; // Swallow the error to stop the stack trace spam
      }

      if (redisAvailable || !client.lastError || client.lastError !== err.message) {
        redisAvailable = false;
        client.lastError = err.message;
        logger.error(`[Redis] Error: ${err.message}`);
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
        return Math.min(times * 3000, 30000); // Wait up to 30s
      },
    });

    // Mute subClient errors too
    subClient.on("error", () => {}); 
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

  // ── Redis Set helpers (Production Circuit Breakers) ────────────────────
  sAdd: (key, ...members) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.sadd(key, ...members);
  },
  sadd: (key, ...members) => redisProxy.sAdd(key, ...members),

  sMembers: (key) => {
    if (!redisAvailable || !client) return Promise.resolve([]);
    return client.smembers(key);
  },
  smembers: (key) => redisProxy.sMembers(key),

  sRem: (key, ...members) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.srem(key, ...members);
  },
  srem: (key, ...members) => redisProxy.sRem(key, ...members),

  exists: (key) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.exists(key);
  },
  sInter: (...keys) => {
    if (!redisAvailable || !client) return Promise.resolve([]);
    return client.sinter(...keys);
  },

  // ── Redis Sorted Set helpers (used by scoreboard algorithm) ────────────────
  zAdd: (key, score, member) => {
    if (!redisAvailable || !client) return Promise.resolve();
    return client.zadd(key, score, member);
  },
  zrevrange: (key, start, stop) => {
    if (!redisAvailable || !client) return Promise.resolve([]);
    return client.zrevrange(key, start, stop);
  },
  zRevRange: (key, start, stop) => redisProxy.zrevrange(key, start, stop),

  zScore: (key, member) => {
    if (!redisAvailable || !client) return Promise.resolve(null);
    return client.zscore(key, member);
  },
  zCard: (key) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.zcard(key);
  },
  zIncrBy: (key, increment, member) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.zincrby(key, increment, member);
  },

  // ── Redis Hash helpers (used by Bandit/Pacing) ──────────────────────────
  hIncrBy: (key, field, increment) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.hincrby(key, field, increment);
  },
  hGetAll: (key) => {
    if (!redisAvailable || !client) return Promise.resolve({});
    return client.hgetall(key);
  },
  hDel: (key, ...fields) => {
    if (!redisAvailable || !client) return Promise.resolve(0);
    return client.hdel(key, ...fields);
  },
  // ── Pipeline (Atomic Multi-Command) ─────────────────────────────────────
  // Returns a real pipeline if Redis is available, otherwise a safe no-op chain.
  pipeline: () => {
    if (!redisAvailable || !client) {
      // No-op pipeline: every chained call returns the chain, exec() returns []
      const noop = { exec: () => Promise.resolve([]) };
      const proxy = new Proxy(noop, {
        get: (target, prop) => prop === 'exec' ? target.exec : () => proxy,
      });
      return proxy;
    }
    return client.pipeline();
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

export const redis = redisProxy;
export default redisProxy;
