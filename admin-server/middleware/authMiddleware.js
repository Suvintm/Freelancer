import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../utils/cache.js";

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, token missing");
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new ApiError(401, "Token expired, please login again");
      }
      if (jwtError.name === "JsonWebTokenError") {
        throw new ApiError(401, "Invalid token");
      }
      throw new ApiError(401, "Token verification failed");
    }

    // Get user — check Redis cache first (5 min TTL)
    const cacheKey = CacheKey.userProfile(decoded.id);
    let user = await getCache(cacheKey);

    if (user) {
      // Cache hit — parse if string (Upstash may return object or string)
      if (typeof user === "string") user = JSON.parse(user);
    } else {
      // Cache miss — fetch from PostgreSQL via Prisma and cache
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_banned: true,
          ban_reason: true,
          profile_picture: true,
          // Add other needed fields but exclude password_hash
        }
      });
      
      if (user) {
        // Map Prisma snake_case fields to camelCase for frontend compatibility
        user._id = user.id; // Compatibility with Mongoose _id
        user.isBanned = user.is_banned;
        user.banReason = user.ban_reason;
        user.profilePicture = user.profile_picture;
        
        await setCache(cacheKey, user, TTL.USER_PROFILE);
      }
    }

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if user is banned — NEVER serve cached banned users
    if (user.isBanned) {
      await deleteCache(cacheKey); // Force fresh check next time
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: "Your account has been suspended. Please contact support.",
        banReason: user.banReason || "Violation of terms of service",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    logger.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// Optional auth - extracts user if token present, but doesn't fail if not
// Use for public pages where we want to track logged-in visitors
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          is_banned: true 
        }
      });
      
      if (user && !user.is_banned) {
        user._id = user.id; // Compatibility mapping
        req.user = user;
      }
    }
  } catch (error) {
    // Don't fail - just continue without user
  }
  next();
};

// Optional: Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

export default protect;

