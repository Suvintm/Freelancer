import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// ---------------- PUBLIC ROUTE ----------------
// ✅ Fetch any user's profile by ID (for Explore -> View Profile)
router.get("/:userId", getProfile);

// ---------------- PROTECTED ROUTES ----------------
router.use(authMiddleware);

// ✅ Get logged-in user’s profile
router.get("/", getProfile);

// ✅ Update profile (supports uploading certification images)
router.put(
  "/",
  upload.fields([{ name: "certifications", maxCount: 5 }]),
  updateProfile
);

export default router;
