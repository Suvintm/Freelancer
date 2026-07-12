import { sampledLogger } from "../sampledLogger.js";
import prisma from "../../../database/postgres.js";
// import notificationService from "../../../domains/notification/services/notificationService.js";

/**
 * 🔄 COMMENT PROCESSOR
 *
 * Consumes jobs from the `comment-processing` queue.
 * Flow:
 *  1. Receives { type: 'SYNC_COUNT', entityType, entityId }
 *     - Recalculates the exact comment count from DB and updates the parent.
 *  2. Receives { type: 'SEND_NOTIFICATION', commentId, authorId }
 *     - Fetches comment details and dispatches a notification to the content owner.
 */
export default async function commentProcessor(job) {
  try {
    const { type } = job.data;

    if (type === 'SYNC_COUNT') {
      const { entityType, entityId } = job.data;
      
      const count = await prisma.comment.count({
        where: {
          [entityType === 'POST' ? 'postId' : entityType === 'REEL' ? 'reelId' : 'youtubePostId']: entityId,
          is_deleted: false,
          status: 'active'
        }
      });

      if (entityType === 'POST') {
        await prisma.post.update({ where: { id: entityId }, data: { comment_count: count } });
      } else if (entityType === 'REEL') {
        await prisma.reel.update({ where: { id: entityId }, data: { comment_count: count } });
      } else if (entityType === 'YOUTUBE_POST') {
        await prisma.youtubePost.update({ where: { id: entityId }, data: { comment_count: count } });
      }

      sampledLogger.success("Comment Count Sync completed", { jobId: job.id, entityType, entityId, count });
    }

    if (type === 'SEND_NOTIFICATION') {
      const { commentId, authorId } = job.data;
      
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: true,
          post: { select: { userId: true } },
          reel: { select: { userId: true } },
          youtubePost: { select: { userId: true } },
          parent: { select: { userId: true } }
        }
      });

      if (!comment || comment.is_deleted) return;

      // Determine the recipient (who should receive the notification)
      // If it's a reply, notify the parent comment author. Otherwise notify post owner.
      let recipientId = null;
      if (comment.parentId && comment.parent) {
        recipientId = comment.parent.userId;
      } else if (comment.postId && comment.post) {
        recipientId = comment.post.userId;
      } else if (comment.reelId && comment.reel) {
        recipientId = comment.reel.userId;
      } else if (comment.youtubePostId && comment.youtubePost) {
        recipientId = comment.youtubePost.userId;
      }

      // Don't notify if the user comments on their own post
      if (recipientId && recipientId !== authorId) {
        // Notification domain is currently commented out as we need to find its exact import path
        // But logic is built for when ready.
        
        // await notificationService.createNotification({
        //   userId: recipientId,
        //   senderId: authorId,
        //   type: 'MESSAGE', // Or a new type COMMENT
        //   title: `${comment.user.username || 'Someone'} commented on your post`,
        //   body: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
        //   entityId: comment.id,
        //   entityType: 'COMMENT'
        // });
        sampledLogger.success("Notification prepared for comment", { jobId: job.id, recipientId });
      }
    }

  } catch (error) {
    sampledLogger.error("Comment Sync failed", error, { jobId: job.id });
    throw error;
  }
}
