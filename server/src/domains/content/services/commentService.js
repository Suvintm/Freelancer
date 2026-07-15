import prisma from "../../../infrastructure/database/postgres.js";
import { commentProcessingQueue } from "../../../infrastructure/queue/queues.config.js";
import { ApiError } from "../../../shared/middleware/error-handler.middleware.js";

class CommentService {
  /**
   * Adds a comment or reply to an entity
   */
  async addComment(data) {
    const { userId, entityType, entityId, parentId, content } = data;

    // Build base comment data
    const commentData = {
      userId,
      content,
    };

    if (parentId) {
      commentData.parentId = parentId;
    }

    // Attach to correct entity
    if (entityType === 'POST') commentData.postId = entityId;
    else if (entityType === 'REEL') commentData.reelId = entityId;
    else if (entityType === 'YOUTUBE_POST') commentData.youtubePostId = entityId;
    else throw new ApiError(`Invalid entityType: ${entityType}`, 400);

    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        user: { select: { id: true, username: true, role: true, is_verified: true, profile: { select: { profile_picture: true } } } }
      }
    });

    // Enqueue jobs
    if (commentProcessingQueue) {
      // 1. Sync counter asynchronously
      await commentProcessingQueue.add('sync-count', {
        type: 'SYNC_COUNT',
        entityType,
        entityId
      });

      // 2. Dispatch notification asynchronously
      await commentProcessingQueue.add('send-notification', {
        type: 'SEND_NOTIFICATION',
        commentId: comment.id,
        authorId: userId
      });
      
      // If it's a reply, we also need to increment the reply_count of the parent comment
      if (parentId) {
        // Technically this should also be async or just done here. Doing it here for simplicity
        await prisma.comment.update({
          where: { id: parentId },
          data: { reply_count: { increment: 1 } }
        });
      }
    }

    return comment;
  }

  /**
   * Gets top level comments using cursor pagination
   */
  async getComments(entityType, entityId, limit = 20, cursor = null) {
    const query = {
      where: {
        [entityType === 'POST' ? 'postId' : entityType === 'REEL' ? 'reelId' : 'youtubePostId']: entityId,
        parentId: null, // Only top-level
        is_deleted: false,
        status: 'active'
      },
      take: limit + 1, // Fetch one extra to determine nextCursor
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ],
      include: {
        user: { select: { id: true, username: true, role: true, is_verified: true, profile: { select: { profile_picture: true } } } },
        // If 1-level deep, maybe we don't fetch replies here, just show reply_count
      }
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor itself
    }

    const comments = await prisma.comment.findMany(query);
    
    let nextCursor = null;
    if (comments.length > limit) {
      const nextItem = comments.pop(); // Remove the extra item
      nextCursor = nextItem.id;
    }

    return { comments, nextCursor };
  }

  /**
   * Gets replies for a specific comment using cursor pagination
   */
  async getReplies(parentId, limit = 50, cursor = null) {
    const query = {
      where: {
        parentId,
        is_deleted: false,
        status: 'active'
      },
      take: limit + 1,
      orderBy: [
        { created_at: 'asc' }, // Replies typically read top-to-bottom
        { id: 'asc' }
      ],
      include: {
        user: { select: { id: true, username: true, role: true, is_verified: true, profile: { select: { profile_picture: true } } } }
      }
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const replies = await prisma.comment.findMany(query);
    
    let nextCursor = null;
    if (replies.length > limit) {
      const nextItem = replies.pop();
      nextCursor = nextItem.id;
    }

    return { replies, nextCursor };
  }

  /**
   * Toggles a like on a comment
   */
  async toggleLike(userId, commentId) {
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId }
      }
    });

    if (existingLike) {
      await prisma.commentLike.delete({ where: { id: existingLike.id } });
      await prisma.comment.update({
        where: { id: commentId },
        data: { like_count: { decrement: 1 } }
      });
      return { liked: false };
    } else {
      await prisma.commentLike.create({
        data: { commentId, userId }
      });
      await prisma.comment.update({
        where: { id: commentId },
        data: { like_count: { increment: 1 } }
      });
      return { liked: true };
    }
  }

  /**
   * Soft deletes a comment
   */
  async deleteComment(userId, commentId) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new ApiError("Comment not found", 404);
    if (comment.userId !== userId) throw new ApiError("Unauthorized", 403);

    // Soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { is_deleted: true }
    });

    // Enqueue sync-count to update parent count
    if (commentProcessingQueue) {
      const entityType = comment.postId ? 'POST' : comment.reelId ? 'REEL' : 'YOUTUBE_POST';
      const entityId = comment.postId || comment.reelId || comment.youtubePostId;
      
      await commentProcessingQueue.add('sync-count', {
        type: 'SYNC_COUNT',
        entityType,
        entityId
      });

      if (comment.parentId) {
        await prisma.comment.update({
          where: { id: comment.parentId },
          data: { reply_count: { decrement: 1 } }
        });
      }
    }

    return { success: true };
  }
}

export default new CommentService();
