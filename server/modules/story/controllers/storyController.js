/**
 * storyController.js — Production Story API
 *
 * Key architectural decisions:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. IMAGE stories: canvas screenshot has ALL overlays baked in as pixels.
 *    We store EMPTY objects/drawPaths in metadata. If we stored them, the
 *    viewer would render them AGAIN on top → double stickers at wrong positions.
 *
 * 2. VIDEO stories: raw video has no overlays. Overlays are stored in metadata
 *    and rendered dynamically in the viewer as a separate layer.
 *
 * 3. canvas_width / canvas_height are stored on the Story row so the viewer
 *    can scale overlay coordinates from any creator device to any viewer device.
 *
 * 4. bg_media_url / bg_thumb_url are populated by the worker AFTER processing.
 *    The feed query returns both so the viewer gets the CDN URL directly.
 */

import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import { getStoryUploadUrl } from "../services/StoryStorageManager.js";
import { addStoryJob } from "../../workers/queues.js";
import { resolveMediaForApi } from "../../../utils/mediaResolver.js";
import storage from "../../storage/storage.service.js";
import { STORAGE_FOLDERS } from "../../storage/providers/s3/s3.constants.js";
import notificationService from "../../notification/services/notificationService.js";

// ─── Config ───────────────────────────────────────────────────────────────────
const STORY_EXPIRY_MINUTES = 2; // Testing: 2 minutes (Production: 12 hours)

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/social/stories/upload-url
// Step 1 of upload: returns a pre-signed PUT URL for direct S3/R2 upload.
// The mobile app uploads directly — server never touches file bytes.
// ─────────────────────────────────────────────────────────────────────────────
export const getUploadTicket = async (req, res) => {
  try {
    const { mimeType = "image/jpeg" } = req.query;
    const userId = req.user.id;

    // Validate allowed mime types (security guard)
    const ALLOWED = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/quicktime", "video/webm",
    ];
    if (!ALLOWED.includes(mimeType)) {
      return res.status(400).json({ success: false, message: `Unsupported type: ${mimeType}` });
    }

    const ticket = await getStoryUploadUrl(userId, mimeType);
    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] getUploadTicket failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to generate upload ticket" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/social/stories
// Step 2 of upload: creates DB records + enqueues BullMQ processing job.
// Called AFTER the client successfully PUT the file to S3/R2.
// ─────────────────────────────────────────────────────────────────────────────
export const createStory = async (req, res) => {
  try {
    const {
      storageKey,
      mimeType,
      caption,
      width,
      height,
      duration,
      metadata = {},
      displayDuration = 10,
    } = req.body;
    const userId = req.user.id;

    if (!storageKey) {
      return res.status(400).json({ success: false, message: "storageKey is required" });
    }

    const mediaType = mimeType?.startsWith("video") ? "VIDEO" : "IMAGE";

    // ── CRITICAL: Overlay metadata strategy ──────────────────────────────────
    //
    // IMAGE story → canvas screenshot already has ALL layers baked into pixels.
    //   Storing objects/drawPaths would cause the viewer to render them AGAIN
    //   on top of the screenshot → double stickers at wrong positions.
    //   We clear them but keep canvasBg + dimensions for reference.
    //
    // VIDEO story → raw video has no overlays. We keep all objects/drawPaths
    //   so the viewer renders them as dynamic overlay layers.
    //
    const cleanMetadata = {
      canvasBg:     metadata.canvasBg ?? null,
      canvasWidth:  metadata.canvasWidth ?? null,
      canvasHeight: metadata.canvasHeight ?? null,
      // For IMAGE: empty (baked into screenshot). For VIDEO: keep overlay data.
      objects:   mediaType === "IMAGE" ? [] : (metadata.objects ?? []),
      drawPaths: mediaType === "IMAGE" ? [] : (metadata.drawPaths ?? []),
    };

    const story = await prisma.$transaction(async (tx) => {
      // 1. Create Media record (holds raw upload key + will hold processed variants)
      const media = await tx.media.create({
        data: {
          userId,
          storageKey,
          mimeType,
          type: mediaType,
          width:    width    ? Math.round(width)    : null,
          height:   height   ? Math.round(height)   : null,
          duration: duration ? Math.round(duration) : null,
          status: "PENDING",
          storage_provider: "S3",
        },
      });

      // 2. Create Story record
      // bg_media_url / bg_thumb_url / bg_blurhash are null now;
      // storyProcessor fills them in after transcoding is done.
      return await tx.story.create({
        data: {
          userId,
          mediaId:          media.id,
          caption:          caption || null,
          metadata:         cleanMetadata,
          canvas_width:     metadata.canvasWidth  ? parseFloat(metadata.canvasWidth)  : null,
          canvas_height:    metadata.canvasHeight ? parseFloat(metadata.canvasHeight) : null,
          bg_media_type:    mediaType,
          display_duration: Number(displayDuration) || 10,
          expires_at:       new Date(Date.now() + STORY_EXPIRY_MINUTES * 60 * 1000),
        },
        include: { media: true },
      });
    });

    // Enqueue background processing OUTSIDE transaction (avoids transaction timeout)
    await addStoryJob(story.mediaId, storageKey, userId, mediaType);

    logger.info(`✅ [STORY_CTRL] Story ${story.id} created by ${userId}. Type: ${mediaType}`);
    res.status(201).json({ success: true, data: { id: story.id, mediaId: story.mediaId, status: "PROCESSING" } });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] createStory failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to publish story" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/social/stories/active
// Returns stories grouped by user for the StoryBar component.
// Returns canvas_width/height + processed CDN URLs for correct overlay rendering.
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const now           = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    // 1. Get IDs of users I follow
    const following = await prisma.userFollow.findMany({
      where:  { followerId: userId },
      select: { followingId: true },
    });
    const interestIds = [userId, ...following.map(f => f.followingId)];

    // 2. Fetch all active stories — only READY media to avoid showing processing stubs
    const stories = await prisma.story.findMany({
      where: {
        userId:      { in: interestIds },
        expires_at:  { gt: now },
        created_at:  { gt: twoMinutesAgo },
        is_archived: false,
        media: { status: "READY" },       // ← Only show fully processed stories
      },
      include: {
        media: {
          select: {
            id: true, type: true, status: true,
            mimeType: true, duration: true,
            variants: true, blurhash: true,
            width: true, height: true, storage_provider: true,
          },
        },
        user: {
          select: {
            id: true, username: true,
            profile: { select: { profile_picture: true } },
          },
        },
        views: { where: { userId }, take: 1 },
      },
      orderBy: { created_at: "asc" },
    });

    // 3. Group by userId
    const grouped = {};

    for (const story of stories) {
      const uid      = story.userId;
      const resolved = resolveMediaForApi(story.media);
      const isSeen   = story.views.length > 0;

      if (!resolved?.urls) continue; // Skip stories that failed to resolve (still processing)

      // ── Resolve the primary media URL ──────────────────────────────────────
      // Priority: worker-populated bg_media_url > resolved CDN URL
      const primaryUrl =
        story.bg_media_url ||
        resolved.urls.hls  ||
        resolved.urls.video ||
        resolved.urls.full  ||
        null;

      const thumbUrl =
        story.bg_thumb_url ||
        resolved.urls.thumb ||
        story.user?.profile?.profile_picture ||
        null;

      if (!primaryUrl) continue; // Skip if no usable URL yet

      if (!grouped[uid]) {
        grouped[uid] = {
          _id:            uid,
          userId:         uid,
          username:       uid === userId ? "You" : (story.user.profile?.name ?? story.user.username ?? "User"),
          avatar:         thumbUrl,
          isUserStory:    uid === userId,
          hasActiveStory: true,
          isSeen:         true,
          slides:         [],
        };
      }

      // Always use the latest story's thumbnail for the group avatar
      if (thumbUrl) grouped[uid].avatar = thumbUrl;
      if (!isSeen)  grouped[uid].isSeen = false;

      grouped[uid].slides.push({
        id:             story.id,
        image:          primaryUrl,
        thumb:          thumbUrl,
        type:           story.media.type,                               // "IMAGE" | "VIDEO"
        durationMs:     (story.display_duration ?? 10) * 1000,
        caption:        story.caption,
        isSeen:         isSeen,
        // ── Overlay data (empty for IMAGE, populated for VIDEO) ─────────────
        metadata:       story.metadata ?? {},
        // ── Canvas dimensions — viewer needs these for coordinate scaling ────
        canvas_width:   story.canvas_width,
        canvas_height:  story.canvas_height,
        // ── Blur placeholder ─────────────────────────────────────────────────
        blurhash:       story.bg_blurhash ?? story.media.blurhash ?? null,
        created_at:     story.created_at,
      });
    }

    // 4. Sort: own stories first, then unseen, then seen
    const result = Object.values(grouped).sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return  1;
      const aAllSeen = a.slides.every(s => s.isSeen);
      const bAllSeen = b.slides.every(s => s.isSeen);
      if (!aAllSeen && bAllSeen) return -1;
      if (aAllSeen && !bAllSeen) return  1;
      return 0;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] getActiveStories failure: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch active stories" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/social/stories/feed  (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
