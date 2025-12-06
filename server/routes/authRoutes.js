import express from "express";
import {
  register,
  login,
  logout,
  updateProfilePicture,
  getCurrentUser,
} from "../controllers/authcontroller.js";
import { upload } from "../middleware/upload.js";
import protect from "../middleware/authMiddleware.js";
import { authLimiter, registerLimiter, uploadLimiter } from "../middleware/rateLimiter.js";
import { registerValidator, loginValidator } from "../middleware/validators.js";

const router = express.Router();

// ============ AUTH ROUTES ============

// Register - with rate limiting and validation
router.post(
  "/register",
  registerLimiter,
  upload.single("profilePicture"),
  registerValidator,
  register
);

// Login - with strict rate limiting and validation
router.post("/login", authLimiter, loginValidator, login);

// Logout - protected
router.post("/logout", protect, logout);

// ============ PROFILE PICTURE ============

router.patch(
  "/update-profile-picture",
  protect,
  uploadLimiter,
  upload.single("profilePicture"),
  updateProfilePicture
);

// ============ CURRENT USER ============

router.get("/me", protect, getCurrentUser);

export default router;
