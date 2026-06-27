/**
 * 🛣️ PROFILE ROUTES
 */
import { Router } from "express";
import { getProfilePosts, getProfileReels, getProfilesByCategory, getProfileDetails, getChannelDetails } from "./profile.controller.js";
import { publicApiLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// Apply rate limiting specifically for these public endpoints
router.use(publicApiLimiter);

/**
 * @route GET /api/profile/:userId/posts
 * Publicly accessible list of standard posts
 */
router.get("/:userId/posts", getProfilePosts);

/**
 * @route GET /api/profile/:userId/reels
 * Publicly accessible list of reels
 */
router.get("/:userId/reels", getProfileReels);

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
