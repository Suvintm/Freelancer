import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import { resolveMediaForApi } from "../../../utils/mediaResolver.js";
import { purgeMediaFiles } from "../../storage/purge.utils.js";

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
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

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
      orderBy: { created_at: "desc" },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    // 🚀 PRODUCTION REFINEMENT: Use Centralized Media Resolver
    const transformedPosts = posts.map(post => ({
      ...post,
      media: post.media.map(m => resolveMediaForApi(m))
    }));

    res.json({
      success: true,
      data: transformedPosts,
      page: parseInt(page),
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
