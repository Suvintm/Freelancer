import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../utils/cache.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Protect Middleware (PostgreSQL)
 * Authenticates user via JWT and fetches from PostgreSQL
 */
const protect = async (req, res, next) => {
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

    // Get user — check Redis cache first
    const cacheKey = CacheKey.userProfile(decoded.id);
    let user = await getCache(cacheKey);

    if (user) {
      if (typeof user === "string") user = JSON.parse(user);
    } else {
      // Fetch from PostgreSQL
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            is_banned: true,
            ban_reason: true,
            profile_picture: true
        }
      });
      if (user) await setCache(cacheKey, user, TTL.USER_PROFILE);
    }

    if (!user) throw new ApiError(401, "User not found");

    // Check ban status (source of truth)
    if (user.is_banned) {
      await deleteCache(cacheKey);
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: "Your account has been suspended.",
        banReason: user.ban_reason || "Violation of terms",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
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
      const user = await prisma.user.findUnique({
          where: { id: decoded.id }
      });
      if (user && !user.is_banned) {
        req.user = user;
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
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized`);
    }
    next();
  };
};

export default protect;

