/**
 * 🛣️ PROFILE ROUTES
 */
import { Router } from "express";
import { getProfilePosts, getProfileReels, getProfileYoutubePosts, getProfilePolls, getProfilesByCategory, getProfileDetails, getChannelDetails } from "./controllers/profile.controller.js";
import { publicApiLimiter } from "../../shared/middleware/rate-limiter.middleware.js";
import { optionalAuth } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// Apply rate limiting specifically for these public endpoints
router.use(publicApiLimiter);

/**
 * @route GET /api/profile/:userId/posts
 * Publicly accessible list of standard posts
 */
router.get("/:userId/posts", optionalAuth, getProfilePosts);

/**
 * @route GET /api/profile/:userId/reels
 * Publicly accessible list of reels
 */
router.get("/:userId/reels", optionalAuth, getProfileReels);

/**
 * @route GET /api/profile/:userId/youtube-posts
 * Publicly accessible list of youtube posts
 */
router.get("/:userId/youtube-posts", optionalAuth, getProfileYoutubePosts);

/**
 * @route GET /api/profile/:userId/polls
 * Publicly accessible list of polls
 */
router.get("/:userId/polls", getProfilePolls);

/**
 * @route GET /api/profile/category/:categorySlug
 * Publicly accessible list of profiles by category slug
 */
router.get("/category/:categorySlug", getProfilesByCategory);

/**
 * @route GET /api/profile/channel/:channelId
 * Publicly accessible specific YouTube channel details
 */
router.get("/channel/:channelId", getChannelDetails);

/**
 * @route GET /api/profile/:userId
 * Publicly accessible profile details (Media Kit)
 */
router.get("/:userId", getProfileDetails);

export default router;
