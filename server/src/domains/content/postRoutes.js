import express from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  createPost,
  createReel,
  createYoutubePost,
  createPoll,
  deletePost,
  deleteReel,
  getFeed,
} from "./controllers/postController.js";
import { interactionLimiter, feedLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import { requireCapability } from "../../shared/middleware/capability.middleware.js";
import { CAPABILITIES } from "../../shared/kernel/constants.js";

/**
 * 📝 SOCIAL CONTENT ROUTES
 */

const router = express.Router();

// ── Image Posts ───────────────────────────────────────────────────────────────
/**
 * @route   POST /api/social/posts
 * @desc    Create a new image post
 * @access  Private
 */
router.post("/posts", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createPost);
router.delete("/posts/:postId", authenticate, interactionLimiter, deletePost);

// ── Short-form Video Reels ────────────────────────────────────────────────────
/**
 * @route   POST /api/social/reels
 * @desc    Create a new short-form video reel
 * @access  Private
 */
router.post("/reels", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createReel);
router.delete("/reels/:reelId", authenticate, interactionLimiter, deleteReel);

// ── YouTube Link Share Posts ──────────────────────────────────────────────────
/**
 * @route   POST /api/social/posts/youtube
 * @desc    Create a YouTube link share post (YouTube Creator role)
 * @access  Private
 */
router.post("/posts/youtube", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createYoutubePost);

// ── Polls ─────────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/social/polls
 * @desc    Create a standalone poll
 * @access  Private
 */
router.post("/polls", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createPoll);

// ── Unified Feed ──────────────────────────────────────────────────────────────
/**
 * @route   GET /api/social/feed
 * @desc    Fetch global public feed (all content types merged)
 * @access  Public
 */
router.get("/feed", feedLimiter, getFeed);

export default router;
