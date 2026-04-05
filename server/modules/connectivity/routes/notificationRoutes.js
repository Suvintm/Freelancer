import express from "express";
import protect from "../../../middleware/authMiddleware.js";
import {
    getNotifications,
    markAsRead,
    deleteNotification,
    getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect); // All routes require auth

router.get("/unread-count", getUnreadCount);
router.get("/", getNotifications);
router.put("/read/:id", markAsRead); // :id can be specific ID or "all"
router.delete("/:id", deleteNotification);

export default router;
