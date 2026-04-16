/**
 * 🛣️ PROFILE ROUTES
 */
import { Router } from "express";
import { getProfilePosts, getProfileReels } from "./profile.controller.js";
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

export default router;
