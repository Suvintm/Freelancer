import express from "express";
import multer from "multer";
import {
  getMessages,
  sendMessage,
  markAsSeen,
  markAsDownloaded,
  getUnreadCount,
  uploadFile,
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

// Get unread count
router.get("/unread", getUnreadCount);

// Messages for specific order
router.get("/:orderId", getMessages);
router.post("/:orderId", sendMessage);

// File upload route
router.post("/:orderId/file", upload.single("file"), uploadFile);

// Message actions
router.patch("/:messageId/seen", markAsSeen);
router.patch("/:messageId/downloaded", markAsDownloaded);

export default router;
