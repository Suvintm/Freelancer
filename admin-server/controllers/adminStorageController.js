/**
 * Admin Storage Controller
 * Interfaces with Cloudinary Admin API for resource management and analytics
 */

import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Get Cloudinary Storage Stats
 * GET /api/admin/storage/stats
 */
export const getStorageStats = asyncHandler(async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();
    
    // Format bytes helper
    const formatBytes = (bytes) => {
      if (!bytes) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    res.json({
      success: true,
      stats: {
        plan: usage.plan || "Free",
        storage: {
          used: usage.storage?.usage || 0,
          limit: usage.storage?.quota || 0,
          usedFormatted: formatBytes(usage.storage?.usage),
          limitFormatted: formatBytes(usage.storage?.quota),
          percent: usage.storage?.quota > 0 ? Math.round((usage.storage?.usage / usage.storage?.quota) * 100) : 0
        },
        bandwidth: {
          used: usage.bandwidth?.usage || 0,
          limit: usage.bandwidth?.quota || 0,
          usedFormatted: formatBytes(usage.bandwidth?.usage),
          limitFormatted: formatBytes(usage.bandwidth?.quota),
          percent: usage.bandwidth?.quota > 0 ? Math.round((usage.bandwidth?.usage / usage.bandwidth?.quota) * 100) : 0
        },
        credits: {
          used: usage.credits?.usage || 0,
          limit: usage.credits?.quota || 25,
          percent: Math.round(((usage.credits?.usage || 0) / (usage.credits?.quota || 25)) * 100)
        },
        resources: {
          images: usage.resources?.images || 0,
          videos: usage.resources?.videos || 0,
          raw: usage.resources?.raw || 0
        },
        lastUpdated: usage.last_updated || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Cloudinary stats error:", error);
    throw new ApiError(500, "Failed to fetch Cloudinary statistics");
  }
});

/**
 * Get Cloudinary Resources (Paginated)
 * GET /api/admin/storage/resources
 */
export const getResources = asyncHandler(async (req, res) => {
  const { 
    type = "upload", 
    resource_type = "image", 
    next_cursor, 
    max_results = 20,
    prefix, // Filter by folder/prefix
    tag
  } = req.query;

  try {
    const options = {
      type,
      resource_type,
      max_results: parseInt(max_results),
      next_cursor,
    };

    if (prefix) options.prefix = prefix;
    if (tag) options.tag = tag;

    const result = await cloudinary.api.resources(options);

    res.json({
      success: true,
      resources: result.resources,
      next_cursor: result.next_cursor,
      rate_limit_allowed: result.rate_limit_allowed,
      rate_limit_remaining: result.rate_limit_remaining,
    });
  } catch (error) {
    console.error("Cloudinary resource fetch error:", error);
    throw new ApiError(500, "Failed to fetch resources from Cloudinary");
  }
});

/**
 * Delete a single resource
 * DELETE /api/admin/storage/resource/:publicId
 */
export const deleteResource = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { resource_type = "image" } = req.query;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
      invalidate: true
    });

    if (result.result !== "ok") {
      throw new ApiError(400, `Cloudinary deletion failed: ${result.result}`);
    }

    res.json({
      success: true,
      message: "Resource deleted successfully"
    });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new ApiError(500, error.message || "Failed to delete resource");
  }
});

/**
 * Bulk Delete resources
 * POST /api/admin/storage/bulk-delete
 */
export const bulkDelete = asyncHandler(async (req, res) => {
  const { publicIds, resource_type = "image" } = req.body;

  if (!publicIds || !Array.isArray(publicIds)) {
    throw new ApiError(400, "publicIds must be an array");
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type,
      invalidate: true
    });

    res.json({
      success: true,
      message: "Bulk deletion processed",
      results: result.deleted
    });
  } catch (error) {
    console.error("Cloudinary bulk deletion error:", error);
    throw new ApiError(500, "Failed to perform bulk deletion");
  }
});

/**
 * Rename/Edit Resource Public ID
 * PATCH /api/admin/storage/resource/:publicId
 */
export const renameResource = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { toPublicId, resource_type = "image" } = req.body;

  if (!toPublicId) {
    throw new ApiError(400, "New public ID (toPublicId) is required");
  }

  try {
    const result = await cloudinary.uploader.rename(publicId, toPublicId, {
      resource_type,
      overwrite: true,
      invalidate: true
    });

    res.json({
      success: true,
      message: "Resource renamed successfully",
      resource: result
    });
  } catch (error) {
    console.error("Cloudinary rename error:", error);
    throw new ApiError(500, error.message || "Failed to rename resource");
  }
});
