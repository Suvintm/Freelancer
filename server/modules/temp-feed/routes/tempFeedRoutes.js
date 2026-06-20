import express from "express";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { upload } from "../../../middleware/upload.js";
import { 
  createTempFeedItem, 
  getTempFeed, 
  deleteTempFeedItem 
} from "../controllers/tempFeedController.js";

const router = express.Router();

// Parse fields for video file (Reels/YT video) and multiple image files (Posts)
const uploadMiddleware = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);

router.post("/", authenticate, uploadMiddleware, createTempFeedItem);
router.get("/", getTempFeed);
router.delete("/:id", authenticate, deleteTempFeedItem);

export default router;
