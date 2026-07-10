import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";

// Local cache fallback when Redis is offline
export const memoryLikes = new Map(); // postId -> Set of userIds
export const memoryDirty = new Set(); // Set of dirty postIds

export const pollMemoryLikes = new Map(); // pollId -> Set of userIds
export const pollMemoryDirty = new Set(); // Set of dirty pollIds

export const syncLikesToPostgres = async () => {
  try {
    // ── POSTS LIKES SYNC ──
    let dirtyPostIds = [];
    if (redisAvailable) {
      dirtyPostIds = await redis.smembers("posts:dirty_likes");
    } else {
      dirtyPostIds = Array.from(memoryDirty);
    }

    if (dirtyPostIds.length > 0) {
      logger.info(`🔄 [SCHEDULER] Syncing deferred likes for ${dirtyPostIds.length} posts to Postgres...`);
      for (const postId of dirtyPostIds) {
        let likesCount = 0;
        let userLikes = [];

        if (redisAvailable) {
          const countStr = await redis.hget(`post:likes:count`, postId);
          likesCount = Math.max(0, parseInt(countStr || "0", 10));
          userLikes = await redis.smembers(`post:likes:users:${postId}`);
        } else {
          const userSet = memoryLikes.get(postId) || new Set();
          likesCount = userSet.size;
          userLikes = Array.from(userSet);
        }

        await prisma.post.update({
          where: { id: postId },
          data: { like_count: likesCount }
        });

        await prisma.postLike.deleteMany({
          where: {
            postId,
            userId: { notIn: userLikes }
          }
        });

        for (const userId of userLikes) {
          await prisma.postLike.upsert({
            where: { postId_userId: { postId, userId } },
            create: { postId, userId },
            update: {}
          });
        }

        if (redisAvailable) {
          await redis.srem("posts:dirty_likes", postId);
        } else {
          memoryDirty.delete(postId);
        }
      }
    }

    // ── POLLS LIKES SYNC ──
    let dirtyPollIds = [];
    if (redisAvailable) {
      dirtyPollIds = await redis.smembers("polls:dirty_likes");
    } else {
      dirtyPollIds = Array.from(pollMemoryDirty);
    }

    if (dirtyPollIds.length > 0) {
      logger.info(`🔄 [SCHEDULER] Syncing deferred likes for ${dirtyPollIds.length} polls to Postgres...`);
      for (const pollId of dirtyPollIds) {
        let likesCount = 0;
        let userLikes = [];

        if (redisAvailable) {
          const countStr = await redis.hget(`poll:likes:count`, pollId);
          likesCount = Math.max(0, parseInt(countStr || "0", 10));
          userLikes = await redis.smembers(`poll:likes:users:${pollId}`);
        } else {
          const userSet = pollMemoryLikes.get(pollId) || new Set();
          likesCount = userSet.size;
          userLikes = Array.from(userSet);
        }

        await prisma.poll.update({
          where: { id: pollId },
          data: { like_count: likesCount }
        });

        await prisma.pollLike.deleteMany({
          where: {
            pollId,
            userId: { notIn: userLikes }
          }
        });

        for (const userId of userLikes) {
          await prisma.pollLike.upsert({
            where: { pollId_userId: { pollId, userId } },
            create: { pollId, userId },
            update: {}
          });
        }

        if (redisAvailable) {
          await redis.srem("polls:dirty_likes", pollId);
        } else {
          pollMemoryDirty.delete(pollId);
        }
      }
    }

  } catch (error) {
    logger.error(`❌ [SCHEDULER] Deferred likes sync failed: ${error.message}`);
  }
};