export const getStoryFeed = async (req, res) => {
  return getActiveStories(req, res);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/social/stories/:storyId/view
// Atomic view deduplication using Prisma's unique constraint.
// ─────────────────────────────────────────────────────────────────────────────
export const recordStoryView = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId      = req.user.id;

    // Upsert pattern — if view exists, no-op. Prevents race conditions.
    await prisma.$transaction(async (tx) => {
      const exists = await tx.storyView.findUnique({
        where: { storyId_userId: { storyId, userId } },
      });
      if (exists) return;

      await tx.storyView.create({ data: { storyId, userId } });
      await tx.story.update({
        where: { id: storyId },
        data:  { view_count: { increment: 1 } },
      });
    });

    res.json({ success: true });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] recordStoryView failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to record view" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/social/stories/:storyId
// Ownership check → DB delete (cascades to views) → async S3 cleanup.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId      = req.user.id;

    const story = await prisma.story.findUnique({
      where:   { id: storyId },
      include: { media: true },
    });

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { mediaId }      = story;
    const { storageKey }   = story.media;

    // DB delete (cascades to Story + StoryView via FK)
    await prisma.media.delete({ where: { id: mediaId } });

    // Non-blocking S3 cleanup
    const folderPrefix = `${STORAGE_FOLDERS.STORIES}/${userId}/${mediaId}/`;
    storage.deleteFolder(folderPrefix).catch(err =>
      logger.error(`❌ [STORY_DELETE_S3] folder purge failed: ${err.message}`)
    );
    if (storageKey && !storageKey.includes(mediaId)) {
      storage.deleteObjects(storageKey).catch(() => {});
    }

    // Push notification
    notificationService.notify({
      userId,
      type:       "STORY_DELETED",
      title:      "Story Deleted",
      body:       "Your story has been removed.",
      entityId:   storyId,
      entityType: "STORY",
    }).catch(err => logger.error(`⚠️ [STORY_DELETE_NOTIF] FCM failed: ${err.message}`));

    logger.info(`✨ [STORY_DELETE] ${userId} deleted story ${storyId}`);
    res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] deleteStory failure: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to delete story" });
  }
};

export default {
  getUploadTicket,
  createStory,
  getStoryFeed,
  getActiveStories,
  recordStoryView,
  deleteStory,
};