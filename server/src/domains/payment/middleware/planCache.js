/**
 * Smart Gateway Plan & Catalog Cache Middleware
 * 
 * Multi-tier caching:
 * 1. In-Memory LRU Map (<0.1ms) - 5 minutes TTL
 * 2. Distributed Redis Cache (<2ms) - 1 hour TTL
 * 3. Request Coalescing (Deduplicates 10 concurrent requests -> 1 Java query)
 * 4. Circuit Breaker Fallback (Serves stale cache if Java restarts)
 */

import { getCache, setCache, delPattern } from '../../../infrastructure/cache/redis.client.js';
import { coalesceRequest } from '../../../infrastructure/gateway/requestCoalescer.js';
import { javaPaymentBreaker } from '../../../infrastructure/resilience/circuitBreaker.js';
import { callPaymentService } from '../../../infrastructure/gateway/javaPayment.client.js';

// In-Memory L1 Cache Map
const memoryCache = new Map();
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REDIS_TTL_SEC = 60 * 60; // 1 hour

/**
 * Cache middleware for public /plans catalog endpoint
 */
export const planCatalogCacheMiddleware = async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const role = (req.query.role || 'all').toLowerCase();
  const currency = (req.query.currency || 'INR').toUpperCase();
  const cacheKey = `plans:catalog:${role}:${currency}`;
  const now = Date.now();

  // 1. Check Memory L1 Cache (<0.1ms)
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry && now - memEntry.timestamp < MEMORY_TTL_MS) {
    res.setHeader('X-Cache', 'HIT-MEMORY');
    return res.status(200).json(memEntry.data);
  }

  // 2. Check Redis L2 Cache (<2ms)
  try {
    const redisData = await getCache(cacheKey);
    if (redisData) {
      // Re-populate memory cache
      memoryCache.set(cacheKey, { data: redisData, timestamp: now });
      res.setHeader('X-Cache', 'HIT-REDIS');
      return res.status(200).json(redisData);
    }
  } catch (err) {
    // Graceful degrade if Redis has issues
  }

  // 3. Cache Miss -> Use Single-Flight Request Coalescing + Circuit Breaker
  try {
    const freshData = await coalesceRequest(cacheKey, async () => {
      return await javaPaymentBreaker.execute(cacheKey, async () => {
        return await callPaymentService({
          method: 'GET',
          path: '/subscriptions/plans',
          params: req.query,
          headers: {
            'X-User-Id': req.user?._id || req.user?.id || 'anonymous',
            'X-User-Role': req.user?.role || role,
          },
        });
      });
    });

    // Populate L1 & L2 caches if data is valid
    if (freshData) {
      memoryCache.set(cacheKey, { data: freshData, timestamp: now });
      await setCache(cacheKey, freshData, REDIS_TTL_SEC);
    }

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(freshData);

  } catch (err) {
    const stale = javaPaymentBreaker.getStaleFallback(cacheKey);
    if (stale) {
      res.setHeader('X-Cache', 'STALE-FALLBACK');
      return res.status(200).json(stale);
    }
    return next(err);
  }
};

/**
 * Invalidate plan cache across Memory and Redis when admin changes plans
 */
export const invalidatePlanCache = async () => {
  memoryCache.clear();
  try {
    await delPattern('plans:catalog:*');
    console.log('[PlanCache] Invalidated all plan catalog caches');
  } catch (err) {
    console.warn('[PlanCache] Redis cache invalidation error:', err.message);
  }
};
