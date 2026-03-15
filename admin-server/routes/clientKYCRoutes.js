// clientKYCRoutes.js - Client KYC API Routes
import express from "express";
import protect, { authorize } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import {
  submitKYC,
  getMyKYC,
  updateKYC,
  canProceed,
  getPendingKYC,
  getKYCDetails,
  verifyKYC,
  getKYCStats,
} from "../controllers/clientKYCController.js";
import { upload } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ==================== CLIENT ENDPOINTS ====================

// Submit KYC
// Submit KYC
router.post(
  "/", 
  protect, 
  authorize("client"), 
  uploadLimiter, 
  upload.fields([{ name: "id_proof", maxCount: 1 }, { name: "bank_proof", maxCount: 1 }]), 
  submitKYC
);

// Get my KYC status
router.get("/my", protect, authorize("client"), getMyKYC);

// Update KYC
// Update KYC
router.put(
  "/update", 
  protect, 
  authorize("client"), 
  uploadLimiter, 
  upload.fields([{ name: "id_proof", maxCount: 1 }, { name: "bank_proof", maxCount: 1 }]), 
  updateKYC
);

// Check if can proceed (KYC verified)
router.get("/can-proceed", protect, authorize("client"), canProceed);

// ==================== ADMIN ENDPOINTS ====================
// Used by Admin Panel - Requires Admin Auth (not User Auth)

// Get pending KYC verifications
router.get("/admin/pending", protectAdmin, getPendingKYC);

// Get KYC statistics
router.get("/admin/stats", protectAdmin, getKYCStats);

// Get specific KYC details
router.get("/admin/:kycId", protectAdmin, getKYCDetails);

// Verify or reject KYC
router.post("/admin/verify/:kycId", protectAdmin, verifyKYC);

export default router;
