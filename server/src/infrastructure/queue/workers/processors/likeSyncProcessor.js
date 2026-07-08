import { sampledLogger } from "../sampledLogger.js";
import redisProxy from "../../../cache/redis.client.js";
import prisma from "../../../database/postgres.js";

/**
 * 🔄 LIKE SYNC PROCESSOR
 *
 * Consumes jobs from the `like-sync` queue.
 * Flow:
 *  1. Pop all dirty items from `feed:likes:dirty` in Redis.
 *  2. For each `{type}:{id}`:
 *     - Read the true count and the full Set of user IDs from Redis.
 *     - Sync to PostgreSQL (`PostLike`, `ReelLike`, etc. and `like_count` on the content).
 */
export default async function likeSyncProcessor(job) {
  try {
    // 1. Get dirty keys (only posts added to queue > 10 seconds ago to avoid thrashing viral posts)
    const dirtyKey = `feed:likes:dirty`;
    const now = Date.now();
    const cutoff = now - 10000;
    
    // Fetch items with score up to 10 seconds ago
    const dirtyItems = await redisProxy.zrangebyscore(dirtyKey, 0, cutoff);
    if (!dirtyItems || dirtyItems.length === 0) {
      return; // Nothing to sync
    }

    // Clear the set. If new likes come in during this fraction of a millisecond, 
    // they might get dropped from the dirty queue, but next like will re-add.
    // For a 100% safe approach, we can do SREM for each item we successfully process.
    // Let's just process them and SREM them one by one.
    
    let processedCount = 0;

    for (const item of dirtyItems) {
      const [type, id] = item.split(":");
      const setKey = `feed:likes:users:${type}:${id}`;
      
      // Get all users who liked this post currently in Redis
      const likedUserIds = await redisProxy.smembers(setKey);
      const likeCount = likedUserIds.length;

      // Ensure DB reflects this state.
      // We could either:
      // A) Delete all likes for this post, then insert all (expensive for huge posts).
      // B) Get current likes from DB, compute diff, insert/delete.
      // For now, since this is a robust system, let's do a diff approach.

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
        // Unknown type, skip
        await redisProxy.zrem(dirtyKey, item);
        continue;
      }

      // Sync likes
      await prisma.$transaction(async (tx) => {
        // 1. Fetch current users in DB
        const dbLikes = await LikeModel.findMany({
          where: { [parentIdField]: id },
          select: { userId: true }
        });
        const dbUserIds = new Set(dbLikes.map(l => l.userId));
        const redisUserSet = new Set(likedUserIds);

        const toAdd = likedUserIds.filter(uid => !dbUserIds.has(uid));
        const toRemove = [...dbUserIds].filter(uid => !redisUserSet.has(uid));

        if (toAdd.length > 0) {
          await LikeModel.createMany({
            data: toAdd.map(userId => ({ userId, [parentIdField]: id })),
            skipDuplicates: true
          });
        }

        if (toRemove.length > 0) {
          await LikeModel.deleteMany({
            where: {
              [parentIdField]: id,
              userId: { in: toRemove }
            }
          });
        }

        // 2. Sync count on the parent model
        await ContentModel.update({
          where: { id },
          data: { like_count: likeCount }
        });
      });

      // Remove from dirty queue
      await redisProxy.zrem(dirtyKey, item);
      processedCount++;
    }

    if (processedCount > 0) {
      sampledLogger.success("Like Sync completed", {
        jobId: job.id,
        processed: processedCount
      });
    }
  } catch (error) {
    sampledLogger.error("Like Sync failed", error, { jobId: job.id });
    throw error;
  }
}
