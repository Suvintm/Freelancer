import Notification from "../models/Notification.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { io, getReceiverSocketId } from "../../../socket.js";
import { withCache, deleteCache, CacheKey, TTL } from "../../../utils/cache.js";
import { sendPushNotification } from "../../../utils/fcmService.js";

// ============ GET UNREAD COUNT ============
export const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await withCache(
        CacheKey.notificationCount(req.user._id),
        TTL.NOTIFICATION_COUNT,
        () => Notification.countDocuments({ recipient: req.user._id, isRead: false })
    );

    res.status(200).json({
        success: true,
        unreadCount,
    });
});

// ============ GET NOTIFICATIONS ============
export const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        Notification.find({ recipient: req.user._id })
            .populate("sender", "name profilePicture role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ recipient: req.user._id }),
    ]);

    const unreadCount = await withCache(
        CacheKey.notificationCount(req.user._id),
        TTL.NOTIFICATION_COUNT,
        () => Notification.countDocuments({ recipient: req.user._id, isRead: false })
    );

    res.status(200).json({
        success: true,
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
        },
    });
});

// ============ MARK AS READ ============
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === "all") {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        await deleteCache(CacheKey.notificationCount(req.user._id));
    } else {
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        await deleteCache(CacheKey.notificationCount(req.user._id));
    }

    res.status(200).json({
        success: true,
        message: "Marked as read",
    });
});

// ============ DELETE NOTIFICATION ============
export const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: id,
        recipient: req.user._id,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (!notification.isRead) {
        await deleteCache(CacheKey.notificationCount(req.user._id));
    }

    res.status(200).json({
        success: true,
        message: "Notification deleted",
    });
});

// ============ INTERNAL: CREATE NOTIFICATION ============
// This function is for internal use by other controllers
export const createNotification = async ({ recipient, type, title, message, link, sender = null, metaData = {} }) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            link,
            sender,
            metaData,
        });

        const receiverSocketId = getReceiverSocketId(recipient.toString());
        if (receiverSocketId) {
            // Always populate sender before emitting for rich client-side display
            if (sender) {
                await notification.populate("sender", "name profilePicture role");
            }
            const populatedNotification = notification.toObject();
            // Emit using standard event name (matches SocketContext listener)
            io.to(receiverSocketId).emit("notification:new", populatedNotification);
        }

        // Send Push Notification (FCM)
        // 🏷️ Production Tagging: Group chats by order, everything else stays unique to stack
        let smartTag = metaData.tag || undefined; 

        if (type === "chat_message" && metaData.orderId) {
            // Group by order so multiple chat messages replace each other (with renotify alert)
            smartTag = `chat_${metaData.orderId}`;
        } else if (!smartTag) {
            // For others, use unique ID to ENSURE they stack independently
            smartTag = notification._id.toString();
        }

        // ── Resolve sender avatar independently ─────────────────────────────
        // (Socket populate only runs if recipient is online; push needs it always)
        let senderAvatar = metaData.senderAvatar || null;
        if (!senderAvatar && sender) {
            try {
                const User = (await import("../../../models/User.js")).default;
                const senderDoc = await User.findById(sender).select("profilePicture").lean();
                senderAvatar = senderDoc?.profilePicture || null;
            } catch (_) {
                // Ignore error if sender user model cannot be loaded (FCM fallback only)
            }
        }

        // ── Flatten FCM Payload ─────────────────────────────────────────────
        const fcmPayload = {
            title: title,
            body: message,
            link: link || "/notifications",
            click_action: link || "/notifications",
            ...metaData,
            senderAvatar: senderAvatar || "",
            image: metaData.image || null,
            tag: smartTag,
            notificationId: notification._id.toString()
        };
        
        // Fire and forget - don't block the API response
        sendPushNotification(recipient, fcmPayload).catch(err => 
            console.error("[FCM] Push failed:", err.message)
        );

        // Invalidate unread count cache
        await deleteCache(CacheKey.notificationCount(recipient.toString()));

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
