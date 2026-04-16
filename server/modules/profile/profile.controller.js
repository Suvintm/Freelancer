/**
 * 🕹️ PROFILE CONTROLLER
 * 
 * Handles incoming requests for user profile content.
 * Implements SWR (Stale-While-Revalidate) caching strategy via HTTP headers.
 */
import profileService from "./profile.service.js";
import logger from "../../utils/logger.js";

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

export default { getProfilePosts, getProfileReels };
