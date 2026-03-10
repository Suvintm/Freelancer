import express from "express";
import {
  register,
  login,
  logout,
  updateProfilePicture,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
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

// ============ OTP VERIFICATION ============

// Verify OTP - finalize registration or login
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

// ============ PASSWORD RESET ============

// Forgot Password - Request reset email
router.post("/forgot-password", authLimiter, forgotPassword);

// Reset Password - Set new password with token
router.post("/reset-password/:token", resetPassword);

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
