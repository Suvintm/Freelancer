import express from "express";
import {
    publishToReel,
    unpublishReel,
    getReelsFeed,
    getReel,
    toggleLike,
    incrementView,
    getComments,
    addComment,
    getReelsByEditor,
    checkPublished,
} from "../controllers/reelController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get reels feed (can be accessed without auth for discovery)
router.get("/feed", getReelsFeed);

// Get single reel
router.get("/:id", getReel);

// Get comments
router.get("/:id/comments", getComments);

// Get reels by editor (public profile)
router.get("/editor/:userId", getReelsByEditor);

// ============ PROTECTED ROUTES ============
router.use(authMiddleware);

// Publish portfolio as reel
router.post("/publish/:portfolioId", publishToReel);

// Check if portfolio is published
router.get("/check/:portfolioId", checkPublished);

// Unpublish reel
router.delete("/unpublish/:reelId", unpublishReel);

// Like/unlike reel
router.post("/:id/like", toggleLike);

// Increment view
router.post("/:id/view", incrementView);

// Add comment
router.post("/:id/comments", addComment);

export default router;
