import express from "express";
import {
  register,
  login,
  logout,
  updateProfilePicture,
  getCurrentUser, // ✅ import the new controller
} from "../controllers/authcontroller.js";
import { upload } from "../middleware/upload.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- AUTH ROUTES ----------------
router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.post("/logout", protect, logout);

// ---------------- PROFILE PICTURE ----------------
router.patch(
  "/update-profile-picture",
  protect,
  upload.single("profilePicture"),
  updateProfilePicture
);

// ---------------- CURRENT USER ----------------
router.get("/me", protect, getCurrentUser); // ✅ returns latest user info

export default router;
