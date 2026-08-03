import prisma from "../../../infrastructure/database/postgres.js";
import storageService from "../../../infrastructure/storage/storage-client.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { ApiError } from "../../../shared/kernel/errors.js";
import { smartResolveMediaUrl } from "../../../infrastructure/storage/media-resolver.js";
import { emitToUser } from "../../../platform/socket/socket.gateway.js";
import { deleteCache, CacheKey } from "../../../infrastructure/cache/cache.service.js";

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
  const videoRecords = [];

  try {
    const channelId = String(
      channelData.channelId || channelData.channel_id || channelData.id || ""
    ).trim();
    const channelName = (
      channelData.channelName || channelData.channel_name || channelData.title || "Untitled Channel"
    ).trim();
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
    const language = channelData.language || channelData.defaultLanguage || null;
    const hiddenSubscriberCount = channelData.hiddenSubscriberCount || false;
    const madeForKids = channelData.madeForKids || false;
    const topicCategories = channelData.topicCategories || [];
    const niche = channelData.niche || channelData.subCategoryName || channelData.category || null;

    if (!channelId || channelId === "undefined") {
      logger.error(
        `❌ [YT-SYNC] Critical Mapping Failure: Received invalid channelId: ${JSON.stringify(
          channelData
        )}`
      );
      throw new ApiError(
        400,
        "YouTube Sync Error: A valid Channel ID is required to link your account."
      );
    }

    logger.info(`🔄 [YT-SYNC] Persisting content for channel: ${channelName} (${channelId})`);

    // 1. Mirror Channel Avatar
    let mirroredAvatar = channelData.mirroredAvatarUrl || channelData.mirrored_avatar_url;
    if (!mirroredAvatar && thumbnailUrl) {
      logger.info(`💾 [YT-SYNC] Optimizing Avatar for ${channelId}`);
      mirroredAvatar = await storageService.optimizeAndMirrorUrl(
        thumbnailUrl,
        "media/avatars/youtube",
        { format: "webp" }
      );
    }

    // 2. Mirror Channel Banner
    let mirroredBanner = channelData.mirroredBannerUrl || channelData.mirrored_banner_url;
    if (!mirroredBanner && bannerUrl) {
      logger.info(`💾 [YT-SYNC] Processing & Optimizing banner for ${channelId}`);
      try {
        mirroredBanner = await storageService.optimizeAndMirrorUrl(
          bannerUrl,
          "media/avatars/youtube/banners",
          { format: "jpeg", quality: 90 }
        );
      } catch (bErr) {
        logger.warn(`⚠️ [YT-SYNC] Banner processing failed: ${bErr.message}`);
      }
    }

    // 3. Ensure CreatorProfile exists
    const creatorProfile = await tx.creatorProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // 4. Safety Check: Verify ownership
    const existing = await tx.youTubeChannel.findFirst({
      where: { channel_id: channelId },
      select: { id: true, userId: true },
    });

    if (existing && existing.userId !== userId) {
      throw new ApiError(409, `YouTube channel ${channelId} is already owned by another user.`);
    }

    // 5. Upsert YouTube Channel
    const profileData = {
      creatorProfileId: creatorProfile.id,
      channel_name: channelName,
      thumbnail_url: mirroredAvatar || thumbnailUrl,
      subscriber_count: subscriberCount,
      video_count: videoCount,
      view_count: BigInt(viewCount || "0"),
      custom_url: customUrl,
      banner_url: mirroredBanner || bannerUrl,
      published_at: publishedAt ? new Date(publishedAt) : null,
      country: country,
      keywords: keywords,
      uploads_playlist_id: uploadsPlaylistId,
      last_synced_at: new Date(),
      userId: userId,
      niche: niche,
      language: language,
      hidden_subscriber_count: hiddenSubscriberCount,
      made_for_kids: madeForKids,
      topic_categories: topicCategories,
      sync_status: "idle",
    };

    let youtubeChannel;
    if (existing) {
      youtubeChannel = await tx.youTubeChannel.update({
        where: { id: existing.id },
        data: profileData,
      });
    } else {
      youtubeChannel = await tx.youTubeChannel.create({
        data: { ...profileData, channel_id: channelId },
      });
    }

    // 6. Mirror and Persist Videos
    if (videos && videos.length > 0) {
      logger.info(
        `📽️ [YT-SYNC] Attempting to mirror up to ${videos.length} videos for ${youtubeChannel.id}`
      );

      try {
        const videosToSync = videos.slice(0, 50);

        for (const v of videosToSync) {
          try {
            let mirroredThumb = v.thumbnail;
            try {
              mirroredThumb = await storageService.uploadFromUrl(
                v.thumbnail,
                "uploads/processed/images/youtube"
              );
            } catch (thumbErr) {
              logger.warn(
                `⚠️ [YT-SYNC] Thumbnail mirroring failed for ${v.id}, using original: ${thumbErr.message}`
              );
            }

            videoRecords.push({
              video_id: v.id,
              title: v.title,
              description: v.description || null,
              thumbnail: mirroredThumb || v.thumbnail,
              published_at: v.publishedAt ? new Date(v.publishedAt) : new Date(),
              youtubeChannelId: youtubeChannel.id,
              channel_id: channelId,
              user_id: userId,
              view_count: v.viewCount ? BigInt(v.viewCount) : 0n,
              like_count: v.likeCount ? BigInt(v.likeCount) : 0n,
              comment_count: v.commentCount ? BigInt(v.commentCount) : 0n,
              duration_secs: v.durationSecs || null,
              category_id: v.categoryId || null,
              tags: v.tags ? (Array.isArray(v.tags) ? v.tags.join(",") : String(v.tags)) : null,
              made_for_kids: v.madeForKids || false,
            });
          } catch (vErr) {
            logger.warn(`⚠️ [YT-SYNC] Skipping video ${v.id} record creation: ${vErr.message}`);
          }
        }

        if (videoRecords.length > 0) {
          await tx.youTubeVideo.deleteMany({
            where: { youtubeChannelId: youtubeChannel.id },
          });

          await tx.youTubeVideo.createMany({
            data: videoRecords,
            skipDuplicates: true,
          });
          logger.info(`✅ [YT-SYNC] Successfully persisted ${videoRecords.length} videos.`);

          // Compute engagement rate and average views
          try {
            const videosWithViews = videoRecords.filter((vr) => vr.view_count > 0n);
            let engagementRate = 0;
            let avgViewsPerVideo = 0;

            if (videosWithViews.length > 0) {
              const totalEngagement = videosWithViews.reduce((sum, vr) => {
                const v = Number(vr.view_count);
                const l = Number(vr.like_count || 0n);
                const c = Number(vr.comment_count || 0n);
                return sum + (v > 0 ? (l + c) / v : 0);
              }, 0);
              engagementRate = (totalEngagement / videosWithViews.length) * 100;
            }

            if (videoRecords.length > 0) {
              const totalViews = videoRecords.reduce(
                (sum, vr) => sum + Number(vr.view_count || 0n),
                0
              );
              avgViewsPerVideo = totalViews / videoRecords.length;
            }

            await tx.youTubeChannel.update({
              where: { id: youtubeChannel.id },
              data: {
                engagement_rate: parseFloat(engagementRate.toFixed(4)),
                avg_views_per_video: parseFloat(avgViewsPerVideo.toFixed(2)),
              },
            });
            logger.info(
              `📈 [YT-SYNC] Engagement rate: ${engagementRate.toFixed(2)}% | Avg views: ${avgViewsPerVideo.toFixed(0)}`
            );
          } catch (engErr) {
            logger.warn(`⚠️ [YT-SYNC] Engagement calc skipped: ${engErr.message}`);
          }
        }
      } catch (vidSyncErr) {
        logger.error(`❌ [YT-SYNC] Video persistence layer failed: ${vidSyncErr.message}`);
      }
    }

    // 7. Fetch FULL updated state
    const allChannels = await tx.youTubeChannel.findMany({
      where: { userId },
      include: {
        videos: {
          orderBy: { published_at: "desc" },
          take: 25,
        },
      },
    });

    const allVideos = allChannels
      .flatMap((p) =>
        (p.videos || []).map((v) => {
          const rawThumb = v.thumbnail || v.thumbnail_url || v.thumbnailUrl;
          const resolvedUrl = smartResolveMediaUrl(rawThumb);
          return {
            id: v.id,
            video_id: v.video_id,
            title: v.title,
            description: v.description || null,
            thumbnail: resolvedUrl,
            published_at: v.published_at,
            channel_id: p.channel_id,
            youtubeProfileId: p.id,
            youtubeChannelId: p.id,
            view_count: v.view_count != null ? String(v.view_count) : "0",
            like_count: v.like_count != null ? String(v.like_count) : "0",
            comment_count: v.comment_count != null ? String(v.comment_count) : "0",
            duration_secs: v.duration_secs || null,
            category_id: v.category_id || null,
            tags: v.tags || null,
            made_for_kids: v.made_for_kids || false,
            media: {
              type: "IMAGE",
              status: "READY",
              urls: { thumb: resolvedUrl, feed: resolvedUrl, full: resolvedUrl },
            },
          };
        })
      )
      .sort(
        (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
      );

    // 8. Trigger Notification
    const { default: notificationService } = await import(
      "../../../domains/notification/services/notificationService.js"
    );

    let notificationTitle = "YouTube Profile Updated! 🎥";
    let notificationBody = `Your latest content from ${youtubeChannel.channel_name} is now live on SuviX.`;

    if (triggerReason === "manual_verify") {
      notificationTitle = "Account Linked! 🎥";
      notificationBody = `Your channel ${youtubeChannel.channel_name} was successfully linked to your account. Your latest videos are now live!`;
    }

    notificationService
      .notify({
        userId,
        type: "SYNC_COMPLETE",
        title: notificationTitle,
        body: notificationBody,
        imageUrl: smartResolveMediaUrl(youtubeChannel.thumbnail_url),
        priority: "HIGH",
        entityId: youtubeChannel.id,
        entityType: "YOUTUBE_PROFILE",
        metadata: {
          type: "youtube_sync_complete",
          sync_complete: true,
          videos: allVideos.slice(0, 25),
        },
      })
      .catch((err) =>
        logger.error(`[NOTIFY-SYNC] Failed to send sync notification: ${err.message}`)
      );

    // Invalidate Cache
    await deleteCache([CacheKey.userProfile(userId), CacheKey.userVideos(userId)]);

    // Emit Socket Update
    emitToUser(userId, "user:profile_updated", {
      youtubeProfile: allChannels.map((p) => ({
        ...p,
        thumbnail_url: smartResolveMediaUrl(p.thumbnail_url),
      })),
      youtubeChannels: allChannels.map((p) => ({
        ...p,
        thumbnail_url: smartResolveMediaUrl(p.thumbnail_url),
      })),
      youtubeVideos: allVideos,
    });

    return youtubeChannel;
  } catch (error) {
    logger.error(`❌ [YT-SYNC] Persistence failed: ${error.message}`);
    throw error;
  }
};

