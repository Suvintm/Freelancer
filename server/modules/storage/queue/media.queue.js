/**
 * 📦 MEDIA QUEUE DEFINITION
 *
 * Defines the BullMQ queue for async media processing.
 * All uploads land here — the API responds instantly, processing happens in background.
 *
 * Queue Name: "media-processing"
 *
 * TODO (Phase 2): Initialize and export queue using existing BullMQ/Redis setup.
 */

// import { Queue } from "bullmq";
// import { redis } from "../../config/redisClient.js";
//
// export const mediaQueue = new Queue("media-processing", {
//   connection: redis,
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: { type: "exponential", delay: 5000 },
//     removeOnComplete: true,
//     removeOnFail: 100,
//   },
// });

export const QUEUE_NAME = "media-processing";
export default {};
