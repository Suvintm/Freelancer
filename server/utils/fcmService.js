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
    const message = {
      notification: {
        title,
        body,
        image: data.image || null, // Support rich media thumbnails
      },
      webpush: {
        notification: {
          title,
          body,
          // 📷 Instagram-style: Use sender avatar if provided, otherwise default icon
          icon: data.senderAvatar || "/icons/notification-icon.png",
          badge: "/icons/notification-badge.png",
          image: data.image || null,
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: data.tag || "suvix-notification", 
          renotify: true,
          actions: [
            {
              action: "view",
              title: "View Details",
              icon: "/icons/notification-badge.png"
            }
          ],
          data: {
            ...data,
            click_action: link,
            senderAvatar: data.senderAvatar || null,
          }
        },
        fcmOptions: {
          link: link,
        }
      },
      data: {
        ...data,
        type: data.type || "standard",
        link: link,
        senderAvatar: data.senderAvatar || "",
      },
      android: {
        priority: "high",
        notification: {
          channel_id: "suvix_notifications",
          icon: "stock_ticker_update",
          color: "#007bff",
          image: data.image || null,
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
