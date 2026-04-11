// server/modules/notification/controllers/notificationController.js
import { asyncHandler } from "../../../middleware/errorHandler.js";
import notificationService from "../services/notificationService.js";

/**
 * @desc    Get user notifications (Activity Feed)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await notificationService.getUserFeed(req.user.id, limit, page);

    res.status(200).json({
        success: true,
        count: notifications.length,
        notifications
    });
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id);

    res.status(200).json({
        success: true,
        message: "Notification marked as read"
    });
});

/**
 * @desc    Register FCM device token
 * @route   POST /api/notifications/tokens
 * @access  Private
 */
export const registerFcmToken = asyncHandler(async (req, res) => {
    const { token, platform, deviceName } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    const safePlatform = platform ? platform.toUpperCase() : 'ANDROID';

    try {
        await notificationService.registerToken(req.user.id, token, safePlatform, deviceName);
    } catch (err) {
        console.error(`❌ [NOTIFY-CONTROLLER] Error registering FCM token:`, err);
        throw err; // Let asyncHandler handle the 500 response
    }

    res.status(200).json({
        success: true,
        message: "FCM token registered successfully"
    });
});
