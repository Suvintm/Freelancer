import { validateYouTubePayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { persistYouTubeContent } from "../../youtube-creator/services/youtubeSyncService.js";
import quotaManager from "../../youtube-creator/services/youtubeQuotaManager.js";

/**
 * 📺 YOUTUBE SYNC PROCESSOR
 *
 * Consumes jobs from the `youtube-sync` queue.
 * Decoupled from BullMQ — this is pure business logic.
 *
 * Flow:
 *  1. Check Quota (Fail fast if exhausted)
 *  2. Validate payload
 *  3. Iterate over channels and persist each one
 *  4. On per-channel failure → fail entire job (triggers BullMQ retry)
 */
export default async function youtubeSyncProcessor(job) {
  // ── SPECIAL CASE: Quota Maintenance ───────────────────────────────────────
  if (job.name === "quota-maintenance") {
    await quotaManager.checkAndReset();
    sampledLogger.success("Daily Quota Reset completed via Heartbeat", { jobId: job.id });
    return;
  }

  const { userId, channels, triggerReason } = job.data;

  // ── STEP 0: Check Quota Availability ──────────────────────────────────────
  const quota = await quotaManager.getStatus();
  if (quota && quota.remaining_units < 5) {
    sampledLogger.warn("YT Sync skipped/delayed (Quota Exhausted)", { userId, remaining: quota.remaining_units });
    throw new Error("YouTube API quota exhausted. Retrying later via BullMQ backoff.");
  }

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
      await persistYouTubeContent(userId, channel, triggerReason);
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
