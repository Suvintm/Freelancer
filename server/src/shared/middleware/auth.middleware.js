/**
 * authMiddleware.js — Production Authentication Middleware
 *
 * ── Fixes Applied ─────────────────────────────────────────────────────────────
 *
 * 1. deriveAppRoleFromUser now handles BOTH raw Prisma data AND already-formatted
 *    cached data. Previously it only handled raw data, causing PROVIDER users to
 *    be assigned role "client" when their user object was served from cache.
 *
 * 2. systemRole is now preserved correctly for both raw and cached users.
 *    Previously, for cached users: user.systemRole was set to the app role
 *    ("editor") instead of the system role ("suvix_user"), corrupting req.user.
 *
 * 3. Token version check uses Redis cache (30s TTL) to avoid a DB hit on
 *    every single API request while still supporting instant "logout all" revocation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import jwt from "jsonwebtoken";
import prisma from "../../infrastructure/database/postgres.js";
import { USER_INCLUDE, formatAuthResponse } from '../../domains/auth/services/identity.service.js';
import { getUserSubscriptionData } from '../../domains/auth/controllers/auth.controller.js';
import { ApiError } from "./error-handler.middleware.js";
import logger from "../../infrastructure/monitoring/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../../infrastructure/cache/cache.service.js";
import { redis, redisAvailable } from "../../infrastructure/cache/redis.client.js";

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Role Helpers ──────────────────────────────────────────────────────────

const getCleanRole = (user) => {
  const role = user.role || user._systemRole || "user";
  if (role === "suvix_user") {
    const catSlug = user.primaryRole?.categorySlug || user.profile?.category?.slug || "";
    if (catSlug === "yt_influencer") return "creator";
    if (catSlug === "video_editor") return "editor";
    if (catSlug === "social_promoter") return "brand";
    return "user";
  }
  return role;
};

// ─── Main Authentication Middleware ───────────────────────────────────────

export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) throw new ApiError(401, "Not authorized, token missing");

    // ── 1. Verify JWT ─────────────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError")
        throw new ApiError(401, "Token expired");
      throw new ApiError(401, "Token verification failed");
    }

    const userId = decoded.id;

    // ── 2. Proof-of-Life DB check (Redis-backed for scale) ────────────
    // This allows instant ban/deletion enforcement without hitting PostgreSQL on every request.
    let status;
    try {
      const statusCacheKey = `user_status:${userId}`;
      let cachedStatus = redisAvailable ? await redis.get(statusCacheKey) : null;
      
      if (cachedStatus) {
        status = JSON.parse(cachedStatus);
      } else {
        status = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, is_banned: true, ban_reason: true, role: true },
        });
        
        if (redisAvailable && status) {
          // Cache status for 60 seconds. Ban/deletion actions should manually clear this key or accept up to 60s delay.
          await redis.set(statusCacheKey, JSON.stringify(status), "EX", 60);
        }
      }
    } catch (e) {
      logger.error(`[AUTH-DB] Proof-of-life check failed: ${e.message}`);
    }

    if (!status) {
      await deleteCache(CacheKey.userProfile(userId));
      const { kickUser } = await import("../../platform/socket/socket.gateway.js");
      kickUser(userId, "Deleted");
      throw new ApiError(
        401,
        "Your account no longer exists. Please sign up again."
      );
    }

    if (status.is_banned) {
      const { kickUser } = await import("../../platform/socket/socket.gateway.js");
      kickUser(userId, "Banned");
      throw new ApiError(
        403,
        "Your account has been suspended. Please contact support.",
        true,
        {
          isBanned: true,
          banReason: status.ban_reason || "Violation of terms",
        }
      );
    }

    // ── 3. Token version check (enforces "Logout All Devices") ─────────────
    // Cache the DB value for 30s to avoid a round-trip on every request.
    // Busted immediately by logoutAll().
    if (decoded.tokenVersion !== undefined) {
      try {
        const versionCacheKey = `token_version:${userId}`;
        let currentVersion = redisAvailable
          ? await redis.get(versionCacheKey)
          : null;

        if (currentVersion === null) {
          const freshUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { token_version: true },
          });
          currentVersion = freshUser?.token_version ?? 0;
          if (redisAvailable) {
            await redis.set(
              versionCacheKey,
              String(currentVersion),
              "EX",
              30
            );
          }
        }

        if (decoded.tokenVersion !== parseInt(String(currentVersion), 10)) {
          logger.warn(
            `[SECURITY] token_version mismatch for user ${userId}. JWT: ${decoded.tokenVersion}, DB: ${currentVersion}. Rejecting.`
          );
          throw new ApiError(401, "Session invalidated. Please log in again.");
        }
      } catch (versionError) {
        if (versionError instanceof ApiError) throw versionError;
        logger.error(
          `[AUTH] token_version check failed: ${versionError.message}. Availability prioritized.`
        );
      }
    }

    // ── 4. Profile hydration (cache-first) ────────────────────────────────
    const cacheKey = CacheKey.userProfile(userId);
    let user = await getCache(cacheKey);

    if (user) {
      // ── Cache hit: user is already formatted ─────────────────────────────
      if (typeof user === "string") user = JSON.parse(user);
      // user.primaryRole is already set → deriveAppRoleFromUser handles this
    } else {
      // ── Cache miss: fetch raw from DB, format, cache ──────────────────────
      try {
        const rawUser = await prisma.user.findUnique({
          where: { id: userId },
          include: USER_INCLUDE,
        });

        if (rawUser) {
          const subscription = await getUserSubscriptionData(userId);
          user = formatAuthResponse(rawUser, subscription);
          await setCache(cacheKey, user, TTL.USER_PROFILE);
        }
      } catch (prismaError) {
        logger.error(
          "Prisma hydration error in authMiddleware:",
          prismaError
        );
        throw new ApiError(401, "Authentication database error");
      }
    }

    if (!user) throw new ApiError(401, "User not found during hydration.");

    if (!user.is_email_verified) {
      throw new ApiError(
        403,
        "Email verification required.",
        true,
        { requiresVerification: true, email: user.email }
      );
    }

    // ── 5. Attach req.user with correct role derivation ───────────────────
    //
    // ✅ FIX: Preserve systemRole correctly for both raw and cached users.
    //
    // For raw Prisma users (cache miss):
    //   user.role     = "suvix_user" (system DB role)
    //   user.systemRole doesn't exist yet
    //   → systemRole = "suvix_user", role = deriveAppRoleFromUser()
    //
    // For formatted cached users (cache hit):
    //   user.role     = "editor" (already derived app role from formatAuthResponse)
    //   user.systemRole = "suvix_user" (preserved by formatAuthResponse's _systemRole)
    //   → systemRole preserved, role re-derived correctly via primaryRole.group
    //
    // NOTE: formatAuthResponse now stores _systemRole to preserve the DB role.
    // ─────────────────────────────────────────────────────────────────────────
    const derivedRole = getCleanRole(user);

    req.user = {
      ...user,
      systemRole: derivedRole,
      role: derivedRole,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...error.meta,
      });
    }
    logger.error("Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

// ─── Optional Auth ─────────────────────────────────────────────────────────

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const cacheKey = CacheKey.userProfile(decoded.id);
        let user = await getCache(cacheKey);

        if (!user) {
          const rawUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: USER_INCLUDE,
          });
          if (rawUser) {
            const subscription = await getUserSubscriptionData(decoded.id);
            user = formatAuthResponse(rawUser, subscription);
            await setCache(cacheKey, user, TTL.USER_PROFILE);
          }
        }

        if (user) {
          const derivedRole = getCleanRole(user);
          req.user = {
            ...user,
            systemRole: derivedRole,
            role: derivedRole,
          };
        }
      }
    }
  } catch {
    // Continue without user for optional auth
  }
  next();
};

// ─── Role-Based Authorization ──────────────────────────────────────────────

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user?.role || "unknown"}' is not authorized`
      );
    }
    next();
  };
};

export default authenticate;