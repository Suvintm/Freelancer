import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { createPost, getFeed } from "../controllers/postController.js";

/**
 * 📝 SOCIAL ROUTES
 */

const router = express.Router();

/**
 * @route   POST /api/social/posts
 * @desc    Create a new post/reel and link processed media
 * @access  Private
 */
router.post("/posts", authenticate, createPost);

/**
 * @route   GET /api/social/feed
 * @desc    Fetch global public feed
 * @access  Public (Optional: authenticate if you want personalized feed)
 */
router.get("/feed", getFeed);

export default router;
