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
    getMyReelsAnalytics,
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

// Increment view - PUBLIC (allows anonymous views like Instagram)
router.post("/:id/view", incrementView);

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

// Add comment
router.post("/:id/comments", addComment);

// Get my reels analytics (for editor dashboard)
router.get("/analytics/my-reels", getMyReelsAnalytics);

export default router;
