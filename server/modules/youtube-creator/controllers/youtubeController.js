import logger from "../../../utils/logger.js";
import * as youtubeVerificationService from "../services/youtubeVerificationService.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import prisma from "../../../config/prisma.js";
import quotaManager from "../services/youtubeQuotaManager.js";
import { deleteCache, CacheKey } from "../../../utils/cache.js";
import { emitToUser } from "../../../socket.js";
import { smartResolveMediaUrl } from "../../../utils/mediaResolver.js";

/**
 * PRODUCTION-GRADE YOUTUBE CREATOR CONTROLLER
 * Orchestrates verification and channel linking logic.
 */

/**
 * Fetch all subcategories for YouTube Creators (yt_influencer)
 */
export const getYoutubeSubCategories = async (req, res, next) => {
  try {
    const subCategories = await prisma.roleSubCategory.findMany({
      where: {
        category: {
          slug: "yt_influencer",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request to start manual verification
 */
export const initiateManualVerification = async (req, res, next) => {
  try {
    const { channelInput, subCategoryId, language } = req.body;
    const userId = req.user.id;

    if (!channelInput) {
      throw new ApiError(400, "Channel handle or URL is required.");
    }

    // 🔑 Quota Guard
    const quota = await quotaManager.getStatus();
    if (quota && quota.remaining_units < 1) {
      throw new ApiError(429, "YouTube daily limit reached. We've paused new signups for today to keep existing profiles safe. Please try again tomorrow!");
    }

    logger.info(`🎬 [CONTROLLER] Initiating manual verification for channel: ${channelInput}`);

    const result = await youtubeVerificationService.initiateVerification(userId, channelInput, {
      subCategoryId,
      language
    });

    res.status(200).json({
      success: true,
      message: "Verification initiated. Please add the code to your channel description.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request to check verification status
 */
export const checkManualVerification = async (req, res, next) => {
  try {
    const { channelInput, token } = req.body;
    const userId = req.user.id;

    if (!channelInput || !token) {
      throw new ApiError(400, "Channel handle/ID and the verification token are required.");
    }

    // 🔑 Quota Guard
    const quota = await quotaManager.getStatus();
    if (quota && quota.remaining_units < 1) {
      throw new ApiError(429, "YouTube daily limit reached. We've paused new signups for today to keep existing profiles safe. Please try again tomorrow!");
    }

    logger.info(`🔍 [CONTROLLER] Checking verification for channel: ${channelInput}`);

    const result = await youtubeVerificationService.verifyChannel(userId, channelInput, { token });

    res.status(200).json({
      success: true,
      message: "Channel successfully verified and linked!",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle token regeneration request
 */
export const regenerateManualVerification = async (req, res, next) => {
  try {
    const { channelInput } = req.body;
    const userId = req.user.id;

    if (!channelInput) {
      throw new ApiError(400, "Channel handle/ID is required to regenerate a token.");
    }

    logger.info(`🔄 [CONTROLLER] Regenerating token for channel: ${channelInput}`);

    const result = await youtubeVerificationService.initiateVerification(userId, channelInput);

    res.status(200).json({
      success: true,
      message: "New verification token generated.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a YouTube channel profile and all its media
 */
export const deleteChannel = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;

    if (!profileId) {
      throw new ApiError(400, "Profile ID is required.");
    }

    logger.info(`🗑️ [CONTROLLER] User ${userId} requested deletion of YouTube profile: ${profileId}`);

    // 1. Fetch channel and verify ownership
    const profile = await prisma.youTubeProfile.findFirst({
      where: { id: profileId, userId },
      include: {
        videos: {
          select: { thumbnail: true }
        }
      }
    });

    if (!profile) {
      throw new ApiError(404, "YouTube profile not found or access denied.");
    }

    // 2. Collect all S3 keys for cleanup
    const keysToDelete = [];
    if (profile.thumbnail_url) keysToDelete.push(profile.thumbnail_url);
    
    profile.videos.forEach(v => {
      if (v.thumbnail && !v.thumbnail.startsWith("http")) {
        keysToDelete.push(v.thumbnail);
      }
    });

    // 3. Delete from Database (Cascades to videos and logs)
    await prisma.youTubeProfile.delete({
      where: { id: profileId }
    });

    // 4. Cleanup S3 Media in background
    if (keysToDelete.length > 0) {
      import("../../../utils/storageService.js").then(service => {
        // storageService.deleteFile handles multiple keys if we pass an array or we can iterate
        // Actually storageService.deleteFile calls storage.deleteObjects([key])
        // Let's call it for the whole array
        service.default.deleteFile(keysToDelete).catch(err => {
          logger.error(`❌ [YT-DELETE] Background S3 cleanup failed: ${err.message}`);
        });
      });
    }

    // 5. Invalidate User Cache to prevent "Ghost Channels"
    await deleteCache(CacheKey.userProfile(userId));

    // 🛰️ [SOCKET] Surgical Broadcast to remove channel from UI
    // We fetch the full identity to ensure the mobile app's guard remains satisfied
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        youtubeProfiles: {
          include: {
            videos: { orderBy: { published_at: 'desc' }, take: 25 }
          }
        }
      }
    });

    const remainingChannels = user.youtubeProfiles || [];

    emitToUser(userId, "user:profile_updated", { 
      id: user.id,
      name: user.profile?.name,
      username: user.profile?.username,
      isOnboarded: user.is_onboarded,
      youtubeProfile: remainingChannels.map(p => ({
        ...p,
        thumbnail_url: smartResolveMediaUrl(p.thumbnail_url)
      })),
      youtubeVideos: remainingChannels
        .flatMap(p => (p.videos || []).map(v => {
          const resolvedUrl = smartResolveMediaUrl(v.thumbnail);
          return {
            ...v,
            thumbnail: resolvedUrl,
            media: {
              type: 'IMAGE',
              status: 'READY',
              urls: { thumb: resolvedUrl, feed: resolvedUrl, full: resolvedUrl }
            }
          };
        }))
        .sort((a, b) => new Date(b.published_at || b.publishedAt) - new Date(a.published_at || a.publishedAt))
    });

    res.status(200).json({
      success: true,
      message: "Channel and all associated data permanently deleted."
    });
  } catch (error) {
    next(error);
  }
};
