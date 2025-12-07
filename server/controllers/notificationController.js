import { Notification } from "../models/Notification.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import { io, getReceiverSocketId } from "../socket.js";

// ============ GET NOTIFICATIONS ============
export const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ recipient: req.user._id }),
        Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

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
    } else {
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }
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

    res.status(200).json({
        success: true,
        message: "Notification deleted",
    });
});

// ============ INTERNAL: CREATE NOTIFICATION ============
// This function is for internal use by other controllers
export const createNotification = async ({ recipient, type, title, message, link }) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            link,
        });

        const receiverSocketId = getReceiverSocketId(recipient.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newNotification", notification);
        }

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
