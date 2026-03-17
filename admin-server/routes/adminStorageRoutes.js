import express from "express";
import {
  getStorageStats,
  getResources,
  deleteResource,
  bulkDelete,
  renameResource
} from "../controllers/adminStorageController.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

/**
 * @route   GET /api/admin/storage/stats
 * @desc    Get Cloudinary usage statistics
 * @access  Admin only
 */
router.get("/stats", getStorageStats);

/**
 * @route   GET /api/admin/storage/resources
 * @desc    Get paginated resources from Cloudinary
 * @access  Admin only
 */
router.get("/resources", getResources);

/**
 * @route   DELETE /api/admin/storage/resource/:publicId
 * @desc    Delete a single resource from Cloudinary
 * @access  Admin only
 */
router.delete("/resource/:publicId", deleteResource);

/**
 * @route   POST /api/admin/storage/bulk-delete
 * @desc    Delete multiple resources from Cloudinary
 * @access  Admin only
 */
router.post("/bulk-delete", bulkDelete);

/**
 * @route   PATCH /api/admin/storage/resource/:publicId
 * @desc    Rename/Edit a resource public ID
 * @access  Admin only
 */
router.patch("/resource/:publicId", renameResource);

export default router;
