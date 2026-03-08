// server/utils/fcmService.js
import { getMessaging } from "firebase-admin/messaging";
import User from "../models/User.js";
import logger from "./logger.js";
import { initFirebaseAdmin } from "./firebaseAdmin.js";

/**
 * Send push notification to a specific user
 * @param {string} userId - Recipient user ID
 * @param {object} fcmPayload - Flat notification data (all fields at top level)
 */
export const sendPushNotification = async (userId, fcmPayload) => {
  try {
    const app = initFirebaseAdmin();
    if (!app) return;

    const user = await User.findById(userId).select("fcmTokens");
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    const messaging = getMessaging();

    // ── Sanitize: FCM data payload only accepts flat strings ─────────────────
    const sanitizedData = {};
    Object.entries(fcmPayload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        sanitizedData[key] = String(value);
      }
    });

    // ── FCM Message ───────────────────────────────────────────────────────────
    // ✅ DATA-ONLY: No `notification` block anywhere. This is the ONLY way to guarantee:
    //    1. SW onBackgroundMessage fires on ALL platforms
    //    2. Mobile browsers respect custom grouping & stacking
    //    3. App-closed delivery works correctly
    const message = {
      data: sanitizedData,

      android: {
        priority: "high",
        // ✅ NO android.notification block — would bypass SW on Android
      },

      webpush: {
        headers: {
          Urgency: "high",
          TTL: "86400", // 24 hours — survive device sleep/offline
        },
        fcmOptions: {
          link: fcmPayload.link || "/notifications",
        },
        // ✅ NO webpush.notification block — would bypass SW
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            contentAvailable: true, // Wake iOS app in background
            sound: "default",
          },
        },
        // ✅ NO apns.alert block — keeps it data-only on iOS too
      },
    };

    // ── Send to all registered tokens ─────────────────────────────────────────
    const sendPromises = user.fcmTokens.map(token =>
      messaging.send({ ...message, token })
        .catch(async (err) => {
          // Clean up dead tokens automatically
          if (
            err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token'
          ) {
            await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
            logger.info(`Removed stale FCM token for user ${userId}`);
          } else {
            logger.error(`FCM send error for user ${userId} token ...${token.slice(-6)}: ${err.message}`);
          }
        })
    );

    await Promise.all(sendPromises);
    logger.info(`[FCM] Push sent to user ${userId} — "${fcmPayload.title}" (tag: ${fcmPayload.tag || 'none'}, order: ${fcmPayload.orderNumber || 'none'})`);

  } catch (error) {
    logger.error("[FCM] sendPushNotification failed:", error.message);
  }
};
