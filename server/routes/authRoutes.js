import express from "express";
import {
  register,
  login,
  logout,
  updateProfilePicture,
} from "../controllers/authcontroller.js";
import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.patch(
  "/update-profile-picture",
  protect,
  upload.single("profilePicture"),
  updateProfilePicture
);

export default router;
