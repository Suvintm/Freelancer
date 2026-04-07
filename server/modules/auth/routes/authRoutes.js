import express from "express";
import multer from "multer";
import { 
  registerFull, 
  login, 
  getRoles,
  refresh,
  logout,
  getMe, 
  checkUsername,
  validateSignup
} from "../controllers/authController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// ============ PUBLIC ROUTES ============
router.post("/register-full", upload.single("profilePicture"), registerFull);
router.post("/login", login);
router.post("/refresh-token", refresh); // Advanced Rotation
router.post("/logout", logout); // Clear Sessions
router.get("/roles", getRoles);
router.get("/check-username/:username", checkUsername);
router.post("/validate-signup", validateSignup);

// ============ PRIVATE ROUTES ============
router.get("/me", authenticate, getMe);

export default router;
