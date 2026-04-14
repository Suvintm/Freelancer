// server/utils/fcmService.js
import { getMessaging } from "firebase-admin/messaging";
import prisma from "../config/prisma.js";
import logger from "./logger.js";
import { initFirebaseAdmin } from "./firebaseAdmin.js";

/**
 * Send push notification to a specific user across all their registered devices.
 * 
 * @param {string} userId - Recipient user UUID
 * @param {object} fcmPayload - Flat notification data (title, body, metadata)
 */
export const sendPushNotification = async (userId, fcmPayload) => {
  try {
    const app = initFirebaseAdmin();
    if (!app) return;

    // Fetch user's active push tokens from PostgreSQL
    const tokens = await prisma.pushToken.findMany({
      where: { 
        userId,
        is_active: true
      },
      select: { token: true }
    });

    if (tokens.length === 0) {
      logger.debug(`[FCM] No active push tokens for user ${userId}. Skipping.`);
      return;
    }

    const messaging = getMessaging();

    // ── Sanitize: FCM data payload only accepts flat strings ─────────────────
    const sanitizedData = {};
    Object.entries(fcmPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        // We only want to send data fields that are strings
        if (typeof value === "object") {
            sanitizedData[key] = JSON.stringify(value);
        } else {
            sanitizedData[key] = String(value);
        }
      }
    });

    // ── FCM Message Configuration ───────────────────────────────────────────
    // Including both notification (for OS-level popup) and data (for in-app handling).
    const baseMessage = {
      notification: {
        title: fcmPayload.title || "SuviX",
        body: fcmPayload.body || "You have a new notification",
        ...(fcmPayload.imageUrl && { image: fcmPayload.imageUrl })
      },
      data: sanitizedData,
      android: {
        priority: "high",
        notification: {
          channelId: "suvix-default"
        }
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: "default",
          },
        },
      },
    };

    // ── Dispatch to all tokens ─────────────────────────────────────────────
    const sendPromises = tokens.map(({ token }) =>
      messaging.send({ ...baseMessage, token })
        .catch(async (err) => {
          // Automatic Cleanup of Invalid/Expired Tokens
          if (
            err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token'
          ) {
            await prisma.pushToken.delete({ where: { token } });
            logger.info(`🗑️ [FCM] Cleaned up stale token for user ${userId}`);
          } else {
            // Track the error in the DB for future diagnostics
            await prisma.pushToken.update({
              where: { token },
              data: { last_error: err.message, is_active: false }
            });
            logger.error(`❌ [FCM] Push failed for token: ${err.message}`);
          }
        })
    );

    await Promise.all(sendPromises);
    logger.info(`🚀 [FCM] Processed push for user ${userId}: "${fcmPayload.title}"`);

  } catch (error) {
    logger.error("[FCM] Internal Service Error:", error.message);
  }
};
