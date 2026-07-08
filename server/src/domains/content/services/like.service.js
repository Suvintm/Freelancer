import prisma from '../../../infrastructure/database/postgres.js';
import logger from '../../../infrastructure/monitoring/logger.js';

/**
 * Handle a like/unlike atomically using PostgreSQL
 * @param {string} type - 'POST', 'REEL', 'YOUTUBE_POST', 'POLL'
 * @param {string} id - The content ID
 * @param {string} userId - The user ID
 * @param {string} action - 'like' or 'unlike' (optional, falls back to toggle)
 */
export const toggleLike = async (type, id, userId, action = "") => {
    let LikeModel;
    let ContentModel;
    let parentIdField;
    
    if (type === "POST") {
      LikeModel = prisma.postLike;
      ContentModel = prisma.post;
      parentIdField = "postId";
    } else if (type === "REEL") {
      LikeModel = prisma.reelLike;
      ContentModel = prisma.reel;
      parentIdField = "reelId";
    } else if (type === "YOUTUBE_POST") {
      LikeModel = prisma.youtubePostLike;
      ContentModel = prisma.youtubePost;
      parentIdField = "youtubePostId";
    } else if (type === "POLL") {
      LikeModel = prisma.pollLike;
      ContentModel = prisma.poll;
      parentIdField = "pollId";
    } else {
      throw new Error(`Unsupported content type: ${type}`);
    }

    // Check existing like
    const existing = await LikeModel.findFirst({
        where: { [parentIdField]: id, userId }
    });

    let shouldLike = false;
    if (action === "like") shouldLike = true;
    else if (action === "unlike") shouldLike = false;
    else shouldLike = !existing; // toggle

    try {
        if (shouldLike && !existing) {
            // Create like and increment count atomically
            await prisma.$transaction([
                LikeModel.create({ data: { [parentIdField]: id, userId } }),
                ContentModel.update({ where: { id }, data: { like_count: { increment: 1 } } })
            ]);
            const current = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
            return { isLiked: true, count: current.like_count };
        } else if (!shouldLike && existing) {
            // Delete like and decrement count atomically
            await prisma.$transaction([
                LikeModel.deleteMany({ where: { [parentIdField]: id, userId } }), // deleteMany used since we don't have a unique compound ID defined in this context
                ContentModel.update({ where: { id }, data: { like_count: { decrement: 1 } } })
            ]);
            const current = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
            return { isLiked: false, count: current.like_count };
        }
    } catch (error) {
        logger.warn(`Like toggle race condition avoided for ${type}:${id}, falling back to read.`);
    }

    // No-op or recovered from race condition
    const current = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
    return { isLiked: !!existing, count: current ? current.like_count : 0 };
};

/**
 * Helper to fetch the current count from DB
 */
export const getLikeCount = async (type, id) => {
    let ContentModel;
    if (type === "POST") ContentModel = prisma.post;
    else if (type === "REEL") ContentModel = prisma.reel;
    else if (type === "YOUTUBE_POST") ContentModel = prisma.youtubePost;
    else if (type === "POLL") ContentModel = prisma.poll;
    else return 0;
    
    const current = await ContentModel.findUnique({ where: { id }, select: { like_count: true } });
    return current ? current.like_count : 0;
};
