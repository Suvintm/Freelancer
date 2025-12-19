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

const router = express.Router();

// ==================== CLIENT ENDPOINTS ====================

// Submit KYC
router.post("/", protect, authorize("client"), submitKYC);

// Get my KYC status
router.get("/my", protect, authorize("client"), getMyKYC);

// Update KYC
router.put("/update", protect, authorize("client"), updateKYC);

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
