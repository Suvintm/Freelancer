import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { updateProfileValidator, userIdValidator } from "../middleware/validators.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ============ PUBLIC ROUTE ============
// Fetch any user's profile by ID (for Explore -> View Profile)
router.get("/:userId", userIdValidator, getProfile);

// ============ PROTECTED ROUTES ============
router.use(authMiddleware);

// Get logged-in user's profile
router.get("/", getProfile);

// Update profile (supports uploading certification images)
router.put(
  "/",
  uploadLimiter,
  upload.fields([{ name: "certifications", maxCount: 5 }]),
  updateProfileValidator,
  updateProfile
);

export default router;
