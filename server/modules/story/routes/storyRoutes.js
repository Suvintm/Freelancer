import express from "express";
import protect from "../../../middleware/authMiddleware.js";
import storyController from "../controllers/storyController.js";
import { 
  feedLimiter, 
  heavyLimiter, 
  impressionLimiter, 
  interactionLimiter 
} from "../../../middleware/rateLimiter.js";

const router = express.Router();

/**
 * 🎨 STORY ROUTES
 * All routes are protected and require a valid SuviX session.
 */

// Feed & Discovery
router.get("/active", protect, feedLimiter, storyController.getActiveStories);
router.get("/feed", protect, feedLimiter, storyController.getStoryFeed);

// Upload Lifecycle
router.get("/upload-url", protect, heavyLimiter, storyController.getUploadTicket);
router.post("/", protect, heavyLimiter, storyController.createStory);

// Interactions
router.post("/:storyId/view", protect, impressionLimiter, storyController.recordStoryView);
router.delete("/:storyId", protect, interactionLimiter, storyController.deleteStory);

export default router;
