// server/modules/notification/services/notificationService.js
import prisma from "../../../config/prisma.js";
import { sendPushNotification } from "../../../utils/fcmService.js";
import { emitToUser } from "../../../socket.js";
import logger from "../../../utils/logger.js";

/**
 * PRODUCTION-GRADE UNIFIED NOTIFICATION ENGINE
 * 
 * Channels:
 * 1. DATABASE (Activity Feed Persistence)
 * 2. PUSH (Firebase Cloud Messaging)
 * 3. REALTIME (Socket.io Emission)
 */
class NotificationService {
    /**
     * Trigger a new notification to a user.
     * 
     * @param {Object} params
     * @param {string} params.userId - Recipient ID
     * @param {string} [params.senderId] - Triggering user ID (optional)
     * @param {string} params.type - enum NotificationType (e.g., SYNC_COMPLETE)
     * @param {string} params.title - Notification Title
     * @param {string} params.body - Notification Content
     * @param {string} [params.imageUrl] - Optional thumbnail URL
     * @param {Object} [params.metadata] - JSON for deep-linking
     * @param {string} [params.priority] - NORMAL | HIGH
     * @param {string} [params.entityId] - Related object ID
     * @param {string} [params.entityType] - Related object type (ORDER, VIDEO, etc)
     */
    async notify({
        userId,
        senderId = null,
        type,
        title,
        body,
        imageUrl = null,
        metadata = {},
        priority = 'NORMAL',
        entityId = null,
        entityType = null
    }) {
        try {
            // 1. PERSISTENCE: Save to Activity Feed
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    senderId,
                    type,
                    title,
                    body,
                    image_url: imageUrl,
                    metadata: metadata ? metadata : {},
                    priority,
                    entityId,
                    entityType
                }
            });

            logger.info(`💾 [NOTIFY] Saved in-app notification for user ${userId} (ID: ${notification.id})`);

            // 2. REALTIME (Socket): Emit if user is currently online
            const socketPayload = {
                id: notification.id,
                type,
                title,
                body,
                image_url: imageUrl,
                metadata,
                created_at: notification.created_at,
                is_read: false
            };
            
            const wasEmitted = emitToUser(userId, "notification:new", socketPayload);
            if (wasEmitted) {
                logger.debug(`🔔 [NOTIFY] Real-time emit successful for user ${userId}`);
            }

            // 3. PUSH (FCM): Dispatch to all mobile devices
            // This is asynchronous and handled in the background
            const { videos, ...safeMetadata } = metadata || {};
            
            sendPushNotification(userId, {
                notificationId: notification.id,
                title,
                body,
                imageUrl: imageUrl || "",
                type,
                ...safeMetadata // 🛡️ Strip 'videos' array to avoid FCM "Message Too Big" error
            }).then(() => {
                // Once push is considered "processed" by the FCM service, mark as sent
                prisma.notification.update({
                    where: { id: notification.id },
                    data: { is_sent: true }
                }).catch(e => logger.error(`[NOTIFY] Could not mark is_sent for ${notification.id}`));
            });

            return notification;

        } catch (error) {
            logger.error(`❌ [NOTIFY] Critical failure in Notification Engine: ${error.message}`);
            // We do not throw here to avoid crashing the main business flow (e.g. Sync)
            return null;
        }
    }

    /**
     * Fetch user's activity feed
     */
    async getUserFeed(userId, limit = 50, page = 1) {
        return prisma.notification.findMany({
            where: { 
                userId,
                is_deleted: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                name: true,
                                profile_picture: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    /**
     * Mark as read
     */
    async markAsRead(notificationId) {
        return prisma.notification.update({
            where: { id: notificationId },
            data: { 
                is_read: true,
                read_at: new Date()
            }
        });
    }

    /**
     * Register FCM Token for a device
     */
    async registerToken(userId, token, platform, deviceName) {
        return prisma.pushToken.upsert({
            where: { token },
            update: {
                userId,
                platform,
                device_name: deviceName,
                is_active: true,
                last_used_at: new Date()
            },
            create: {
                userId,
                token,
                platform,
                device_name: deviceName
            }
        });
    }
}

export default new NotificationService();
