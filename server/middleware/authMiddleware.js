import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../utils/cache.js";
import { redis, redisAvailable } from "../config/redisClient.js";

const JWT_SECRET = process.env.JWT_SECRET;

const mapGroupToAppRole = (group, systemRole) => {
  if (systemRole === "admin") return "admin";
  if (group === "CLIENT") return "client";
  if (group === "PROVIDER") return "editor";
  return "client";
};

const deriveAppRoleFromUser = (user) => {
  const primaryMapping =
    user.profile?.roles?.find((mapping) => mapping.isPrimary) ||
    user.profile?.roles?.[0];
  const group =
    user.profile?.category?.roleGroup ||
    primaryMapping?.subCategory?.category?.roleGroup ||
    "CLIENT";

  return mapGroupToAppRole(group, user.role);
};

/**
 * Protect Middleware (PostgreSQL)
 * Authenticates user via JWT and fetches from PostgreSQL + Profile
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) throw new ApiError(401, "Not authorized, token missing");

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") throw new ApiError(401, "Token expired");
      throw new ApiError(401, "Token verification failed");
    }

    // 🛡️ HYBRID PRODUCTION GUARD: Always verify 'Proof of Life' in DB for security.
    // Heavy profile data is still cached in Redis for performance.
    
    // 1. JWT Decoded Check (Handled above)
    const userId = decoded.id;

    // 2. CHECK POSTGRES FIRST (Lightweight existence & ban check)
    // This is extremely fast (indexed ID) and ensures total session revoke capability.
    let status;
    try {
        status = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, is_banned: true, ban_reason: true, role: true }
        });
    } catch (e) {
        logger.error(`[AUTH-DB] Proof-of-life check failed: ${e.message}`);
    }

    // 🚩 REVOCATION: If user is missing or banned in DB, we MUST kick them instantly.
    if (!status) {
        const cacheKey = CacheKey.userProfile(userId);
        await deleteCache(cacheKey);
        
        // 🧪 [SILENT KICK] Trigger real-time socket logout
        const { kickUser } = await import("../socket.js");
        kickUser(userId, "Deleted");
        
        throw new ApiError(401, "Your account no longer exists. Please sign up again.");
    }

    if (status.is_banned) {
        // 🔥 Real-time kick for Banned status
        const { kickUser } = await import("../socket.js");
        kickUser(userId, "Banned");

        throw new ApiError(403, "Your account has been suspended. Please contact support.", true, { 
          isBanned: true,
          banReason: status.ban_reason || "Violation of terms"
        });
    }

    // 🛡️ TOKEN VERSION CHECK — Enforces "Log Out All Devices"
    // We cache the DB value for 30 seconds to avoid a DB hit on every API request.
    // Busted immediately when logoutAll is called.
    if (decoded.tokenVersion !== undefined) {
      try {
        const versionCacheKey = `token_version:${userId}`;
        let currentVersion = redisAvailable ? await redis.get(versionCacheKey) : null;

        if (currentVersion === null) {
          // Cache miss — hit the DB and prime the cache
          const freshUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { token_version: true }
          });
          currentVersion = freshUser?.token_version ?? 0;
          if (redisAvailable) {
            await redis.set(versionCacheKey, String(currentVersion), "EX", 30); // 30-second TTL
          }
        }

        if (decoded.tokenVersion !== parseInt(String(currentVersion), 10)) {
          logger.warn(`[SECURITY] token_version mismatch for user ${userId}. JWT: ${decoded.tokenVersion}, DB: ${currentVersion}. Rejecting.`);
          throw new ApiError(401, "Session invalidated. Please log in again.");
        }
      } catch (versionError) {
        if (versionError instanceof ApiError) throw versionError;
        // If DB check itself fails (e.g. schema mismatch), log and continue
        // We ensure we don't crash the whole app just for a secondary check.
        logger.error(`[AUTH] token_version check failed: ${versionError.message}. Availability prioritized.`);
      }
    }

    // 3. CACHE HYDRATION (Full Profile Data)
    const cacheKey = CacheKey.userProfile(userId);
    let user = await getCache(cacheKey);

    if (user) {
      if (typeof user === "string") user = JSON.parse(user);
    } else {
      // Full Hydration (Profile + Categories + Roles)
      try {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: {
              include: {
                category: true,
                roles: {
                  include: {
                    subCategory: {
                      include: { category: true }
                    }
                  }
                }
              }
            },
          }
        });
      } catch (prismaError) {
        logger.error("Prisma hydration error in authMiddleware:", prismaError);
        throw new ApiError(401, "Authentication database error");
      }
      
      if (user) await setCache(cacheKey, user, TTL.USER_PROFILE);
    }

    if (!user) throw new ApiError(401, "User not found during hydration.");
    
    // Flatten profile data onto the user object (Standard API contract)
    if (user.profile) {
        user.username = user.profile.username;
        user.name = user.profile.name;
        user.profile_picture = user.profile.profile_picture;
    }
    user.systemRole = user.role;
    user.role = deriveAppRoleFromUser(user);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ 
        success: false, 
        message: error.message,
        ...error.meta 
      });
    }
    logger.error("Auth Middleware Error:", error);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

/**
 * Optional Auth (PostgreSQL)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded && decoded.id) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
              profile: {
                include: {
                  category: true,
                  roles: {
                    include: {
                      subCategory: {
                        include: { category: true }
                      }
                    }
                  }
                }
              }
            }
          });
          if (user) {
            // Flatten if found
            if (user.profile) {
                user.username = user.profile.username;
                user.name = user.profile.name;
                user.profile_picture = user.profile.profile_picture;
            }
            user.systemRole = user.role;
            user.role = deriveAppRoleFromUser(user);
            req.user = user;
          }
        } catch (prismaError) {
          logger.error("Prisma query error in optionalAuth:", prismaError);
        }
      }
    }
  } catch (error) {
    // Continue without user
  }
  next();
};

/**
 * Role-based authorization
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user?.role || 'unknown'}' is not authorized`);
    }
    next();
  };
};

export default authenticate;
