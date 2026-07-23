import pLimit from "p-limit";
import logger from "../../../monitoring/logger.js";
import redisProxy from "../../../cache/redis.client.js";
import prisma from "../../../database/postgres.js";

/**
 * 🔄 LIKE SYNC PROCESSOR
 *
 * Consumes jobs from the `like-sync` queue.
 *
 * Redis commands per tick ≈ 1 (ZRANGE) + [ZCARD, only if items found]
 *                            + 2D (pipelined SMEMBERS + GET for D dirty items)
 *                            + 1 (single variadic ZREM, not D separate ZREMs)
 *
 * Postgres transactions per tick: up to D, run with bounded concurrency
 * (LIKE_SYNC_DB_CONCURRENCY) instead of one-at-a-time sequential awaits.
 */
export default async function likeSyncProcessor(job) {
  const dirtyKey = `feed:likes:dirty`;
  const batchSize = Number(process.env.LIKE_BATCH_SIZE || 500);
  const dbConcurrency = Number(process.env.LIKE_SYNC_DB_CONCURRENCY || 10);
  const alertThreshold = Number(process.env.LIKE_SYNC_ALERT_THRESHOLD || 5000);

  try {
    // 1. Get oldest dirty keys up to batch size
    const dirtyItems = await redisProxy.zrange(dirtyKey, 0, batchSize - 1);

    if (!dirtyItems || dirtyItems.length === 0) {
      return; // Nothing to sync — no further Redis commands spent
    }

    // ZCARD only runs when there's actually something to log/act on
    const totalDirtyInitial = await redisProxy.zcard(dirtyKey);

    logger.info(`⚙️  [WORKER] LikeSyncProcessor started | Job ID: ${job.id}`);
    logger.info(`📊 [WORKER] Queue Status: Processing ${dirtyItems.length} items | Total in queue: ${totalDirtyInitial}`);

    if (totalDirtyInitial >= alertThreshold) {
      logger.warn(`🚨 [WORKER] Dirty queue backlog (${totalDirtyInitial}) exceeds alert threshold (${alertThreshold}) — sync is falling behind write volume.`);
    }

    // 2. Pipeline Read: Get all sets (SMEMBERS) and counts (GET) in one go
    const pipeline = redisProxy.pipeline();
    for (const item of dirtyItems) {
      const [type, id] = item.split(":");
      pipeline.smembers(`feed:likes:users:${type}:${id}`);
      pipeline.get(`feed:likes:count:${type}:${id}`);
    }

    const pipelineResults = await pipeline.exec();

    let totalDbAdds = 0;
    let totalDbRemoves = 0;
    let processedCount = 0;
    const successfullyProcessedItems = [];

    // 3. Process each dirty item with bounded concurrency instead of a
    //    fully sequential for-loop — this is the main latency win.
    const limit = pLimit(dbConcurrency);

    const results = await Promise.allSettled(
      dirtyItems.map((item, i) =>
        limit(async () => {
          const [type, id] = item.split(":");
          const setIdx = i * 2;
          const countIdx = i * 2 + 1;

          const setRes = pipelineResults[setIdx];
          const countRes = pipelineResults[countIdx];

          // If there was a redis error fetching this specific item, skip it
          // (leave it dirty — it'll be retried next tick)
          if (setRes[0] || countRes[0]) {
            return { item, status: "skip-error" };
          }

          // Safety Circuit Breaker:
          // If the count is missing from Redis entirely (expired/evicted), DO NOT sync.
          // Syncing now would assume 0 likes and wipe Postgres. Drop it from the dirty queue.
          if (countRes[1] === null) {
            logger.warn(`⚠️ [WORKER] Cache expired for ${type}:${id} before sync! Skipping to prevent Postgres data wipe.`);
            return { item, status: "drop-expired" };
          }

          const likedUserIds = setRes[1] || [];
          const likeCount = parseInt(countRes[1], 10);

          let LikeModel, ContentModel, parentIdField;
          if (type === "POST") { LikeModel = prisma.postLike; ContentModel = prisma.post; parentIdField = "postId"; }
          else if (type === "REEL") { LikeModel = prisma.reelLike; ContentModel = prisma.reel; parentIdField = "reelId"; }
          else if (type === "YOUTUBE_POST") { LikeModel = prisma.youtubePostLike; ContentModel = prisma.youtubePost; parentIdField = "youtubePostId"; }
          else if (type === "POLL") { LikeModel = prisma.pollLike; ContentModel = prisma.poll; parentIdField = "pollId"; }
          else {
            // Unknown type, just mark for removal from dirty queue
            return { item, status: "drop-unknown-type" };
          }

          let adds = 0, removes = 0;

          await prisma.$transaction(async (tx) => {
            const dbLikes = await LikeModel.findMany({
              where: { [parentIdField]: id },
              select: { userId: true },
            });
            const dbUserIds = new Set(dbLikes.map(l => l.userId));
            const redisUserSet = new Set(likedUserIds);

            const toAdd = likedUserIds.filter(uid => !dbUserIds.has(uid));
            const toRemove = [...dbUserIds].filter(uid => !redisUserSet.has(uid));

            if (toAdd.length > 0) {
              await LikeModel.createMany({
                data: toAdd.map(userId => ({ userId, [parentIdField]: id })),
                skipDuplicates: true,
              });
              adds = toAdd.length;
            }

            if (toRemove.length > 0) {
              await LikeModel.deleteMany({
                where: { [parentIdField]: id, userId: { in: toRemove } },
              });
              removes = toRemove.length;
            }

            await ContentModel.update({
              where: { id },
              data: { like_count: likeCount },
            });
          });

          totalDbAdds += adds;
          totalDbRemoves += removes;

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

    // 4. Safe Commit: Remove from dirty queue only for items we actually
    //    resolved (synced, dropped-expired, dropped-unknown). Failed items
    //    are left in the dirty set to be retried next tick.
    if (successfullyProcessedItems.length > 0) {
      // Single variadic ZREM instead of N pipelined ZREM calls
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