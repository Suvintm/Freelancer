import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js"; // ✅ using your existing multer setup

const router = express.Router();

// ✅ Protect all routes
router.use(authMiddleware);

// ---------------- PROFILE ROUTES ----------------

// Optional: Only if you want to manually create profile (you can remove if auto-created at signup)

// ✅ Get logged-in user’s profile
router.get("/", getProfile);

// ✅ Update profile (supports uploading certification images)
router.put(
  "/",
  upload.fields([{ name: "certifications", maxCount: 5 }]),
  updateProfile
);

export default router;
