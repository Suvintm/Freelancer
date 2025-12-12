import express from "express";
import {
  getMessages,
  sendMessage,
  markAsSeen,
  markAsDownloaded,
  getUnreadCount,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get unread count
router.get("/unread", getUnreadCount);

// Messages for specific order
router.get("/:orderId", getMessages);
router.post("/:orderId", sendMessage);

// Message actions
router.patch("/:messageId/seen", markAsSeen);
router.patch("/:messageId/downloaded", markAsDownloaded);

export default router;
