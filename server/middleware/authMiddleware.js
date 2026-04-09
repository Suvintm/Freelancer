import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "./errorHandler.js";
import logger from "../utils/logger.js";
import { getCache, setCache, deleteCache, CacheKey, TTL } from "../utils/cache.js";

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

    // Validate decoded token has required fields
    if (!decoded || !decoded.id) {
      throw new ApiError(401, "Invalid token: missing user ID");
    }

    // Get user — check Redis cache first
    const cacheKey = CacheKey.userProfile(decoded.id);
    let user = await getCache(cacheKey);

    if (user) {
      if (typeof user === "string") user = JSON.parse(user);
    } else {
      // Fetch from PostgreSQL (Auth + Profile Split)
      try {
        user = await prisma.user.findUnique({
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
            },
          }
        });
      } catch (prismaError) {
        logger.error("Prisma query error in authMiddleware:", prismaError);
        throw new ApiError(401, "Authentication database error");
      }
      
      if (user) await setCache(cacheKey, user, TTL.USER_PROFILE);
    }

    if (!user) throw new ApiError(401, "User not found");
    
    // Check for banned user (Added for production-level security)
    if (user.is_banned) {
        return res.status(403).json({ 
            success: false, 
            message: user.ban_reason || "Your account has been suspended.", 
            isBanned: true,
            banReason: user.ban_reason
        });
    }

    // Flatten profile data onto the user object for convenience (standard across app/web)
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
