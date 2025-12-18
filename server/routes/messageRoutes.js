import express from "express";
import multer from "multer";
import {
  getMessages,
  sendMessage,
  markAsSeen,
  markAsDownloaded,
  getUnreadCount,
  getUnreadCountsPerOrder,
  uploadFile,
  deleteMessage,
  editMessage,
  toggleStarMessage,
  getStarredMessages,
  searchMessages,
  uploadVoice,
  sendDriveLink,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for large file uploads (100MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// All routes are protected
router.use(authMiddleware);

// Get unread count (total across all orders)
router.get("/unread", getUnreadCount);

// 🆕 Get unread counts per order (for chat list)
router.get("/unread-per-order", getUnreadCountsPerOrder);

// Search messages in an order
router.get("/:orderId/search", searchMessages);

// Get starred messages for an order
router.get("/:orderId/starred", getStarredMessages);

// Messages for specific order
router.get("/:orderId", getMessages);
router.post("/:orderId", sendMessage);

// File upload route
router.post("/:orderId/file", upload.single("file"), uploadFile);

// Voice upload route
router.post("/:orderId/voice", upload.single("audio"), uploadVoice);

// Drive link route (clients only)
router.post("/:orderId/drive-link", sendDriveLink);

// Message actions
router.patch("/:messageId/seen", markAsSeen);
router.patch("/:messageId/downloaded", markAsDownloaded);
router.patch("/:messageId/delete", deleteMessage);
router.patch("/:messageId/edit", editMessage);
router.patch("/:messageId/star", toggleStarMessage);

export default router;

