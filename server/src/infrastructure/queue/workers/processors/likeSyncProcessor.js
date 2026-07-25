import pLimit from "p-limit";
import logger from "../../../monitoring/logger.js";
import redisProxy from "../../../cache/redis.client.js";
import prisma from "../../../database/postgres.js";

/**
 * 🔄 LIKE SYNC PROCESSOR
 *
 * Consumes jobs from the `like-sync` queue.
 *
 * Uses Delta Model (Hash + Counter) instead of replacing the full user set.
 * Incremental changes are flushed to Postgres, and Redis cache keys are deleted
 * (or updated) immediately after.
 */
export default async function likeSyncProcessor(job) {
  const dirtyKey = `feed:likes:dirty`;
  const batchSize = Number(process.env.LIKE_BATCH_SIZE || 500);
  const dbConcurrency = Number(process.env.LIKE_SYNC_DB_CONCURRENCY || 10);
  const alertThreshold = Number(process.env.LIKE_SYNC_ALERT_THRESHOLD || 5000);

  try {
    // 1. Get oldest dirty keys up to batch size
    if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
      logger.debug(`[TRACE:LIKE-WORKER] Running Redis command: ZRANGE ${dirtyKey} 0 ${batchSize - 1}`);
    }
    const dirtyItems = await redisProxy.zrange(dirtyKey, 0, batchSize - 1);

    if (!dirtyItems || dirtyItems.length === 0) {
      return; // Nothing to sync
    }

    if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
      logger.debug(`[TRACE:LIKE-WORKER] Running Redis command: ZCARD ${dirtyKey}`);
    }
    const totalDirtyInitial = await redisProxy.zcard(dirtyKey);

    logger.info(`⚙️  [WORKER] LikeSyncProcessor started | Job ID: ${job.id}`);
    logger.info(`📊 [WORKER] Queue Status: Processing ${dirtyItems.length} items | Total in queue: ${totalDirtyInitial}`);

    if (totalDirtyInitial >= alertThreshold) {
      logger.warn(`🚨 [WORKER] Dirty queue backlog (${totalDirtyInitial}) exceeds alert threshold (${alertThreshold}) — sync is falling behind write volume.`);
    }

    // 2. Pipeline Read: Get deltas for all dirty items in one go
    if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
      logger.debug(`[TRACE:LIKE-WORKER] Running Redis Pipeline: HGETALL on ${dirtyItems.length} items`);
    }
    const pipeline = redisProxy.pipeline();
    for (const item of dirtyItems) {
      const [type, id] = item.split(":");
      pipeline.hgetall(`feed:likes:delta:${type}:${id}`);
    }

    const pipelineResults = await pipeline.exec();

    let totalDbAdds = 0;
    let totalDbRemoves = 0;
    let processedCount = 0;
    const successfullyProcessedItems = [];

    // 3. Process each dirty item with bounded concurrency
    const limit = pLimit(dbConcurrency);

    const results = await Promise.allSettled(
      dirtyItems.map((item, i) =>
        limit(async () => {
          const [type, id] = item.split(":");
          const deltaRes = pipelineResults[i];

          // If there was a redis error fetching this specific item, skip it
          if (deltaRes[0]) {
            return { item, status: "skip-error" };
          }

          const deltaHash = deltaRes[1] || {};
          const userIds = Object.keys(deltaHash);

          if (userIds.length === 0) {
            // Delta is empty, nothing to sync. Clean up keys and drop from dirty queue.
            const cleanPipeline = redisProxy.pipeline();
            cleanPipeline.del(`feed:likes:delta:${type}:${id}`);
            cleanPipeline.del(`feed:likes:count:${type}:${id}`);
            await cleanPipeline.exec();
            return { item, status: "drop-empty" };
          }

          const toAdd = [];
          const toRemove = [];

          for (const uid of userIds) {
            if (deltaHash[uid] === "1") {
              toAdd.push(uid);
            } else if (deltaHash[uid] === "0") {
              toRemove.push(uid);
            }
          }

          let parentIdField;
          if (type === "POST") { parentIdField = "postId"; }
          else if (type === "REEL") { parentIdField = "reelId"; }
          else if (type === "YOUTUBE_POST") { parentIdField = "youtubePostId"; }
          else if (type === "POLL") { parentIdField = "pollId"; }
          else {
            // Unknown type, just mark for removal from dirty queue
            return { item, status: "drop-unknown-type" };
          }

          let adds = 0, removes = 0;
          let finalCount = 0;

          await prisma.$transaction(async (tx) => {
            // Get model references bound to the transaction
            let TxLikeModel, TxContentModel;
            if (type === "POST") { TxLikeModel = tx.postLike; TxContentModel = tx.post; }
            else if (type === "REEL") { TxLikeModel = tx.reelLike; TxContentModel = tx.reel; }
            else if (type === "YOUTUBE_POST") { TxLikeModel = tx.youtubePostLike; TxContentModel = tx.youtubePost; }
            else if (type === "POLL") { TxLikeModel = tx.pollLike; TxContentModel = tx.poll; }

            // 1. Fetch current database count for the post
            const dbContent = await TxContentModel.findUnique({
              where: { id },
              select: { like_count: true },
            });
            const currentDbCount = dbContent ? dbContent.like_count : 0;

            // 2. Perform DB writes
            let insertedCount = 0;
            let deletedCount = 0;

            if (toAdd.length > 0) {
              const res = await TxLikeModel.createMany({
                data: toAdd.map(userId => ({ userId, [parentIdField]: id })),
                skipDuplicates: true,
              });
              insertedCount = res.count;
            }

            if (toRemove.length > 0) {
              const res = await TxLikeModel.deleteMany({
                where: { [parentIdField]: id, userId: { in: toRemove } },
              });
              deletedCount = res.count;
            }

            // 3. Compute final count and update DB
            finalCount = Math.max(0, currentDbCount + insertedCount - deletedCount);
            await TxContentModel.update({
              where: { id },
              data: { like_count: finalCount },
            });

            adds = insertedCount;
            removes = deletedCount;
            
            if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
              logger.debug(`[TRACE:LIKE-WORKER] Postgres Transaction Complete: ${item}. Inserted: ${insertedCount}, Deleted: ${deletedCount}, Final Count: ${finalCount}`);
            }
          });

          totalDbAdds += adds;
          totalDbRemoves += removes;

          // 4. Safe Redis Cleanup: Delete delta, keep count warmed with fresh TTL
          if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
            logger.debug(`[TRACE:LIKE-WORKER] Running Redis Pipeline: DEL feed:likes:delta:${type}:${id} & SET feed:likes:count:${type}:${id} EX 86400`);
          }
          const cleanPipeline = redisProxy.pipeline();
          cleanPipeline.del(`feed:likes:delta:${type}:${id}`);
          cleanPipeline.set(`feed:likes:count:${type}:${id}`, finalCount, "EX", 86400); // warm count for 24h
          await cleanPipeline.exec();

          return { item, status: "synced" };
        })
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        if (r.value.status !== "skip-error") {
          successfullyProcessedItems.push(r.value.item);
        }
        if (r.value.status === "synced") {
          processedCount++;
        }
      } else if (r.status === "rejected") {
        logger.error(`❌ [WORKER] Item sync failed, leaving dirty for retry: ${r.reason?.message}`);
      }
    }

    // 5. Commit ZREM: Remove successfully processed items from the dirty queue
    if (successfullyProcessedItems.length > 0) {
      if (process.env.LIKE_SYNC_VERBOSE_LOGS === 'true') {
        logger.debug(`[TRACE:LIKE-WORKER] Running Redis command: ZREM ${dirtyKey} for ${successfullyProcessedItems.length} items`);
      }
      await redisProxy.zrem(dirtyKey, ...successfullyProcessedItems);
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