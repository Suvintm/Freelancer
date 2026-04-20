import express from "express";
import protect from "../../../middleware/authMiddleware.js";
import storyController from "../controllers/storyController.js";

const router = express.Router();

/**
 * 🎨 STORY ROUTES
 * All routes are protected and require a valid SuviX session.
 */

// Feed & Discovery
router.get("/active", protect, storyController.getActiveStories);
router.get("/feed", protect, storyController.getStoryFeed);

// Upload Lifecycle
router.get("/upload-url", protect, storyController.getUploadTicket);
router.post("/", protect, storyController.createStory);

// Interactions
router.post("/:storyId/view", protect, storyController.recordStoryView);
router.delete("/:storyId", protect, storyController.deleteStory);

export default router;
