// server/utils/fcmService.js
import { getMessaging } from "firebase-admin/messaging";
import User from "../models/User.js";
import logger from "./logger.js";
import { initFirebaseAdmin } from "./firebaseAdmin.js";

/**
 * Send push notification to a specific user
 * @param {string} userId - Recipient user ID
 * @param {object} payload - Notification data { title, body, data, link }
 */
export const sendPushNotification = async (userId, { title, body, icon, data = {}, link = "/notifications" }) => {
  try {
    const app = initFirebaseAdmin();
    if (!app) return;

    const user = await User.findById(userId).select("fcmTokens");
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return;
    }

    const messaging = getMessaging();

    // Prepare Production-Grade message
    // 🏷️ Sanitize data: FCM only accepts strings in the 'data' object
    const sanitizedData = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        sanitizedData[key] = String(data[key]);
      }
    });

    const message = {
      notification: {
        title,
        body,
        ...(data.image ? { image: String(data.image) } : {}), // Only include if exists
      },
      webpush: {
        notification: {
          title,
          body,
          // 📷 Instagram-style: Use sender avatar if provided, otherwise default icon
          icon: data.senderAvatar || "/icons/notification-icon.png",
          badge: "/icons/notification-badge.png",
          ...(data.image ? { image: String(data.image) } : {}),
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: data.tag || undefined, 
          renotify: data.tag ? true : false,
          actions: [
            {
              action: "view",
              title: "View Details",
              icon: "/icons/notification-badge.png"
            }
          ],
          data: {
            ...sanitizedData,
            click_action: link,
          }
        },
        fcmOptions: {
          link: link,
        }
      },
      data: {
        ...sanitizedData,
        type: data.type || "standard",
        link: link,
      },
      android: {
        priority: "high",
        notification: {
          channel_id: "suvix_notifications",
          icon: "stock_ticker_update",
          color: "#007bff",
          ...(data.image ? { image: String(data.image) } : {}),
        }
      }
    };

    // Send to all tokens for this user
    const sendPromises = user.fcmTokens.map(token => 
      messaging.send({ ...message, token })
        .catch(err => {
          if (err.code === 'messaging/registration-token-not-registered' || 
              err.code === 'messaging/invalid-registration-token') {
            // Remove invalid token
            return User.findByIdAndUpdate(userId, { $pull: { fcmTokens: token } });
          }
          logger.error(`FCM error for token ${token.substring(0, 10)}...:`, err.message);
        })
    );

    await Promise.all(sendPromises);
    logger.info(`Push notification sent to user ${userId}: "${title}"`);
  } catch (error) {
    logger.error("Error in sendPushNotification:", error.message);
  }
};
