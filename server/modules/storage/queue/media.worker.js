import { Worker } from "bullmq";
import Redis from "ioredis";
import prisma from "../../../config/prisma.js";
import storage from "../storage.service.js";
import { processImage } from "../processors/image.processor.js";
import logger from "../../../utils/logger.js";

/**
 * 🛠️ MEDIA WORKER (PRODUCTION ENGINE)
 * Handles image compression and metadata generation in background.
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
    logger.info(`👷 [WORKER] Processing Job ${job.id} for Media: ${mediaId}`);

    try {
      // 1. Fetch RAW file from S3
      const rawBuffer = await storage.getObject(key);

      if (type === "IMAGE") {
        // 2. Process with Sharp (WebP variants + Blurhash)
        const { variants, blurhash } = await processImage(rawBuffer, userId, mediaId);

        // 3. Update Database
        await prisma.media.update({
          where: { id: mediaId },
          data: {
            variants,
            blurhash,
            status: "READY",
          },
        });

        logger.info(`✨ [WORKER] Media READY: ${mediaId}`);
      }

      // 4. CLEANUP (Optional): Delete the RAW upload to save space
      // await storage.deleteObjects(key);

    } catch (error) {
      logger.error(`❌ [WORKER] Job ${job.id} FAILED: ${error.message}`);
      
      await prisma.media.update({
        where: { id: mediaId },
        data: { status: "FAILED" },
      });

      throw error; // Let BullMQ handle retries
    }
  },
  { connection, concurrency: 5 } // Process 5 images at once
);

mediaWorker.on("completed", (job) => {
  logger.info(`✅ [WORKER] Job ${job.id} completed successfully`);
});

mediaWorker.on("failed", (job, err) => {
  logger.error(`❌ [WORKER] Job ${job.id} failed: ${err.message}`);
});

export default mediaWorker;
