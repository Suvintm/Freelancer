import { sampledLogger } from "../sampledLogger.js";
import { persistInstagramContent } from "../../../../domains/creator/services/instagramSyncService.js";
import { instagramApiService } from "../../../../domains/creator/services/instagramApiService.js";
import { emitToUser } from "../../../../platform/socket/socket.gateway.js";
import prisma from "../../../../infrastructure/database/postgres.js";
import logger from "../../../../infrastructure/monitoring/logger.js";

/**
 * 📸 INSTAGRAM SYNC PROCESSOR
 *
 * Consumes jobs from the `instagram-sync` BullMQ queue.
 * Emits clean progress at exactly 50%, 75%, and 100% to the frontend.
 */
export default async function instagramSyncProcessor(job) {
  const { userId, accounts, triggerReason } = job.data;
  const accountsToSync = accounts || [];

  if (!userId) {
    throw new Error("[INSTA-PROCESSOR] Missing userId in job payload");
  }

  sampledLogger.success("Instagram Sync started", {
    jobId: job.id,
    userId,
    accountCount: accountsToSync.length,
    triggerReason,
  });

  // Get user's saved Instagram profile to check for access token if available
  const igProfile = await prisma.instagramProfile.findUnique({
    where: { userId },
  });

  const totalAccounts = accountsToSync.length > 0 ? accountsToSync.length : 1;

  for (let i = 0; i < totalAccounts; i++) {
    const rawAccount = accountsToSync[i] || {};
    let handle = rawAccount.handle || rawAccount.username || "instagram";

    // Progress Helper: Emits Socket.io progress strictly at 50%, 75%, and 100%
    const emitProgress = (progressPercent, step, message) => {
      emitToUser(userId, "notification:new", {
        type: "SYNC_PROGRESS",
        metadata: {
          userId,
          progress: progressPercent,
          channelId: rawAccount.accountId || rawAccount.id || handle,
          channelName: `@${handle}`,
          step,
          message,
          platform: "instagram",
        },
      });
    };

    try {
      let accountPayload = rawAccount;

      // ── STAGE 1: 50% Progress - Fetch fresh metadata from API if token exists
      emitProgress(50, "metadata", "Fetching Instagram profile & metadata...");
      await job.updateProgress(50);

      const token = igProfile?.access_token || rawAccount.accessToken;
      if (token) {
        try {
          const freshData = await instagramApiService.fetchCreatorProfile(token);
          accountPayload = { ...rawAccount, ...freshData };
          handle = freshData.handle || handle;
        } catch (apiErr) {
          logger.warn(`[INSTA-PROCESSOR] Fresh API fetch failed, using seeded payload: ${apiErr.message}`);
        }
      }

      // ── STAGE 2: 75% Progress - Mirror latest post & reel thumbnails to S3
      emitProgress(75, "mirroring", "Mirroring latest post & reel thumbnails to S3...");
      await job.updateProgress(75);

      // Persist account and mirror media to S3
      await persistInstagramContent(userId, accountPayload, triggerReason);

      // ── STAGE 3: 100% Progress - Complete
      await job.updateProgress(100);
      emitProgress(100, "complete", `Completed sync for @${handle}!`);

      logger.info(`✅ [INSTA-PROCESSOR] Completed Instagram sync for @${handle}`);
    } catch (err) {
      logger.error(`❌ [INSTA-PROCESSOR] Failed to sync account @${handle}: ${err.message}`);
      throw err;
    }
  }

  return { success: true, count: totalAccounts };
}
