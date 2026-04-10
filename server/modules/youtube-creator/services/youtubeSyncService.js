import prisma from "../../../config/prisma.js";
import storageService from "../../../utils/storageService.js";
import logger from "../../../utils/logger.js";

/**
 * PRODUCTION-GRADE YOUTUBE SYNC SERVICE
 * Handles data persistence, image mirroring, and profile synchronization.
 */

/**
 * Persist YouTube Channel and Videos into the database
 * @param {string} userId - ID of the professional user
 * @param {Object} channelData - Data from YouTube API
 * @param {Object} tx - Optional Prisma transaction client
 */
export const persistYouTubeContent = async (userId, channelData, tx = prisma) => {
  try {
    // 🛡️ PRODUCTION DATA MAPPING: Support multiple formats (camelCase, snake_case, or direct ID)
    const channelId = String(channelData.channelId || channelData.channel_id || channelData.id || "").trim();
    const channelName = (channelData.channelName || channelData.channel_name || channelData.title || "Untitled Channel").trim();
    const thumbnailUrl = channelData.thumbnailUrl || channelData.thumbnail_url || channelData.thumbnail;
    const subscriberCount = Number(channelData.subscriberCount || channelData.subscriber_count || 0);
    const videoCount = Number(channelData.videoCount || channelData.video_count || 0);
    const uploadsPlaylistId = channelData.uploadsPlaylistId || channelData.uploads_playlist_id;
    const videos = channelData.videos || [];

    if (!channelId || channelId === "undefined") {
      logger.error(`❌ [YT-SYNC] Critical Mapping Failure: Received invalid channelId from data: ${JSON.stringify(channelData)}`);
      throw new ApiError(400, "YouTube Sync Error: A valid Channel ID is required to link your account.");
    }

    logger.info(`🔄 [YT-SYNC] Persisting content for channel: ${channelName} (${channelId})`);

    // 1. Mirror Channel Avatar (Skip if already mirrored outside transaction)
    let mirroredAvatar = channelData.mirroredAvatarUrl || channelData.mirrored_avatar_url;
    if (!mirroredAvatar && thumbnailUrl) {
      logger.info(`💾 [YT-SYNC] Mirroring avatar inside transaction (Warning: This is slower)`);
      mirroredAvatar = await storageService.uploadFromUrl(thumbnailUrl, "youtube-profiles");
    }

    // Safe Model Resolvers
    const ytProfileModel = tx.youtubeProfile || tx.youTubeProfile;
    const ytVideoModel = tx.youtubeVideo || tx.youTubeVideo;

    if (!ytProfileModel) {
       throw new Error("Critical: YouTubeProfile model not found on Prisma client.");
    }

    // 2. Safety Check: Verify ownership if channel already exists
    // 🛡️ PRODUCTION RESILIENCE: Use findFirst to avoid strict PrismaClient validation while maintaining performance
    const existing = await ytProfileModel.findFirst({
       where: { channel_id: channelId },
       select: { id: true, userId: true }
    });

    if (existing && existing.userId !== userId) {
       throw new ApiError(409, `YouTube channel ${channelId} is already owned by another user.`);
    }

    // 3. Resilient Upsert Pattern (Manual findFirst -> update/create)
    let youtubeProfile;
    if (existing) {
       youtubeProfile = await ytProfileModel.update({
         where: { id: existing.id }, // Always use Primary Key for updates
         data: {
            channel_name: channelName,
            thumbnail_url: mirroredAvatar || thumbnailUrl,
            subscriber_count: subscriberCount,
            video_count: videoCount,
            uploads_playlist_id: uploadsPlaylistId,
            last_synced_at: new Date(),
            userId: userId,
         }
       });
    } else {
       youtubeProfile = await ytProfileModel.create({
         data: {
            userId: userId,
            channel_id: channelId,
            channel_name: channelName,
            thumbnail_url: mirroredAvatar || thumbnailUrl,
            subscriber_count: subscriberCount,
            video_count: videoCount,
            uploads_playlist_id: uploadsPlaylistId,
            last_synced_at: new Date(),
         }
       });
    }

    // 3. Mirror and Persist Videos (Atomic Sync)
    if (videos && videos.length > 0) {
      logger.info(`📽️ [YT-SYNC] Mirroring ${videos.length} videos...`);
      
      const videoRecords = await Promise.all(
        videos.map(async (v) => {
          const mirroredThumb = await storageService.uploadFromUrl(v.thumbnail, "youtube-videos");
          return {
            video_id: v.id,
            title: v.title,
            thumbnail: mirroredThumb || v.thumbnail,
            published_at: new Date(v.publishedAt),
            youtubeProfileId: youtubeProfile.id,
            channel_id: channelId, // Added missing required field
          };
        })
      );

      // Clean old videos and insert new ones (Production Fresh-Flush Sync)
      if (ytVideoModel) {
        await ytVideoModel.deleteMany({
          where: { youtubeProfileId: youtubeProfile.id },
        });

        await ytVideoModel.createMany({
          data: videoRecords,
        });
      } else {
        logger.warn("⚠️ [YT-SYNC] youtubeVideo model not found, skipping video persistence.");
      }
    }

    return youtubeProfile;
  } catch (error) {
    logger.error(`❌ [YT-SYNC] Persistence failed: ${error.message}`);
    throw error;
  }
};

export default {
  persistYouTubeContent,
};
