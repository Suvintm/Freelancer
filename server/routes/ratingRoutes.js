import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  submitRating,
  getEditorRatings,
  respondToRating,
  checkOrderRating,
  getEditorStats,
} from "../controllers/ratingController.js";

const router = express.Router();

// Submit rating for an order (client only)
router.post("/:orderId", protect, submitRating);

// Check if order has been rated
router.get("/check/:orderId", protect, checkOrderRating);

// Get editor's ratings (public)
router.get("/editor/:editorId", getEditorRatings);

// Get editor's stats summary (public)
router.get("/stats/:editorId", getEditorStats);

// Editor respond to a rating
router.post("/:ratingId/respond", protect, respondToRating);

export default router;
