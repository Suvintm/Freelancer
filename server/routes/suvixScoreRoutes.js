// suvixScoreRoutes.js - Suvix Score API Routes
import express from "express";
import protect from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/authMiddleware.js";
import {
  getEditorScore,
  getMyScoreBreakdown,
  recalculateAllScores,
} from "../controllers/suvixScoreController.js";

const router = express.Router();

// IMPORTANT: Specific paths BEFORE parameterized paths

// Protected: Get my score breakdown (editor only)
router.get("/my/breakdown", protect, authorize("editor"), getMyScoreBreakdown);

// Admin: Force recalculate all scores
router.post("/admin/recalculate-all", protect, authorize("admin"), recalculateAllScores);

// Public: Get editor's score (must be last - catches any :editorId)
router.get("/:editorId", getEditorScore);

export default router;
