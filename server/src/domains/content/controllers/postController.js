import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { resolveMediaForApi } from "../../../shared/utils/media-resolver.js";
import { purgeMediaFiles } from "../../media/services/purge.utils.js";
import { withCache, hashQuery } from "../../../shared/utils/cache.js";

/**
 * 📝 POST CONTROLLER (SOCIAL MODULE)
 */

/**
 * @desc    Create a new Post (Image, Video, or Reel)
 * @route   POST /api/social/posts
 */
export const createPost = async (req, res) => {
  try {
    const { caption, mediaIds, type = "IMAGE", isReel = false, visibility = "PUBLIC" } = req.body;
    const userId = req.user.id;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ success: false, message: "Media is required for a post" });
    }

    // Atomic Transaction: Create Post and Link Media
    const post = await prisma.$transaction(async (tx) => {
      // 1. Create the Post
      const newPost = await tx.post.create({
        data: {
          userId,
          caption,
          type,
          isReel,
          visibility,
        },
      });

      // 2. Link the existing Media records to this Post
      await tx.media.updateMany({
        where: {
          id: { in: mediaIds },
          userId,
        },
        data: {
          postId: newPost.id,
        },
      });

      return newPost;
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(`❌ [POST_CONTROLLER] createPost failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

/**
 * @desc    Get Social Feed (Home Screen)
 * @route   GET /api/social/feed
 */
export const getFeed = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit, 10);
    
    // Create unique cache key for this specific pagination cursor
    const cacheKey = `cache:feed:public:${hashQuery({ cursor, limit })}`;
    const TTL_SECONDS = 30; // Absorb massive traffic spikes for 30s without hitting DB

    const feedData = await withCache(cacheKey, TTL_SECONDS, async () => {
      const cursorObj = cursor ? { id: cursor } : undefined;
      const skip = cursor ? 1 : 0;

      const posts = await prisma.post.findMany({
        where: {
          visibility: "PUBLIC",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  name: true,
                  profile_picture: true,
                },
              },
            },
          },
          media: {
            where: {
              status: "READY",
            },
            select: {
              id: true,
              type: true,
              variants: true,
              blurhash: true,
              width: true,
              height: true,
              duration: true,
            },
          },
        },
        orderBy: { id: "desc" },
        take: take,
        skip: skip,
        ...(cursorObj && { cursor: cursorObj }),
      });

      // 🚀 PRODUCTION REFINEMENT: Use Centralized Media Resolver
      const transformedPosts = posts.map(post => ({
        ...post,
        media: post.media.map(m => resolveMediaForApi(m))
      }));
      
      const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
      
      return {
        data: transformedPosts,
        nextCursor
      };
    });

    res.json({
      success: true,
      data: feedData.data,
      nextCursor: feedData.nextCursor,
    });
  } catch (error) {
    logger.error(`❌ [POST_CONTROLLER] getFeed failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
};

/**
 * @desc    Delete a Post and its Media
 * @route   DELETE /api/social/posts/:postId
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 1. Fetch post with media to get keys before DB deletion
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { media: true }
    });

    if (!post || post.userId !== userId) {
      return res.status(404).json({ success: false, message: "Post not found or unauthorized" });
    }

    // 2. PURGE S3 STORAGE (Critical Step)
    await Promise.all(post.media.map(m => purgeMediaFiles(m)));

    // 3. Delete from Database
    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({
      success: true,
      message: "Post and associated media permanently deleted."
    });
  } catch (error) {
    logger.error(`❌ [POST_CTRL] deletePost failure: ${error.message}`);
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
};

export default { createPost, getFeed, deletePost };
