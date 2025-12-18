// bannerRoutes.js - Routes for promotional banners
import express from "express";
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
} from "../controllers/bannerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get active banners for carousel (no auth required)
router.get("/", getBanners);

// Track view/click (no auth required)
router.post("/:id/view", trackView);
router.post("/:id/click", trackClick);

// ============ ADMIN ROUTES ============
// All routes below require admin authentication
router.use(adminAuthMiddleware);

router.get("/admin", getAllBanners);
router.get("/analytics", getBannerAnalytics);
router.post("/", createBanner);
router.put("/reorder", reorderBanners);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);

export default router;
