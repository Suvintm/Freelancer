/**
 * Storage Check Middleware
 * Blocks uploads when storage limit is reached
 */

import prisma from "../config/prisma.js";
import { calculateStorageUsed } from "../controllers/adminStorageController.js";
import { ApiError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

/**
 * Check storage before allowing file uploads
 * This middleware should be placed BEFORE upload middlewares
 */
export const checkStorage = async (req, res, next) => {
  try {
    // Only check for authenticated users who are editors
    if (!req.user || req.user.role !== "editor") {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id || req.user._id }
    });

    if (!user) {
      return next();
    }

    // Storage metadata handled by legacy fallback till full migration
    const userLimit = 500 * 1024 * 1024; // Default 500MB if missing from Prisma
    const storageUsed = await calculateStorageUsed(req.user.id || req.user._id);

    // Update user's storage in PostgreSQL (optional if we want to sync)
    // In this phase, we just check against the hardcoded/default limit
    
    // Check if storage is exceeded
    if (storageUsed >= userLimit) {
      logger.warn(`Storage limit exceeded for user ${req.user.id}: ${storageUsed}/${userLimit}`);
      throw new ApiError(
        403,
        "Storage limit exceeded. Please upgrade your storage plan or delete some files to continue uploading.",
        {
          storageUsed,
          storageLimit: userLimit,
          usedPercent: Math.round((storageUsed / userLimit) * 100),
        }
      );
    }

    // Attach storage info to request for later use
    req.storageInfo = {
      used: storageUsed,
      limit: userLimit,
      remaining: userLimit - storageUsed,
      plan: "free", // Default to free plan
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        storageInfo: err.data,
      });
    }
    // Don't block on other errors, just log them
    logger.error("Storage check error:", err.message);
    next();
  }
};

/**
 * Check storage with estimated file size
 * Useful for pre-upload validation
 */
export const checkStorageWithSize = (estimatedSizeBytes) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "editor") {
        return next();
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return next();
      }

      const storageUsed = await calculateStorageUsed(req.user._id);
      const newTotal = storageUsed + estimatedSizeBytes;

      if (newTotal > user.storageLimit) {
        throw new ApiError(
          403,
          "This upload would exceed your storage limit. Please upgrade or delete files.",
          {
            storageUsed,
            storageLimit: user.storageLimit,
            requiredSpace: estimatedSizeBytes,
            overflow: newTotal - user.storageLimit,
          }
        );
      }

      next();
    } catch (err) {
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          storageInfo: err.data,
        });
      }
      logger.error("Storage check error:", err.message);
      next();
    }
  };
};

export default { checkStorage, checkStorageWithSize };
