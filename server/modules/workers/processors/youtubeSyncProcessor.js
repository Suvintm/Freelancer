import { validateYouTubePayload } from "../jobValidator.js";
import { sampledLogger } from "../sampledLogger.js";
import { persistYouTubeContent } from "../../youtube-creator/services/youtubeSyncService.js";
import { getIO } from "../../../src/infrastructure/websocket/socket.js";
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
  const totalChannels = channelsToSync.length;

  for (let i = 0; i < totalChannels; i++) {
    const channelId = channelsToSync[i];
    let channelName = "YouTube Channel";

    const emitProgress = (stepPercent, step, message) => {
      const io = getIO();
      if (io) {
        const baseProgress = Math.round((i / totalChannels) * 100);
        const stepContribution = Math.round((stepPercent / 100) * (100 / totalChannels));
        const progress = Math.min(baseProgress + stepContribution, 99);
        io.to(userId).emit("notification:new", {
          type: "SYNC_PROGRESS",
          metadata: {
            userId,
            progress,
            channelId,
            channelName,
            step,
            message
          }
        });
      }
    };

    try {
      // Step 1: Connecting
      emitProgress(10, 'connection', 'Connecting to YouTube API...');

      // 1. Fetch Fresh Public Metadata (1 Unit)
      const channelMetadata = await youtubeApiService.getChannelPublicData({
        identifier: channelId,
        type: 'id'
      });
      channelName = channelMetadata.title || channelName;

      // Step 2: Metadata fetched
      emitProgress(45, 'metadata', 'Fetching channel profile & stats...');

      // 2. Fetch Latest 50 Videos from Uploads Playlist (1 Unit)
      if (channelMetadata.uploadsPlaylistId) {
        channelMetadata.videos = await youtubeApiService.getPlaylistVideos(channelMetadata.uploadsPlaylistId, 50);
      }

      // Step 3: Videos fetched
      emitProgress(75, 'videos', 'Syncing video library (up to 50 videos)...');

      // 3. Persist and Mirror to S3
      await persistYouTubeContent(userId, channelMetadata, triggerReason);
      
      // Step 4: Finalizing channel sync
      emitProgress(95, 'finalize', 'Saving analytics & generating dashboard...');

      processedCount++;
      const progress = Math.round((processedCount / totalChannels) * 100);
      await job.updateProgress(progress);

      // 📡 Emit final channel progress via Socket.io
      const io = getIO();
      if (io) {
        io.to(userId).emit("notification:new", {
          type: "SYNC_PROGRESS",
          metadata: {
            userId,
            progress,
            channelId,
            channelName,
            step: 'complete',
            message: `Completed sync for ${channelName}!`
          }
        });
      }
    } catch (error) {
      sampledLogger.error(
        "YT Sync channel failed",
        error,
        { jobId: job.id, userId, channelId: channelId || "unknown" }
      );
      // 📡 Emit real-time failure via Socket.io
      const io = getIO();
      if (io) {
        io.to(userId).emit("notification:new", {
          type: "SYNC_FAILED",
          metadata: {
            userId,
            channelId,
            channelName,
            message: `Failed to sync channel: ${error.message}`
          }
        });
      }
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
