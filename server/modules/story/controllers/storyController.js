import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import { getStoryUploadUrl } from "../services/StoryStorageManager.js";
import { addStoryJob } from "../../workers/queues.js";

/**
 * 🎬 STORY CONTROLLER
 */

/**
 * @desc    Get a pre-signed URL to upload a story to Cloudflare R2
 * @route   GET /api/social/stories/upload-url
 */
export const getUploadTicket = async (req, res) => {
  try {
    const { mimeType = "image/jpeg" } = req.query;
    const userId = req.user.id;

    const ticket = await getStoryUploadUrl(userId, mimeType);

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] getUploadTicket failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to generate upload ticket" });
  }
};

/**
 * @desc    Complete the story creation after media is uploaded to R2
 * @route   POST /api/social/stories
 */
export const createStory = async (req, res) => {
  try {
    const { storageKey, mimeType, caption, width, height, duration } = req.body;
    const userId = req.user.id;

    if (!storageKey) {
      return res.status(400).json({ success: false, message: "Storage key is required" });
    }

    // 1. Create Media & Story records in one transaction
    const story = await prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          userId,
          storageKey,
          mimeType,
          type: mimeType.startsWith("video") ? "VIDEO" : "IMAGE",
          width: width ? Math.round(width) : null,
          height: height ? Math.round(height) : null,
          duration: duration ? Math.round(duration) : null,
          status: "PENDING",
          storage_provider: "S3"
        }
      });

      // 2. Create Story record with 12-hour expiration
      return await tx.story.create({
        data: {
          userId,
          mediaId: media.id,
          caption,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 Hours (Half-Day)
        },
        include: { media: true }
      });
    });

    // 2. Queue the background processing job (OUTSIDE transaction to avoid race condition)
    const storyType = mimeType.startsWith("video") ? "VIDEO" : "IMAGE";
    await addStoryJob(story.mediaId, storageKey, userId, storyType);

    res.status(201).json({
      success: true,
      data: story
    });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] createStory failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to publish story" });
  }
};

/**
 * @desc    Get all active stories for the authenticated user's feed
 * @route   GET /api/social/stories/feed
 */
export const getStoryFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Fetch active stories from users I follow + my own
    // 1. Get following IDs
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const userIds = [userId, ...following.map(f => f.followingId)];

    // 2. Query stories
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: userIds },
        expires_at: { gt: now },
        is_archived: false
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { profile_picture: true }
            }
          }
        },
        // 🚀 Optimization: check if viewer has already seen it
        views: {
          where: { userId },
          take: 1
        }
      },
      orderBy: { created_at: "asc" }
    });

    // 🏎️ Post-process to add simple boolean for UI
    const feed = stories.map(s => {
      const { views, ...data } = s;
      return {
        ...data,
        viewerHasViewed: views.length > 0
      };
    });

    res.json({
      success: true,
      data: feed
    });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] getStoryFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch stories" });
  }
};

/**
 * @desc    Record a unique story view and increment the counter
 * @route   POST /api/social/stories/:storyId/view
 */
export const recordStoryView = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Use atomic transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // 1. Check if view exists
      const existingView = await tx.storyView.findUnique({
        where: {
          storyId_userId: { storyId, userId }
        }
      });

      if (existingView) return; // Silent return if already viewed

      // 2. Create the view record
      await tx.storyView.create({
        data: { storyId, userId }
      });

      // 3. Atomically increment the view_count cache
      await tx.story.update({
        where: { id: storyId },
        data: { view_count: { increment: 1 } }
      });
    });

    res.json({ success: true, message: "View recorded" });
  } catch (error) {
    logger.error(`❌ [STORY_CTRL] recordStoryView failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to record view" });
  }
};

/**
 * @desc    Get active stories grouped by user (For Story Bar)
 * @route   GET /api/social/stories/active
 */
export const getActiveStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Get IDs of users I follow
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const interestIds = [userId, ...following.map(f => f.followingId)];

    // 2. Fetch all active stories from my network
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: interestIds },
        expires_at: { gt: now },
        is_archived: false
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { profile_picture: true } }
          }
        },
        views: {
            where: { userId },
            take: 1
        }
      },
      orderBy: { created_at: "asc" }
    });

    // 3. Group by User (The format the StoryBar expects)
    const grouped = stories.reduce((acc, story) => {
      const uid = story.userId;
      if (!acc[uid]) {
        acc[uid] = {
          _id: uid,
          username: uid === userId ? "Your Story" : story.user.username,
          avatar: story.user.profile?.profile_picture || null,
          isUserStory: uid === userId,
          hasActiveStory: true,
          isSeen: true, // Will be set to false if any slide is unseen
          slides: []
        };
      }

      const resolved = resolveMediaForApi(story.media);
      const isSeen = story.views.length > 0;
      
      if (!isSeen) acc[uid].isSeen = false;

      acc[uid].slides.push({
        id: story.id,
        image: resolved.urls.video || resolved.urls.full, // Full view
        thumb: resolved.urls.thumb,
        type: story.media.type,
        durationMs: story.media.type === 'VIDEO' ? (story.media.duration * 1000) : 5000,
        caption: story.caption,
        created_at: story.created_at
      });

      return acc;
    }, {});

    // 4. Final format: User's own story always first
    const result = Object.values(grouped).sort((a, b) => {
        if (a._id === userId) return -1;
        if (b._id === userId) return 1;
        return 0;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error(`❌ [STORY_CTRL] getActiveStories failure: ${error.stack}`);
    res.status(500).json({ success: false, message: "Failed to fetch active stories" });
  }
};

export default { getUploadTicket, createStory, getStoryFeed, recordStoryView, getActiveStories };
