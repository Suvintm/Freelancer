import express from "express";
import protect, { authorize } from "../middleware/authMiddleware.js";
import {
  getAllBadges,
  getUserBadges,
  getBadgeProgress,
  evaluateBadges,
  getBadgeDefinitions,
} from "../controllers/badgeController.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/definitions", getBadgeDefinitions);
router.get("/user/:userId", getUserBadges);

// Protected routes (require authentication)
router.use(protect);

// Editor routes - specific paths first, then generic
router.get("/progress", authorize("editor"), getBadgeProgress);
router.post("/evaluate", authorize("editor"), evaluateBadges);
router.get("/", authorize("editor"), getAllBadges);

export default router;