/**
 * Execute a manual, synchronous YouTube sync for a user's channels.
 */
export const executeManualSync = async (userId, channelIds, triggerReason = "manual") => {
  if (!channelIds || channelIds.length === 0) return { processed: 0, total: 0 };

  const { default: youtubeApiService } = await import("./youtubeApiService.js");

  const totalChannels = channelIds.length;
  let processedCount = 0;

  for (let i = 0; i < totalChannels; i++) {
    const channelId = channelIds[i];
    let channelName = "YouTube Channel";

    const emitProgress = (stepPercent, step, message) => {
      const baseProgress = Math.round((i / totalChannels) * 100);
      const stepContribution = Math.round((stepPercent / 100) * (100 / totalChannels));
      const progress = Math.min(baseProgress + stepContribution, 99);
      emitToUser(userId, "notification:new", {
        type: "SYNC_PROGRESS",
        metadata: { userId, progress, channelId, channelName, step, message },
      });
    };

    try {
      emitProgress(10, "connection", "Connecting to YouTube API...");

      const channelMetadata = await youtubeApiService.getChannelPublicData({
        identifier: channelId,
        type: "id",
      });
      channelName = channelMetadata.title || channelName;

      emitProgress(45, "metadata", "Fetching channel profile & stats...");

      if (channelMetadata.uploadsPlaylistId) {
        channelMetadata.videos = await youtubeApiService.getPlaylistVideos(
          channelMetadata.uploadsPlaylistId,
          50
        );
      }

      emitProgress(75, "videos", "Syncing video library (up to 50 videos)...");

      await persistYouTubeContent(userId, channelMetadata, triggerReason);

      emitProgress(95, "finalize", "Saving analytics & generating dashboard...");

      processedCount++;
      const progress = Math.round((processedCount / totalChannels) * 100);

      emitToUser(userId, "notification:new", {
        type: "SYNC_PROGRESS",
        metadata: {
          userId,
          progress,
          channelId,
          channelName,
          step: "complete",
          message: `Completed sync for ${channelName}!`,
        },
      });
      emitToUser(userId, "notification:new", {
        type: "SYNC_COMPLETE",
        metadata: { userId, channelId },
      });
    } catch (error) {
      logger.error(`❌ [YT-SYNC-MANUAL] Channel failed`, error, { userId, channelId });
      emitToUser(userId, "notification:new", {
        type: "SYNC_FAILED",
        metadata: {
          userId,
          channelId,
          channelName,
          message: `Failed to sync channel: ${error.message}`,
        },
      });
      throw new Error(`Channel sync failed for ${channelId}: ${error.message}`);
    }
  }

  return { processed: processedCount, total: totalChannels };
};

export default {
  persistYouTubeContent,
  executeManualSync,
};
