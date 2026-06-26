import express from "express";
import protect from "../../shared/middleware/auth.middleware.js";
import storyController from "./controllers/storyController.js";
import { requireCapability } from "../../shared/middleware/capability.middleware.js";
import { CAPABILITIES } from "../../shared/kernel/constants.js";
import { 
  feedLimiter, 
  heavyLimiter, 
  impressionLimiter, 
  interactionLimiter 
} from "../../shared/middleware/rate-limiter.middleware.js";

const router = express.Router();

/**
 * 🎨 STORY ROUTES
 * All routes are protected and require a valid SuviX session.
 */

// Feed & Discovery
router.get("/active", protect, feedLimiter, storyController.getActiveStories);
router.get("/feed", protect, feedLimiter, storyController.getStoryFeed);

// Upload Lifecycle
router.get("/upload-url", protect, requireCapability(CAPABILITIES.CONTENT_UPLOAD_STORY), heavyLimiter, storyController.getUploadTicket);
router.post("/", protect, requireCapability(CAPABILITIES.CONTENT_UPLOAD_STORY), heavyLimiter, storyController.createStory);

// Interactions
router.post("/:storyId/view", protect, impressionLimiter, storyController.recordStoryView);
router.delete("/:storyId", protect, interactionLimiter, storyController.deleteStory);

export default router;
