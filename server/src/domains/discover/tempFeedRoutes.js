import express from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import { upload } from "../../shared/middleware/upload.middleware.js";
import { 
  createTempFeedItem, 
  getTempFeed, 
  deleteTempFeedItem,
  voteTempFeedItem
} from "./controllers/tempFeedController.js";

const router = express.Router();

// Parse fields for video file (Reels/YT video) and multiple image files (Posts)
const uploadMiddleware = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "images", maxCount: 10 }
]);

router.post("/", authenticate, uploadMiddleware, createTempFeedItem);
router.get("/", getTempFeed);
router.delete("/:id", authenticate, deleteTempFeedItem);
router.post("/:id/vote", voteTempFeedItem);

export default router;
