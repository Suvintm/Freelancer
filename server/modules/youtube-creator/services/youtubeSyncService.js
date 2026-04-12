import prisma from "../../../config/prisma.js";
import storageService from "../../../utils/storageService.js";
import logger from "../../../utils/logger.js";
import { ApiError } from "../../../middleware/errorHandler.js";

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
  // Initialization
  const videoRecords = []; // 💉 Defined at top-level to prevent ReferenceErrors in callbacks

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
      logger.info(`📽️ [YT-SYNC] Attempting to mirror up to ${videos.length} videos...`);
      
      try {
        // Use sequential processing for thumbnails to be nice to Cloudinary/Network
        // but limit to first 20 for profile performance
        const videosToSync = videos.slice(0, 20);

        for (const v of videosToSync) {
          try {
            let mirroredThumb = v.thumbnail;
            if (v.thumbnail && v.thumbnail.startsWith('http')) {
              mirroredThumb = await storageService.uploadFromUrl(v.thumbnail, "youtube-videos");
            }

            videoRecords.push({
              video_id: v.id,
              title: v.title,
              thumbnail: mirroredThumb || v.thumbnail,
              published_at: new Date(v.publishedAt),
              youtubeProfileId: youtubeProfile.id,
              channel_id: channelId,
            });
          } catch (vErr) {
            logger.warn(`⚠️ [YT-SYNC] Skipping video ${v.id} due to thumbnail failure: ${vErr.message}`);
          }
        }

        // Clean old videos and insert new ones (Production Fresh-Flush Sync)
        if (ytVideoModel && videoRecords.length > 0) {
          await ytVideoModel.deleteMany({
            where: { youtubeProfileId: youtubeProfile.id },
          });

          await ytVideoModel.createMany({
            data: videoRecords,
            skipDuplicates: true,
          });
          logger.info(`✅ [YT-SYNC] Successfully persisted ${videoRecords.length} videos.`);
        }
      } catch (vidSyncErr) {
        logger.error(`❌ [YT-SYNC] Video persistence layer failed: ${vidSyncErr.message}`);
        // We don't throw here - we want the profile sync to at least succeed
      }
    }

    // ── TRIGGER NOTIFICATION (Production Quality) ───────────────────────────
    // Notify the user that their profile is ready after the background sync.
    const { default: notificationService } = await import("../../notification/services/notificationService.js");
    
    // We do this asynchronously so it doesn't delay the worker return
    notificationService.notify({
      userId,
      type: 'SYNC_COMPLETE',
      title: 'YouTube Profile Updated! 🎥',
      body: `Your latest content from ${youtubeProfile.channel_name} is now live on SuviX.`,
      imageUrl: youtubeProfile.thumbnail_url,
      priority: 'HIGH',
      entityId: youtubeProfile.id,
      entityType: 'YOUTUBE_PROFILE',
      metadata: { 
        type: 'youtube_sync_complete', // FIXED: No longer categorized as onboarding_welcome
        sync_complete: true,
        videos: videoRecords // 💉 Surgical Injection for Instant UI Pop (Socket only)
      }
    }).catch(err => logger.error(`[NOTIFY-SYNC] Failed to send sync notification: ${err.message}`));

    return youtubeProfile;

  } catch (error) {
    logger.error(`❌ [YT-SYNC] Persistence failed: ${error.message}`);
    throw error;
  }
};

export default {
  persistYouTubeContent,
};
