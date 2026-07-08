import prisma from "../../../infrastructure/database/postgres.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";

// Local cache fallback when Redis is offline
export const memoryLikes = new Map(); // postId -> Set of userIds
export const memoryDirty = new Set(); // Set of dirty postIds

export const syncLikesToPostgres = async () => {
  try {
    let dirtyPostIds = [];

    if (redisAvailable) {
      dirtyPostIds = await redis.smembers("posts:dirty_likes");
    } else {
      dirtyPostIds = Array.from(memoryDirty);
    }

    if (dirtyPostIds.length === 0) return;

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

      // Update Post like count
      await prisma.post.update({
        where: { id: postId },
        data: { like_count: likesCount }
      });

      // Synchronize PostLike entries
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

    logger.info("✅ [SCHEDULER] Deferred likes sync completed.");
  } catch (error) {
    logger.error(`❌ [SCHEDULER] Deferred likes sync failed: ${error.message}`);
  }
};
