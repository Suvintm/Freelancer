import { validateYouTubePayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { persistYouTubeContent } from "../../youtube-creator/services/youtubeSyncService.js";
import { getIO } from "../../../socket.js";
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

  const { userId, channelIds, triggerReason } = job.data;
  const channelsToSync = channelIds || []; // Fallback for safety

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
    channelCount: channelsToSync.length,
    triggerReason,
  });

  const { default: youtubeApiService } = await import("../../youtube-creator/services/youtubeApiService.js");
  let processedCount = 0;

  for (const channelId of channelsToSync) {
    try {
      // 1. Fetch Fresh Public Metadata (1 Unit)
      const channelMetadata = await youtubeApiService.getChannelPublicData({
        identifier: channelId,
        type: 'id'
      });

      // 2. Fetch Latest 25 Videos from Uploads Playlist (1 Unit)
      if (channelMetadata.uploadsPlaylistId) {
        channelMetadata.videos = await youtubeApiService.getPlaylistVideos(channelMetadata.uploadsPlaylistId, 25);
      }

      // 3. Persist and Mirror to S3
      await persistYouTubeContent(userId, channelMetadata, triggerReason);
      
      processedCount++;
      const progress = Math.round((processedCount / channelsToSync.length) * 100);
      await job.updateProgress(progress);

      // 📡 Emit real-time progress via Socket.io
      const io = getIO();
      if (io) {
        io.to(userId).emit("notification:new", {
          type: "SYNC_PROGRESS",
          metadata: {
            userId,
            progress,
            channelId,
            message: `Syncing ${channelMetadata.title}...`
          }
        });
      }
    } catch (error) {
      sampledLogger.error(
        "YT Sync channel failed",
        error,
        { jobId: job.id, userId, channelId: channelId || "unknown" }
      );
      // Throw so BullMQ triggers retry for the whole job
      throw new Error(`Channel sync failed for ${channelId}: ${error.message}`);
    }
  }

  sampledLogger.success("YT Sync completed", {
    jobId: job.id,
    userId,
    processed: processedCount,
    total: channelsToSync.length,
  });
}
