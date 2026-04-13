import { redis } from "./rateLimiter.js";
import logger from "../utils/logger.js";
import { ApiError } from "./errorHandler.js";

/**
 * PRODUCTION-GRADE ACCOUNT LOCKOUT MIDDLEWARE
 * Tracks failed login attempts in Redis per-email.
 * Threshold: 5 failures / 15 minutes.
 * Lockout: 15 minutes.
 */

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW = 15 * 60; // 15 minutes in seconds

/**
 * Middleware to check if an account is currently locked
 */
export const checkAccountLockout = async (req, res, next) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") return next();

    const normalizedEmail = email.toLowerCase().trim();
    const lockoutKey = `lockout:${normalizedEmail}`;

    // 🛡️ [RESILIENCE] Wrap Redis in try-catch to allow login if Upstash is full/dead
    try {
        const isLocked = await redis.get(lockoutKey);
        if (isLocked) {
            logger.warn(`[SECURITY] Blocked login attempt for locked account: ${normalizedEmail} from IP: ${req.ip}`);
            throw new ApiError(423, "Your account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.");
        }
    } catch (err) {
        if (err instanceof ApiError) throw err;
        logger.error(`⚠️ [REDIS-FAILURE] checkAccountLockout bypassed: ${err.message}`);
    }

    next();
};

/**
 * Track a failed login attempt
 */
export const trackFailedLogin = async (email) => {
    if (!email || typeof email !== "string") return;
    const normalizedEmail = email.toLowerCase().trim();
    const countKey = `fail_count:${normalizedEmail}`;
    const lockoutKey = `lockout:${normalizedEmail}`;

    // 🛡️ [RESILIENCE] Skip lockout tracking if Redis is failing
    try {
        const currentCount = await redis.incr(countKey);
        
        // Set expiry on first failure
        if (currentCount === 1) {
            await redis.expire(countKey, LOCKOUT_WINDOW);
        }

        if (currentCount >= LOCKOUT_THRESHOLD) {
            await redis.set(lockoutKey, "1", "EX", LOCKOUT_WINDOW);
            await redis.del(countKey);
            logger.error(`[SECURITY] Account locked due to brute-force detection: ${normalizedEmail}`);
            return true; // Was locked
        }
    } catch (err) {
        logger.error(`⚠️ [REDIS-FAILURE] trackFailedLogin failed: ${err.message}`);
    }
    
    return false;
};

/**
 * Reset failure count on successful login
 */
export const resetFailedLogin = async (email) => {
    if (!email || typeof email !== "string") return;
    const normalizedEmail = email.toLowerCase().trim();
    // 🛡️ [RESILIENCE] Skip reset if Redis is failing
    try {
        await redis.del(`fail_count:${normalizedEmail}`);
    } catch (err) {
        logger.error(`⚠️ [REDIS-FAILURE] resetFailedLogin failed: ${err.message}`);
    }
};
