import axios from "axios";
import { getRedisClient } from "../redis/client.js";

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:8080";
const SERVICE_SECRET = process.env.SERVICE_SECRET || "d7fddff0b3f4d37d6eb5675377526003d7e8dbe4eacaab3d5aec4567966ed543";

/**
 * High-speed middleware to enforce plan feature access (e.g. verified_badge, custom_domain)
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      // 1. Check Redis Cache (< 1ms)
      const redis = getRedisClient();
      if (redis) {
        try {
          const cached = await redis.get(`subscription:${userId}:entitlements`);
          if (cached) {
            const entitlements = JSON.parse(cached);
            if (entitlements.features && entitlements.features[featureName] === true) {
              req.entitlements = entitlements;
              return next();
            } else {
              return res.status(403).json({
                success: false,
                code: "UPGRADE_REQUIRED",
                feature: featureName,
                message: `The feature [${featureName}] requires a subscription plan upgrade.`,
                upgradeUrl: "/subscription",
              });
            }
          }
        } catch (redisErr) {
          console.warn("[SubscriptionGate] Redis cache check failed:", redisErr.message);
        }
      }

      // 2. Fallback to Java Payment Microservice
      const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/subscriptions/entitlements`, {
        params: { userId: String(userId) },
        headers: {
          "X-Service-Secret": SERVICE_SECRET,
          "X-User-Id": String(userId),
        },
        timeout: 3000,
      });

      const entitlements = response.data;
      if (entitlements.features && entitlements.features[featureName] === true) {
        req.entitlements = entitlements;
        return next();
      }

      return res.status(403).json({
        success: false,
        code: "UPGRADE_REQUIRED",
        feature: featureName,
        message: `The feature [${featureName}] requires a subscription plan upgrade.`,
        upgradeUrl: "/subscription",
      });
    } catch (err) {
      console.error("[SubscriptionGate] Feature gate verification error:", err.message);
      // Fail open in case of network timeout or internal error for resilience
      return next();
    }
  };
};

/**
 * High-speed middleware to enforce minimum tier level (1 = Free, 2 = Pro, 3 = Elite/Studio/Scale)
 */
export const requireTier = (minimumTierLevel) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/v1/subscriptions/entitlements`, {
        params: { userId: String(userId) },
        headers: {
          "X-Service-Secret": SERVICE_SECRET,
          "X-User-Id": String(userId),
        },
        timeout: 3000,
      });

      const entitlements = response.data;
      if (entitlements.tierLevel >= minimumTierLevel) {
        req.entitlements = entitlements;
        return next();
      }

      return res.status(403).json({
        success: false,
        code: "TIER_UPGRADE_REQUIRED",
        requiredTierLevel: minimumTierLevel,
        currentTierLevel: entitlements.tierLevel,
        message: `Access to this action requires a higher subscription tier.`,
        upgradeUrl: "/subscription",
      });
    } catch (err) {
      console.error("[SubscriptionGate] Tier gate verification error:", err.message);
      return next();
    }
  };
};

// ── In-Memory Micro-Batching Buffer for High-Frequency Quotas ────────────────
// Bundles rapid low-risk events (e.g. chat messages, profile views) into 2-second debounced flushes,
// cutting Serverless Redis & HTTP calls by > 80%!
const quotaBatchBuffer = new Map();
let batchFlushTimer = null;

const HIGH_FREQUENCY_BATCHABLE_FEATURES = new Set([
  "direct_messages",
  "messages",
  "analytics_views",
  "downloads",
  "link_clicks",
]);

const scheduleBatchFlush = () => {
  if (!batchFlushTimer) {
    batchFlushTimer = setTimeout(async () => {
      batchFlushTimer = null;
      if (quotaBatchBuffer.size === 0) return;

      const items = Array.from(quotaBatchBuffer.values());
      quotaBatchBuffer.clear();

      for (const item of items) {
        try {
          await axios.post(
            `${PAYMENT_SERVICE_URL}/api/v1/subscriptions/consume-quota`,
            { featureName: item.featureName, units: item.units, mode: item.mode },
            {
              headers: {
                "X-Service-Secret": SERVICE_SECRET,
                "X-User-Id": String(item.userId),
              },
              timeout: 4000,
            }
          );
        } catch (err) {
          console.warn(`[SubscriptionGate] Micro-batch quota flush failed for ${item.featureName}:`, err.message);
        }
      }
    }, 2000);
  }
};

/**
 * Middleware to check and consume usage quota atomically (e.g. AI tokens, message quota)
 * Supports synchronous atomic gating (critical quotas) and async micro-batching (high-frequency quotas).
 */
export const requireQuota = (featureName, units = 1, mode = "HARD_LIMIT", forceSync = false) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id || req.headers["x-user-id"];
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      // Check if feature is eligible for local micro-batching
      const isBatchable = !forceSync && HIGH_FREQUENCY_BATCHABLE_FEATURES.has(featureName);

      if (isBatchable) {
        // Fast-path: Aggregate locally in memory and schedule 2s flush (0ms latency to client)
        const batchKey = `${userId}:${featureName}:${mode}`;
        const existing = quotaBatchBuffer.get(batchKey) || { userId, featureName, units: 0, mode };
        existing.units += units;
        quotaBatchBuffer.set(batchKey, existing);
        scheduleBatchFlush();

        req.quotaConsumption = { featureName, consumedUnits: units, batched: true };
        return next();
      }

      // Strict synchronous check for critical features (AI tokens, Escrows, Active Listings)
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/v1/subscriptions/consume-quota`,
        { featureName, units, mode },
        {
          headers: {
            "X-Service-Secret": SERVICE_SECRET,
            "X-User-Id": String(userId),
          },
          timeout: 3000,
        }
      );

      req.quotaConsumption = response.data;
      return next();
    } catch (err) {
      if (err.response && err.response.status === 429) {
        return res.status(429).json({
          success: false,
          code: "QUOTA_EXCEEDED",
          feature: featureName,
          details: err.response.data,
          message: err.response.data?.message || "Quota limit reached. Upgrade your plan for higher limits.",
          upgradeUrl: "/subscription",
        });
      }

      console.error("[SubscriptionGate] Quota consumption error:", err.message);
      return next();
    }
  };
};