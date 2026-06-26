import express from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { createPost, getFeed, deletePost } from "./controllers/postController.js";
import { interactionLimiter, feedLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import { requireCapability } from "../../shared/middleware/capability.middleware.js";
import { CAPABILITIES } from "../../shared/kernel/constants.js";

/**
 * 📝 SOCIAL ROUTES
 */

const router = express.Router();

/**
 * @route   POST /api/social/posts
 * @desc    Create a new post/reel and link processed media
 * @access  Private
 */
router.post("/posts", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createPost);
router.delete("/posts/:postId", authenticate, interactionLimiter, deletePost);

/**
 * @route   GET /api/social/feed
 * @desc    Fetch global public feed
 * @access  Public (Optional: authenticate if you want personalized feed)
 */
router.get("/feed", feedLimiter, getFeed);

export default router;
