import express from "express";
import { authenticate, optionalAuth } from "../../shared/middleware/auth.middleware.js";
import {
  createPost,
  createReel,
  createYoutubePost,
  createPoll,
  deletePost,
  deleteReel,
  getFeed,
  getPostsFeed,
  getReelsFeed,
  getYoutubeFeed,
  toggleLikeController,
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
router.post("/posts/:id/like", authenticate, toggleLikeController);

// ── Short-form Video Reels ────────────────────────────────────────────────────
/**
 * @route   POST /api/social/reels
 * @desc    Create a new short-form video reel
 * @access  Private
 */
router.post("/reels", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createReel);
router.delete("/reels/:reelId", authenticate, interactionLimiter, deleteReel);
router.post("/reels/:id/like", authenticate, toggleLikeController);

// ── YouTube Link Share Posts ──────────────────────────────────────────────────
/**
 * @route   POST /api/social/posts/youtube
 * @desc    Create a YouTube link share post (YouTube Creator role)
 * @access  Private
 */
router.post("/posts/youtube", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createYoutubePost);
router.post("/posts/youtube/:id/like", authenticate, toggleLikeController);

// ── Polls ─────────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/social/polls
 * @desc    Create a standalone poll
 * @access  Private
 */
router.post("/polls", authenticate, requireCapability(CAPABILITIES.CONTENT_UPLOAD_POST), interactionLimiter, createPoll);
router.post("/polls/:id/like", authenticate, toggleLikeController);

// ── Unified Feed ──────────────────────────────────────────────────────────────
/**
 * @route   GET /api/social/feed
 * @desc    Fetch global public feed (all content types merged)
 * @access  Public (optional auth for likes)
 */
router.get("/feed", optionalAuth, feedLimiter, getFeed);
router.get("/feed/posts", optionalAuth, feedLimiter, getPostsFeed);
router.get("/feed/reels", optionalAuth, feedLimiter, getReelsFeed);
router.get("/feed/youtube", optionalAuth, feedLimiter, getYoutubeFeed);

export default router;
