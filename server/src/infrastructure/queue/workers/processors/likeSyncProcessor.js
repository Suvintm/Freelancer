import logger from "../../../monitoring/logger.js";
import redisProxy from "../../../cache/redis.client.js";
import prisma from "../../../database/postgres.js";

/**
 * 🔄 LIKE SYNC PROCESSOR
 *
 * Consumes jobs from the `like-sync` queue.
 */
export default async function likeSyncProcessor(job) {
  try {
    const dirtyKey = `feed:likes:dirty`;
    const batchSize = Number(process.env.LIKE_BATCH_SIZE || 500);
    
    // 1. Get oldest dirty keys up to batch size
    const dirtyItems = await redisProxy.zrange(dirtyKey, 0, batchSize - 1);
    const totalDirtyInitial = await redisProxy.zcard(dirtyKey);

    if (!dirtyItems || dirtyItems.length === 0) {
      return; // Nothing to sync
    }

    logger.info(`⚙️  [WORKER] LikeSyncProcessor started | Job ID: ${job.id}`);
    logger.info(`📊 [WORKER] Queue Status: Processing ${dirtyItems.length} items | Total in queue: ${totalDirtyInitial}`);

    // 2. Pipeline Read: Get all sets (SMEMBERS) and counts (GET) in one go
    const pipeline = redisProxy.pipeline();
    for (const item of dirtyItems) {
      const [type, id] = item.split(":");
      pipeline.smembers(`feed:likes:users:${type}:${id}`);
      pipeline.get(`feed:likes:count:${type}:${id}`);
    }
    
    const pipelineResults = await pipeline.exec();
    
    let processedCount = 0;
    let totalDbAdds = 0;
    let totalDbRemoves = 0;
    const successfullyProcessedItems = [];

    // Parse pipeline results
    for (let i = 0; i < dirtyItems.length; i++) {
      const item = dirtyItems[i];
      const [type, id] = item.split(":");
      
      const setIdx = i * 2;
      const countIdx = i * 2 + 1;
      
      const setRes = pipelineResults[setIdx];
      const countRes = pipelineResults[countIdx];
      
      // If there was a redis error fetching this specific item, skip it
      if (setRes[0] || countRes[0]) {
        continue;
      }
      
      // Safety Circuit Breaker:
      // If the count is missing from Redis entirely (expired/evicted), DO NOT sync.
      // Syncing now would assume 0 likes and wipe Postgres. We drop it from the dirty queue.
      if (countRes[1] === null) {
        logger.warn(`⚠️ [WORKER] Cache expired for ${type}:${id} before sync! Skipping to prevent Postgres data wipe.`);
        successfullyProcessedItems.push(item);
        continue;
      }
      
      const likedUserIds = setRes[1] || [];
      const likeCount = parseInt(countRes[1], 10);

      let LikeModel;
      let ContentModel;
      let parentIdField;
      
      if (type === "POST") { LikeModel = prisma.postLike; ContentModel = prisma.post; parentIdField = "postId"; }
      else if (type === "REEL") { LikeModel = prisma.reelLike; ContentModel = prisma.reel; parentIdField = "reelId"; }
      else if (type === "YOUTUBE_POST") { LikeModel = prisma.youtubePostLike; ContentModel = prisma.youtubePost; parentIdField = "youtubePostId"; }
      else if (type === "POLL") { LikeModel = prisma.pollLike; ContentModel = prisma.poll; parentIdField = "pollId"; }
      else {
        // Unknown type, just mark for removal
        successfullyProcessedItems.push(item);
        continue;
      }

      // 3. Sync to Postgres
      await prisma.$transaction(async (tx) => {
        // Fetch current users in DB
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
          totalDbAdds += toAdd.length;
        }

        if (toRemove.length > 0) {
          await LikeModel.deleteMany({
            where: {
              [parentIdField]: id,
              userId: { in: toRemove }
            }
          });
          totalDbRemoves += toRemove.length;
        }

        // Sync absolute count to the parent model (Idempotent)
        await ContentModel.update({
          where: { id },
          data: { like_count: likeCount }
        });
      });

      // Track successful commits
      successfullyProcessedItems.push(item);
      processedCount++;
    }

    // 4. Safe Commit: Remove from dirty queue only if Postgres transaction succeeded
    if (successfullyProcessedItems.length > 0) {
      const zremPipeline = redisProxy.pipeline();
      for (const item of successfullyProcessedItems) {
        zremPipeline.zrem(dirtyKey, item);
      }
      await zremPipeline.exec();
    }

    if (processedCount > 0) {
      const remainingDirty = await redisProxy.zcard(dirtyKey);
      logger.info(`💾 [WORKER] Postgres Sync complete: +${totalDbAdds} additions, -${totalDbRemoves} removals`);
      logger.info(`✅ [WORKER] LikeSyncProcessor finished! Items fully synced: ${processedCount} | Remaining in queue: ${remainingDirty}`);
    }
  } catch (error) {
    logger.error(`❌ [WORKER] Like Sync failed for Job ID ${job.id}: ${error.message}`);
    throw error;
  }
}
