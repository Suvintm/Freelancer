// bannerRoutes.js - Routes for promotional banners
import express from "express";
import multer from "multer";
import {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  trackView,
  trackClick,
  getBannerAnalytics,
  uploadBannerMedia,
} from "../controllers/bannerController.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Multer config for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// ============ PUBLIC ROUTES ============
// Get active banners for carousel (no auth required)
router.get("/", getBanners);

// Track view/click (no auth required)
router.post("/:id/view", trackView);
router.post("/:id/click", trackClick);

// ============ ADMIN ROUTES ============
// All routes below require admin authentication
router.use(protectAdmin);

router.post("/upload", upload.single("media"), uploadBannerMedia);
router.get("/admin", getAllBanners);
router.get("/analytics", getBannerAnalytics);
router.post("/", createBanner);
router.put("/reorder", reorderBanners);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);

export default router;
