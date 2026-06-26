/**
 * 🕹️ PROFILE CONTROLLER
 * 
 * Handles incoming requests for user profile content.
 * Implements SWR (Stale-While-Revalidate) caching strategy via HTTP headers.
 */
import profileService from "../services/profile.service.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { withCache } from "../../../shared/utils/cache.js";

/**
 * @desc Get User Posts Grid
 * @route GET /api/profile/:userId/posts
 */
export const getProfilePosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;

    const data = await profileService.getProfilePosts(userId, cursor);

    // 🛡️ HTTP CACHING: Allow Edge CDN to serve stale content while revalidating
    // This is the Netflix/Instagram secret for instant-load profiles.
    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error(`❌ [PROFILE_CTRL] getProfilePosts Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch profile posts" });
  }
};

/**
 * @desc Get User Reels Grid
 * @route GET /api/profile/:userId/reels
 */
export const getProfileReels = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor } = req.query;

    const data = await profileService.getProfileReels(userId, cursor);

    res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error(`❌ [PROFILE_CTRL] getProfileReels Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch profile reels" });
  }
};

export const getProfilesByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    
    // Cache profiles by category for 5 minutes
    const cacheKey = `cache:profiles:category:${categorySlug}`;
    const TTL_SECONDS = 300;
    
    const data = await withCache(cacheKey, TTL_SECONDS, async () => {
      return await profileService.getProfilesByCategory(categorySlug);
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`❌ [PROFILE_CTRL] getProfilesByCategory Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch profiles by category" });
  }
};

export default { getProfilePosts, getProfileReels, getProfilesByCategory };
