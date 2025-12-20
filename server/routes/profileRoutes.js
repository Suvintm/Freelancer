import express from "express";
import { getProfile, updateProfile, getProfileCompletionStatus } from "../controllers/profileController.js";
import { getKYCStatus, submitKYC, lookupIFSC, verifyKYC } from "../controllers/kycController.js";
import authMiddleware, { optionalAuth } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";
import { updateProfileValidator, userIdValidator } from "../middleware/validators.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ============ PROTECTED ROUTES ============
// These routes require authentication

// Get profile completion status (calculated from DB)
router.get("/completion-status", authMiddleware, getProfileCompletionStatus);

// Get KYC status
router.get("/kyc-status", authMiddleware, getKYCStatus);

// Submit KYC details
router.post(
  "/submit-kyc", 
  authMiddleware, 
  uploadLimiter, 
  upload.fields([{ name: "id_proof", maxCount: 1 }, { name: "bank_proof", maxCount: 1 }]), 
  submitKYC
);

// IFSC Lookup (proxy to avoid CORS)
router.get("/lookup-ifsc/:ifsc", authMiddleware, lookupIFSC);

// Admin: Verify KYC manually
router.post("/verify-kyc/:userId", protectAdmin, verifyKYC);

// Get logged-in user's own profile (this is what frontend calls)
router.get("/", authMiddleware, getProfile);
router.get("/me", authMiddleware, getProfile);

// Update profile (supports uploading certification images)
router.put(
  "/",
  authMiddleware,
  uploadLimiter,
  upload.fields([{ name: "certifications", maxCount: 5 }]),
  updateProfileValidator,
  updateProfile
);

// ============ PUBLIC ROUTE ============
// Fetch any user's profile by ID (for Explore -> View Profile)
// Uses optionalAuth to track logged-in visitors without requiring login
// This must be LAST to avoid matching other routes as userId
router.get("/:userId", optionalAuth, userIdValidator, getProfile);

export default router;

