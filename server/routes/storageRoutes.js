/**
 * Storage Routes
 * API endpoints for storage management
 */

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getStorageStatus,
  getStoragePlans,
  createStoragePurchaseOrder,
  verifyStoragePurchase,
  getStoragePurchaseHistory,
} from "../controllers/storageController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get current storage status
router.get("/status", getStorageStatus);

// Get available plans
router.get("/plans", getStoragePlans);

// Create purchase order
router.post("/purchase", createStoragePurchaseOrder);

// Verify payment
router.post("/verify", verifyStoragePurchase);

// Get purchase history
router.get("/history", getStoragePurchaseHistory);

export default router;
