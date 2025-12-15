/**
 * Storage Check Middleware
 * Blocks uploads when storage limit is reached
 */

import User from "../models/User.js";
import { calculateStorageUsed } from "../controllers/storageController.js";
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return next();
    }

    // Calculate current storage
    const storageUsed = await calculateStorageUsed(req.user._id);

    // Update user's storage (cache it)
    user.storageUsed = storageUsed;
    user.storageLastCalculated = new Date();
    await user.save();

    // Check if storage is exceeded
    if (storageUsed >= user.storageLimit) {
      logger.warn(`Storage limit exceeded for user ${req.user._id}: ${storageUsed}/${user.storageLimit}`);
      throw new ApiError(
        403,
        "Storage limit exceeded. Please upgrade your storage plan or delete some files to continue uploading.",
        {
          storageUsed,
          storageLimit: user.storageLimit,
          usedPercent: Math.round((storageUsed / user.storageLimit) * 100),
        }
      );
    }

    // Attach storage info to request for later use
    req.storageInfo = {
      used: storageUsed,
      limit: user.storageLimit,
      remaining: user.storageLimit - storageUsed,
      plan: user.storagePlan,
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
