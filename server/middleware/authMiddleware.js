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
import prisma from "../config/prisma.js";
import { USER_INCLUDE, formatAuthResponse } from "../modules/auth/utils/authHelpers.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../utils/cache.js";
import { redis, redisAvailable } from "../config/redisClient.js";

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Role Helpers ──────────────────────────────────────────────────────────

const mapGroupToAppRole = (group, systemRole) => {
  if (systemRole === "admin") return "admin";
  if (group === "CLIENT") return "client";
  if (group === "PROVIDER") return "editor";
  return "client";
};

/**
 * Derives the application role from a user object.
 *
 * ✅ FIX: Handles BOTH formats:
 *   - Raw Prisma user: has nested user.profile.roles, user.profile.category
 *   - Cached formatted user: has flat user.primaryRole.group
 *
 * Previously only handled raw Prisma users, causing PROVIDER users served
 * from Redis cache to be assigned "client" role (breaking access control).
 */
const deriveAppRoleFromUser = (user) => {
  // ── Case 1: Already-formatted user from cache (has flat primaryRole) ──────
  if (user.primaryRole?.group) {
    // systemRole is the raw DB role ("suvix_user", "admin")
    const systemRole = user.systemRole || user._systemRole || "suvix_user";
    return mapGroupToAppRole(user.primaryRole.group, systemRole);
  }

  // ── Case 2: Raw Prisma user (has nested profile.roles) ────────────────────
  const primaryMapping =
    user.profile?.roles?.find((mapping) => mapping.isPrimary) ||
    user.profile?.roles?.[0];
  const group =
    user.profile?.category?.roleGroup ||
    primaryMapping?.subCategory?.category?.roleGroup ||
    "CLIENT";

  return mapGroupToAppRole(group, user.role);
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
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError")
        throw new ApiError(401, "Token expired");
      throw new ApiError(401, "Token verification failed");
    }

    const userId = decoded.id;

    // ── 2. Proof-of-Life DB check (lightweight — indexed by PK) ────────────
    // This is extremely fast and allows instant ban/deletion enforcement.
    let status;
    try {
      status = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, is_banned: true, ban_reason: true, role: true },
      });
    } catch (e) {
      logger.error(`[AUTH-DB] Proof-of-life check failed: ${e.message}`);
    }

    if (!status) {
      await deleteCache(CacheKey.userProfile(userId));
      const { kickUser } = await import("../socket.js");
      kickUser(userId, "Deleted");
      throw new ApiError(
        401,
        "Your account no longer exists. Please sign up again."
      );
    }

    if (status.is_banned) {
      const { kickUser } = await import("../socket.js");
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
          user = formatAuthResponse(rawUser);
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
    const derivedAppRole = deriveAppRoleFromUser(user);

    req.user = {
      ...user,
      // Preserve the raw DB system role for authorization checks
      systemRole: user._systemRole || user.systemRole || status.role || "suvix_user",
      // Set the application-level role (editor, client, admin)
      role: derivedAppRole,
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
            user = formatAuthResponse(rawUser);
            await setCache(cacheKey, user, TTL.USER_PROFILE);
          }
        }

        if (user) {
          req.user = {
            ...user,
            systemRole: user._systemRole || user.systemRole || "suvix_user",
            role: deriveAppRoleFromUser(user),
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