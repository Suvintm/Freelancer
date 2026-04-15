/**
 * ⚙️ MEDIA WORKER
 *
 * BullMQ worker that picks up jobs from the "media-processing" queue.
 * Orchestrates the full processing pipeline per job type.
 *
 * Flow:
 *   Job received → safety checks → dedup check → image/video processor → CDN upload → DB update → socket notify
 *
 * TODO (Phase 2 / Phase 3): Implement full pipeline.
 */

// import { Worker } from "bullmq";
// import { QUEUE_NAME } from "./media.queue.js";
// import { processImage } from "../processors/image.processor.js";
// import { processVideo } from "../processors/video.processor.js";
// import { runSafetyChecks } from "../processors/safety.processor.js";
// import { hashFile, findDuplicate } from "../processors/dedup.processor.js";

// export const startMediaWorker = () => {
//   const worker = new Worker(QUEUE_NAME, async (job) => {
//     const { type, userId, mediaId, rawKey } = job.data;
//
//     // Step 1: Safety
//     // Step 2: Dedup
//     // Step 3: Process (image or video)
//     // Step 4: Upload processed to S3/R2
//     // Step 5: Update DB (status: ready)
//     // Step 6: Emit socket event (media:ready)
//   }, { connection: redis });
//
//   return worker;
// };

export default {};
