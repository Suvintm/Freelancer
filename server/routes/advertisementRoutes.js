// advertisementRoutes.js - Production-grade advertisement routes
import express from "express";
import multer from "multer";
import {
  uploadAdMedia,
  uploadGalleryImages,
  getActiveAds,
  getAdById,
  getSiteSettingsPublic,
  trackAdView,
  trackAdClick,
//   getAllAds,
//   createAd,
//   updateAd,
//   deleteAd,
//   reorderAds,
//   getAdAnalytics,
//   toggleSuvixAds,
//   getSiteSettingsAdmin,
} from "../controllers/advertisementController.js";
// import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// =====================================================================
// IMPORTANT: Specific named routes MUST come before wildcard /:id
// =====================================================================

// ── Admin: GET routes ────────────────────────────────────────────────
// MOVED TO ADMIN-SERVER
/*
router.get("/admin/all", protectAdmin, getAllAds);
router.get("/admin/analytics", protectAdmin, getAdAnalytics);
router.get("/admin/settings", protectAdmin, getSiteSettingsAdmin);

// ── Admin: POST routes ───────────────────────────────────────────────
router.post("/admin/upload", protectAdmin, upload.single("media"), uploadAdMedia);
router.post("/admin/upload-gallery", protectAdmin, upload.array("images", 5), uploadGalleryImages);
router.post("/admin/toggle-suvix-ads", protectAdmin, toggleSuvixAds);
router.post("/", protectAdmin, createAd);

// ── Admin: PUT / DELETE ──────────────────────────────────────────────
router.put("/admin/reorder", protectAdmin, reorderAds);
router.put("/:id", protectAdmin, updateAd);
router.delete("/:id", protectAdmin, deleteAd);
*/

// ── Public: Named routes (before wildcard /:id) ──────────────────────
router.get("/settings", getSiteSettingsPublic);       // Global ad toggle (for frontend)

// ── Public: Wildcard & tracking (MUST be last) ──────────────────────
router.get("/", getActiveAds);                        // ?location=home_banner|reels_feed|explore_page
router.get("/:id", getAdById);                        // Single ad for AdDetailsPage
router.post("/:id/view", trackAdView);                // Track view { location }
router.post("/:id/click", trackAdClick);              // Track click

export default router;
