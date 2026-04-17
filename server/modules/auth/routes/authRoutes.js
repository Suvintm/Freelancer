import express from "express";
import multer from "multer";
import { 
  registerFull, 
  login, 
  getRoles,
  getYouTubeChannels,
  refresh,
  logout,
  logoutAll,
  getMe, 
  checkUsername,
  validateSignup,
  getActiveSessions,
  revokeSession,
  validateVault
} from "../controllers/authController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";

import { authLimiter } from "../../../middleware/rateLimiter.js";
import { checkAccountLockout } from "../../../middleware/lockoutMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ============ PUBLIC ROUTES ============
router.post("/register-full", authLimiter, upload.single("profilePicture"), registerFull);
router.post("/login", authLimiter, checkAccountLockout, login);
router.post("/refresh-token", authLimiter, refresh); // Advanced Rotation + Rate Limited
router.post("/logout", logout); // Clear Sessions
router.get("/roles", getRoles);
router.post("/youtube/channels", getYouTubeChannels);
router.get("/check-username/:username", checkUsername);
router.post("/validate-signup", validateSignup);
router.post("/validate-vault", validateVault); // Sanitizer for mobile app

// ============ PRIVATE ROUTES ============
router.get("/me", authenticate, getMe);
router.get("/sessions", authenticate, getActiveSessions);
router.delete("/sessions/:sessionId", authenticate, revokeSession);
router.post("/logout-all", authenticate, logoutAll); // 🚨 Nuke all sessions across all devices

export default router;
