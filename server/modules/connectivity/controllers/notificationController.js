import Notification from "../models/Notification.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { io, getReceiverSocketId } from "../../../socket.js";
import { withCache, deleteCache, CacheKey, TTL } from "../../../utils/cache.js";
import { sendPushNotification } from "../../../utils/fcmService.js";
import prisma from "../../../config/prisma.js";

// ============ GET UNREAD COUNT ============
export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const unreadCount = await withCache(
        CacheKey.notificationCount(userId),
        TTL.NOTIFICATION_COUNT,
        () => Notification.countDocuments({ recipient: userId, isRead: false })
    );

    res.status(200).json({
        success: true,
        unreadCount,
    });
});

// ============ GET NOTIFICATIONS ============
export const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notificationsRaw, total] = await Promise.all([
        Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ recipient: userId }),
    ]);

    // Manual population from Prisma
    const senderIds = [...new Set(notificationsRaw.filter(n => n.sender).map(n => n.sender))];
    const senders = await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, name: true, profile_picture: true, role: true }
    });

    const senderMap = senders.reduce((acc, s) => {
        acc[s.id] = { _id: s.id, name: s.name, profilePicture: s.profile_picture, role: s.role };
        return acc;
    }, {});

    const notifications = notificationsRaw.map(n => {
        const obj = n.toObject();
        if (obj.sender) {
            obj.sender = senderMap[obj.sender] || { _id: obj.sender, name: "User", profilePicture: "" };
        }
        return obj;
    });

    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

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
    const userId = req.user.id;
    const { id } = req.params;

    if (id === "all") {
        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
        await deleteCache(CacheKey.notificationCount(userId));
    } else {
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
        await deleteCache(CacheKey.notificationCount(userId));
    }

    res.status(200).json({
        success: true,
        message: "Marked as read",
    });
});

// ============ DELETE NOTIFICATION ============
export const deleteNotification = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: id,
        recipient: userId,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (!notification.isRead) {
        await deleteCache(CacheKey.notificationCount(userId));
    }

    res.status(200).json({
        success: true,
        message: "Notification deleted",
    });
});

// ============ INTERNAL: CREATE NOTIFICATION ============
export const createNotification = async ({ recipient, type, title, message, link, sender = null, metaData = {} }) => {
    try {
        const notification = await Notification.create({
            recipient: recipient.toString(),
            type,
            title,
            message,
            link,
            sender: sender ? sender.toString() : null,
            metaData,
        });

        const receiverSocketId = getReceiverSocketId(recipient.toString());
        
        let senderInfo = null;
        if (sender) {
            const senderDoc = await prisma.user.findUnique({
                where: { id: sender.toString() },
                select: { id: true, name: true, profile_picture: true, role: true }
            });
            if (senderDoc) {
                senderInfo = {
                    _id: senderDoc.id,
                    name: senderDoc.name,
                    profilePicture: senderDoc.profile_picture,
                    role: senderDoc.role
                };
            }
        }

        if (receiverSocketId) {
            const populatedNotification = notification.toObject();
            if (senderInfo) {
                populatedNotification.sender = senderInfo;
            }
            io.to(receiverSocketId).emit("notification:new", populatedNotification);
        }

        // Send Push Notification (FCM)
        let smartTag = metaData.tag || undefined; 
        if (type === "chat_message" && metaData.orderId) {
            smartTag = `chat_${metaData.orderId}`;
        } else if (!smartTag) {
            smartTag = notification._id.toString();
        }

        const fcmPayload = {
            title: title,
            body: message,
            link: link || "/notifications",
            click_action: link || "/notifications",
            ...metaData,
            senderAvatar: senderInfo?.profilePicture || "",
            image: metaData.image || null,
            tag: smartTag,
            notificationId: notification._id.toString()
        };
        
        sendPushNotification(recipient.toString(), fcmPayload).catch(err => 
            console.error("[FCM] Push failed:", err.message)
        );

        await deleteCache(CacheKey.notificationCount(recipient.toString()));

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};






