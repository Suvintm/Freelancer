// finalDeliveryRoutes.js - Routes for secure final video delivery
import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  uploadFinalDelivery,
  getPreview,
  requestChanges,
  confirmDownload,
  getDeliveryStatus,
} from "../controllers/finalDeliveryController.js";

const router = express.Router();

// Configure multer for large video uploads (500MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    // Allow video and image files
    if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image files are allowed"), false);
    }
  },
});

// All routes are protected
router.use(authMiddleware);

// Upload final delivery (Editor only)
router.post("/:orderId/upload", upload.single("file"), uploadFinalDelivery);

// Get watermarked preview (Client only)
router.get("/:orderId/preview", getPreview);

// Request changes (Client only)
router.post("/:orderId/changes", requestChanges);

// Confirm and download (Client only)
router.post("/:orderId/confirm", confirmDownload);

// Get delivery status
router.get("/:orderId/status", getDeliveryStatus);

export default router;
