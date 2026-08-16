import prisma from "../../../infrastructure/database/postgres.js";
import storageService from "../../../infrastructure/storage/storage-client.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { ApiError } from "../../../shared/kernel/errors.js";
import { instagramApiService } from "./instagramApiService.js";
import { emitToUser } from "../../../platform/socket/socket.gateway.js";

/**
 * PRODUCTION-GRADE INSTAGRAM SYNC SERVICE
 * Handles data persistence, S3 asset mirroring, and engagement metrics calculation.
 */

// S3 Dedicated Storage Directories for Instagram
const S3_FOLDERS = {
  PROFILE: "instagram/profile",
  POST_THUMBNAILS: "instagram/thumbnails/posts",
  REEL_THUMBNAILS: "instagram/thumbnails/reels",
};

/**
 * Persist Instagram Account, Media Posts/Reels, and Analytics
 * @param {string} userId - ID of the professional user
 * @param {Object} accountData - Data from Instagram API / registration
 * @param {string} triggerReason - Why this sync is happening
 * @param {Object} tx - Optional Prisma transaction client
 */
export const persistInstagramContent = async (
  userId,
  accountData,
  triggerReason = "manual",
  tx = prisma
) => {
  try {
    const accountId = String(
      accountData.accountId || accountData.account_id || accountData.id || ""
    ).trim();
    const handle = String(
      accountData.handle || accountData.username || ""
    ).trim();
    const displayName = accountData.name || accountData.display_name || handle;
    const profilePictureUrl =
      accountData.profilePictureUrl ||
      accountData.profile_picture_url ||
      accountData.avatar ||
      null;
    const followerCount = Number(
      accountData.followerCount || accountData.followers_count || 0
    );
    const followingCount = Number(
      accountData.followingCount || accountData.following_count || 0
    );
    const mediaCount = Number(
      accountData.mediaCount || accountData.media_count || 0
    );
    const biography = accountData.bio || accountData.biography || null;
    const website = accountData.website || null;
    const accountType = accountData.accountType || accountData.account_type || "CREATOR";
    const recentMedia = accountData.recentMedia || accountData.media || [];
    const isPrimary = accountData.isPrimary ?? accountData.is_primary ?? true;

    if (!accountId || !handle) {
      logger.error(
        `❌ [INSTA-SYNC] Invalid Instagram account payload: ${JSON.stringify(accountData)}`
      );
      throw new ApiError(
        400,
        "Instagram Sync Error: A valid Account ID and username are required."
      );
    }

    logger.info(`🔄 [INSTA-SYNC] Persisting content for @${handle} (${accountId}) [Reason: ${triggerReason}]`);

    // 50% Progress: Metadata received and beginning asset mirroring
    emitToUser(userId, "notification:new", {
      type: "SYNC_PROGRESS",
      metadata: {
        userId,
        progress: 50,
        channelName: `@${handle}`,
        step: "metadata",
        message: "Fetching Instagram profile & metadata...",
        platform: "instagram",
      },
    });
    let mirroredAvatar = accountData.mirroredAvatarUrl || accountData.mirrored_avatar_url;
    if (!mirroredAvatar && profilePictureUrl) {
      if (profilePictureUrl.startsWith("http://") || profilePictureUrl.startsWith("https://")) {
        logger.info(`💾 [INSTA-SYNC] Optimizing & Mirroring Avatar for @${handle} to ${S3_FOLDERS.PROFILE}`);
        try {
          mirroredAvatar = await storageService.optimizeAndMirrorUrl(
            profilePictureUrl,
            S3_FOLDERS.PROFILE,
            { format: "webp", quality: 90 }
          );
        } catch (avatarErr) {
          logger.warn(`⚠️ [INSTA-SYNC] Avatar mirroring fallback to original: ${avatarErr.message}`);
          mirroredAvatar = profilePictureUrl;
        }
      } else {
        mirroredAvatar = profilePictureUrl;
      }
    }

    // 2. Ensure CreatorProfile exists
    await tx.creatorProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // 3. Ensure InstagramProfile exists & update status
    const igProfile = await tx.instagramProfile.upsert({
      where: { userId },
      update: {
        status: "LINKED",
        last_synced_at: new Date(),
      },
      create: {
        userId,
        status: "LINKED",
        connected_at: new Date(),
        last_synced_at: new Date(),
      },
    });

    // 4. Check existing account
    const existingAccount = await tx.instagramAccount.findFirst({
      where: { account_id: accountId },
      select: { id: true, userId: true },
    });

    if (existingAccount && existingAccount.userId !== userId) {
      throw new ApiError(
        409,
        `Instagram account @${handle} is already claimed by another user.`
      );
    }

    // Calculate Engagement Metrics from the 15 latest media items
    let totalLikes = 0;
    let totalComments = 0;
    let validMediaCount = 0;

    if (recentMedia && Array.isArray(recentMedia) && recentMedia.length > 0) {
      recentMedia.forEach((m) => {
        const likes = Number(m.likeCount || m.like_count || 0);
        const comments = Number(m.commentsCount || m.comment_count || 0);
        totalLikes += likes;
        totalComments += comments;
        validMediaCount++;
      });
    }

    const avgLikes = validMediaCount > 0 ? parseFloat((totalLikes / validMediaCount).toFixed(1)) : 0.0;
    const avgComments = validMediaCount > 0 ? parseFloat((totalComments / validMediaCount).toFixed(1)) : 0.0;
    const engagementRate =
      followerCount > 0 && validMediaCount > 0
        ? parseFloat((((avgLikes + avgComments) / followerCount) * 100).toFixed(2))
        : 0.0;

    // 5. Upsert InstagramAccount
    const accountPayload = {
      display_name: displayName,
      username: handle,
      biography,
      website,
      profile_picture_url: mirroredAvatar || profilePictureUrl,
      account_type: accountType,
      followers_count: followerCount,
      following_count: followingCount,
      media_count: mediaCount,
      avg_likes: avgLikes,
      engagement_rate: engagementRate,
      is_primary: isPrimary,
    };

    let instagramAccount;
    if (existingAccount) {
      instagramAccount = await tx.instagramAccount.update({
        where: { id: existingAccount.id },
        data: accountPayload,
      });
    } else {
      instagramAccount = await tx.instagramAccount.create({
        data: {
          ...accountPayload,
          account_id: accountId,
          userId,
          instagramProfileId: igProfile.id,
        },
      });
    }

    // 6. Mirror & Persist Posts and Reels (Up to 15 items)
    // 75% Progress: Mirroring thumbnails to S3
    emitToUser(userId, "notification:new", {
      type: "SYNC_PROGRESS",
      metadata: {
        userId,
        progress: 75,
        channelName: `@${handle}`,
        step: "mirroring",
        message: "Mirroring latest post & reel thumbnails to S3...",
        platform: "instagram",
      },
    });

    const postRecords = [];
    if (recentMedia && Array.isArray(recentMedia) && recentMedia.length > 0) {
      logger.info(
        `📸 [INSTA-SYNC] Mirroring up to ${recentMedia.length} media thumbnails for @${handle}`
      );

      for (const m of recentMedia.slice(0, 15)) {
        try {
          const postId = String(m.id || m.post_id || "").trim();
          if (!postId) continue;

          const mediaType = String(m.mediaType || m.media_type || "IMAGE").toUpperCase();
          const rawThumb = m.thumbnailUrl || m.thumbnail_url || m.mediaUrl || m.media_url || null;
          const isReelOrVideo = mediaType === "VIDEO" || mediaType === "REELS";
          const destinationFolder = isReelOrVideo
            ? S3_FOLDERS.REEL_THUMBNAILS
            : S3_FOLDERS.POST_THUMBNAILS;

          let mirroredThumb = rawThumb;
          if (rawThumb && (rawThumb.startsWith("http://") || rawThumb.startsWith("https://"))) {
            try {
              mirroredThumb = await storageService.uploadFromUrl(rawThumb, destinationFolder);
            } catch (thumbErr) {
              logger.warn(
                `⚠️ [INSTA-SYNC] Thumbnail mirroring failed for ${postId}, using original: ${thumbErr.message}`
              );
            }
          }

          postRecords.push({
            post_id: postId,
            instagramAccountId: instagramAccount.id,
            userId,
            media_type: mediaType,
            thumbnail_url: mirroredThumb,
            media_url: m.mediaUrl || m.media_url || null,
            permalink: m.permalink || `https://instagram.com/p/${postId}`,
            caption: m.caption || null,
            like_count: Number(m.likeCount || m.like_count || 0),
            comment_count: Number(m.commentsCount || m.comment_count || 0),
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          });
        } catch (mediaItemErr) {
          logger.warn(`⚠️ [INSTA-SYNC] Skipping corrupt media item: ${mediaItemErr.message}`);
        }
      }

      if (postRecords.length > 0) {
        // Clear and re-populate the latest 15 posts cleanly
        await tx.instagramPost.deleteMany({
          where: { instagramAccountId: instagramAccount.id },
        });

        await tx.instagramPost.createMany({
          data: postRecords,
          skipDuplicates: true,
        });

      }
    }

    // 7. Write Sync Log
    await tx.instagramSyncLog.create({
      data: {
        instagramAccountId: instagramAccount.id,
        status: "idle",
        lastSyncedAt: new Date(),
      },
    });

    logger.info(`🎉 [INSTA-SYNC] Completed sync for @${handle} (Engagement: ${engagementRate}%, Avg Likes: ${avgLikes})`);

    // 100% Progress: Sync fully complete
    emitToUser(userId, "notification:new", {
      type: "SYNC_PROGRESS",
      metadata: {
        userId,
        progress: 100,
        channelName: `@${handle}`,
        step: "complete",
        message: `Completed sync for @${handle}!`,
        platform: "instagram",
      },
    });

    emitToUser(userId, "user:profile_updated", {
      instagramProfile: igProfile,
    });

    return {
      success: true,
      account: instagramAccount,
      syncedMediaCount: postRecords.length,
      engagementRate,
      avgLikes,
    };
  } catch (error) {
    logger.error(`❌ [INSTA-SYNC] Failed to persist Instagram content: ${error.message}`);
    throw error;
  }
};

/**
 * Execute Full Fresh Sync by Calling Instagram Graph API directly
 */
export const executeDirectInstagramSync = async (
  userId,
  accessToken,
  emitProgress = null,
  triggerReason = "manual"
) => {
  try {
    // 50% Progress: Fetching profile & metadata
    if (typeof emitProgress === "function") {
      emitProgress(50, "metadata", "Fetching Instagram profile & metadata...");
    }

    const freshProfile = await instagramApiService.fetchCreatorProfile(accessToken);

    // 75% Progress: Mirroring thumbnails to S3
    if (typeof emitProgress === "function") {
      emitProgress(75, "mirroring", "Mirroring latest post & reel thumbnails to S3...");
    }

    const result = await persistInstagramContent(userId, freshProfile, triggerReason);

    // 100% Progress: Complete
    if (typeof emitProgress === "function") {
      emitProgress(100, "complete", `Completed sync for @${freshProfile.handle}!`);
    }

    return result;
  } catch (err) {
    logger.error(`❌ [INSTA-SYNC] Direct sync failed: ${err.message}`);
    throw err;
  }
};

export default {
  persistInstagramContent,
  executeDirectInstagramSync,
};
