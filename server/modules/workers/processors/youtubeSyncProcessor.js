import { validateYouTubePayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { persistYouTubeContent } from "../../youtube-creator/services/youtubeSyncService.js";

/**
 * 📺 YOUTUBE SYNC PROCESSOR
 *
 * Consumes jobs from the `youtube-sync` queue.
 * Decoupled from BullMQ — this is pure business logic.
 *
 * Flow:
 *  1. Validate payload (fail fast)
 *  2. Iterate over channels and persist each one
 *  3. On per-channel failure → fail entire job (triggers BullMQ retry)
 */
export default async function youtubeSyncProcessor(job) {
  const { userId, channels, triggerReason } = job.data;

  // ── STEP 1: Fail fast on bad payloads ─────────────────────────────────────
  validateYouTubePayload(job.data);

  sampledLogger.success("YT Sync started", {
    jobId: job.id,
    userId,
    channelCount: channels.length,
    triggerReason,
  });

  let processedCount = 0;

  for (const channel of channels) {
    try {
      await persistYouTubeContent(userId, channel);
      processedCount++;
      await job.updateProgress(Math.round((processedCount / channels.length) * 100));
    } catch (error) {
      sampledLogger.error(
        "YT Sync channel failed",
        error,
        { jobId: job.id, userId, channelId: channel.channelId ?? "unknown" }
      );
      // Throw so BullMQ triggers retry for the whole job
      throw new Error(`Channel sync failed: ${error.message}`);
    }
  }

  sampledLogger.success("YT Sync completed", {
    jobId: job.id,
    userId,
    processed: processedCount,
    total: channels.length,
  });
}
