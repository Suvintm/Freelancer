import { Worker } from "bullmq";
import Redis from "ioredis";
import prisma from "../../../config/prisma.js";
import storage from "../storage.service.js";
import { processImage } from "../processors/image.processor.js";
import { processVideo } from "../processors/video.processor.js";
import { hashFile, findDuplicate } from "../processors/dedup.processor.js";
import logger from "../../../utils/logger.js";

/**
 * 🛠️ MEDIA WORKER (PRODUCTION ENGINE)
 * Handles both Image and Video processing asynchronously with DEDUPLICATION.
 */

const getRedisConnection = () => {
  let redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (redisUrl?.startsWith("https://") && redisToken) {
    const host = redisUrl.replace("https://", "");
    redisUrl = `rediss://default:${redisToken}@${host}:6379`;
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
  });
};

const connection = getRedisConnection();

export const mediaWorker = new Worker(
  "media-processing",
  async (job) => {
    const { mediaId, userId, key, type } = job.data;
    logger.info(`👷 [WORKER] Processing Media: ${mediaId} (${type})`);

    try {
      // 1. Fetch RAW file from S3
      const rawBuffer = await storage.getObject(key);
      let results = {};

      // 2. DEDUPLICATION CHECK (Production Feature)
      const hash = hashFile(rawBuffer);
      const duplicate = await findDuplicate(hash);

      if (duplicate) {
        logger.info(`♻️ [WORKER] Duplicate found for ${mediaId}. Reusing existing data.`);
        results = {
          variants: duplicate.variants,
          blurhash: duplicate.blurhash,
          width: duplicate.width,
          height: duplicate.height,
          duration: duplicate.duration,
          size: duplicate.size,
          hash: hash
        };
      } else {
        // 3. Process fresh content (with Metadata Extraction)
        if (type === "VIDEO") {
          results = await processVideo(rawBuffer, userId, mediaId);
        } else {
          results = await processImage(rawBuffer, userId, mediaId);
        }
        results.hash = hash;
      }

      // 4. Update Database
      await prisma.media.update({
        where: { id: mediaId },
        data: {
          ...results,
          status: "READY",
        },
      });

      logger.info(`✨ [WORKER] Media READY: ${mediaId}`);

    } catch (error) {
      logger.error(`❌ [WORKER] Job ${job.id} FAILED: ${error.message}`);
      
      await prisma.media.update({
        where: { id: mediaId },
        data: { status: "FAILED" },
      });

      throw error; 
    }
  },
  { connection, concurrency: 2 } 
);

mediaWorker.on("completed", (job) => {
  logger.info(`✅ [WORKER] Job ${job.id} completed successfully`);
});

mediaWorker.on("failed", (job, err) => {
  logger.error(`❌ [WORKER] Job ${job.id} failed: ${err.message}`);
});

export default mediaWorker;
