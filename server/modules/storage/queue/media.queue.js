import { Queue } from "bullmq";
import Redis from "ioredis";
import logger from "../../../utils/logger.js";

/**
 * 📦 MEDIA PROCESSING QUEUE
 */

const getRedisConnection = () => {
  let redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  if (!redisUrl) {
    logger.warn("[Media-Queue] REDIS_URL not set — functionality disabled.");
    return null;
  }

  if (redisUrl.startsWith("https://") && redisToken) {
    const host = redisUrl.replace("https://", "");
    redisUrl = `rediss://default:${redisToken}@${host}:6379`;
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    connectTimeout: 10000,
  });
};

const connection = getRedisConnection();

export const mediaQueue = connection ? new Queue("media-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  }
}) : null;

if (connection) {
  logger.info("[Media-Queue] BullMQ Initialized ✅");
}

export default mediaQueue;
