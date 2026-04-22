import prisma from "../../../config/prisma.js";
import storageService from "../../../utils/storageService.js";
import logger from "../../../utils/logger.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import { smartResolveMediaUrl } from "../../../utils/mediaResolver.js";
import { emitToUser } from "../../../socket.js";
import { deleteCache, CacheKey } from "../../../utils/cache.js";

/**
 * PRODUCTION-GRADE YOUTUBE SYNC SERVICE
 * Handles data persistence, image mirroring, and profile synchronization.
 */

/**
 * Persist YouTube Channel and Videos into the database
 * @param {string} userId - ID of the professional user
 * @param {Object} channelData - Data from YouTube API
 * @param {string} triggerReason - Why this sync is happening
 * @param {Object} tx - Optional Prisma transaction client
 */
export const persistYouTubeContent = async (userId, channelData, triggerReason = "manual", tx = prisma) => {
  // Initialization
  const videoRecords = []; // 💉 Defined at top-level to prevent ReferenceErrors in callbacks

  try {
    // 🛡️ PRODUCTION DATA MAPPING: Support multiple formats (camelCase, snake_case, or direct ID)
    const channelId = String(channelData.channelId || channelData.channel_id || channelData.id || "").trim();
    const channelName = (channelData.channelName || channelData.channel_name || channelData.title || "Untitled Channel").trim();
    const thumbnailUrl = channelData.thumbnailUrl || channelData.thumbnail_url || channelData.thumbnail;
    const subscriberCount = Number(channelData.subscriberCount || channelData.subscriber_count || 0);
    const videoCount = Number(channelData.videoCount || channelData.video_count || 0);
    const viewCount = channelData.viewCount || channelData.view_count || "0";
    const description = channelData.description || null;
    const customUrl = channelData.customUrl || channelData.custom_url || null;
    const publishedAt = channelData.publishedAt || channelData.published_at || null;
    const country = channelData.country || null;
    const keywords = channelData.keywords || null;
    const bannerUrl = channelData.bannerUrl || channelData.banner_url || null;
    const uploadsPlaylistId = channelData.uploadsPlaylistId || channelData.uploads_playlist_id;
    const videos = channelData.videos || [];

    if (!channelId || channelId === "undefined") {
      logger.error(`❌ [YT-SYNC] Critical Mapping Failure: Received invalid channelId from data: ${JSON.stringify(channelData)}`);
      throw new ApiError(400, "YouTube Sync Error: A valid Channel ID is required to link your account.");
    }

    logger.info(`🔄 [YT-SYNC] Persisting content for channel: ${channelName} (${channelId})`);

    // 1. Mirror Channel Avatar
    let mirroredAvatar = channelData.mirroredAvatarUrl || channelData.mirrored_avatar_url;
    if (!mirroredAvatar && thumbnailUrl) {
      logger.info(`💾 [YT-SYNC] Optimizing Avatar for ${channelId}`);
      mirroredAvatar = await storageService.optimizeAndMirrorUrl(thumbnailUrl, "uploads/avatars/youtube", { format: 'webp' });
    }

    // 2. Mirror Channel Banner (Processed & Optimized)
    let mirroredBanner = channelData.mirroredBannerUrl || channelData.mirrored_banner_url;
    if (!mirroredBanner && bannerUrl) {
      logger.info(`💾 [YT-SYNC] Processing & Optimizing banner for ${channelId}`);
      try {
        mirroredBanner = await storageService.optimizeAndMirrorUrl(bannerUrl, "uploads/avatars/youtube/banners", { format: 'jpeg', quality: 90 });
      } catch (bErr) {
        logger.warn(`⚠️ [YT-SYNC] Banner processing failed: ${bErr.message}`);
      }
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
            view_count: BigInt(viewCount),
            description: description,
            custom_url: customUrl,
            banner_url: mirroredBanner || bannerUrl,
            published_at: publishedAt ? new Date(publishedAt) : null,
            country: country,
            keywords: keywords,
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
            view_count: BigInt(viewCount),
            description: description,
            custom_url: customUrl,
            banner_url: mirroredBanner || bannerUrl,
            published_at: publishedAt ? new Date(publishedAt) : null,
            country: country,
            keywords: keywords,
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
        // but limit to first 25 for profile performance
        const videosToSync = videos.slice(0, 25);

        for (const v of videosToSync) {
          try {
            let mirroredThumb = v.thumbnail;
              mirroredThumb = await storageService.uploadFromUrl(v.thumbnail, "uploads/processed/images/youtube");

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

    // 🛰️ [DATA-AGGREGATION] Fetch the FULL state of all channels for the user
    // This prevents the UI from "losing" other accounts when one channel finishes syncing.
    const allProfiles = await ytProfileModel.findMany({
      where: { userId },
      include: {
        videos: {
          orderBy: { published_at: 'desc' },
          take: 25
        }
      }
    });

    const allVideos = allProfiles
      .flatMap(p => (p.videos || []).map(v => {
        const rawThumb = v.thumbnail || v.thumbnail_url || v.thumbnailUrl;
        const resolvedUrl = smartResolveMediaUrl(rawThumb);
        return {
          id: v.video_id,
          title: v.title,
          thumbnail: resolvedUrl,
          published_at: v.published_at,
          channel_id: p.channel_id,
          youtubeProfileId: p.id,
          // 🛰️ NORMALIZE FOR UNIFIED ENGINE
          media: {
            type: 'IMAGE',
            status: 'READY',
            urls: { thumb: resolvedUrl, feed: resolvedUrl, full: resolvedUrl }
          }
        };
      }))
      .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());

    // ── TRIGGER NOTIFICATION (Production Quality) ───────────────────────────
    const { default: notificationService } = await import("../../notification/services/notificationService.js");
    
    logger.info(`📡 [NOTIFY-SYNC] Sending sync signal for user ${userId}. Total channels: ${allProfiles.length}, Total videos: ${allVideos.length}`);

    // Custom Notification Content based on Reason
    let notificationTitle = 'YouTube Profile Updated! 🎥';
    let notificationBody = `Your latest content from ${youtubeProfile.channel_name} is now live on SuviX.`;

    if (triggerReason === "manual_verify") {
      notificationTitle = 'Account Linked! 🎥';
      notificationBody = `Your channel ${youtubeProfile.channel_name} was successfully linked to your account. Your latest videos are now live!`;
    }

    notificationService.notify({
      userId,
      type: 'SYNC_COMPLETE',
      title: notificationTitle,
      body: notificationBody,
      imageUrl: smartResolveMediaUrl(youtubeProfile.thumbnail_url),
      priority: 'HIGH',
      entityId: youtubeProfile.id,
      entityType: 'YOUTUBE_PROFILE',
      metadata: { 
        type: 'youtube_sync_complete', 
        sync_complete: true,
        videos: allVideos.slice(0, 25) // Only send first 25 to notification to avoid payload limits
      }
    }).catch(err => logger.error(`[NOTIFY-SYNC] Failed to send sync notification: ${err.message}`));

    // 🧹 [CACHE] Invalidate user profile to ensure "Ghost Channels" or "Missing Videos" are resolved
    await deleteCache(CacheKey.userProfile(userId));

    // 🛰️ [SOCKET] Surgical Broadcast for real-time UI refresh
    emitToUser(userId, "user:profile_updated", { 
      youtubeProfile: allProfiles.map(p => ({
        ...p,
        thumbnail_url: smartResolveMediaUrl(p.thumbnail_url)
      })),
      youtubeVideos: allVideos
    });

    return youtubeProfile;

  } catch (error) {
    logger.error(`❌ [YT-SYNC] Persistence failed: ${error.message}`);
    throw error;
  }
};

export default {
  persistYouTubeContent,
};
