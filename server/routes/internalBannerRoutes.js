/**
 * Internal Banner Routes
 * Routes for managing internal page banners (editors, gigs, jobs)
 */

import express from "express";
import multer from "multer";
import {
  getSectionBanner,
  getAllSectionBanners,
  updateSectionSettings,
  toggleLiveStatus,
  addSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  uploadMedia,
  deleteSection,
} from "../controllers/internalBannerController.js";
import { protectAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// ============ PUBLIC ROUTES ============
// Get section banners (frontend)
router.get("/:section", getSectionBanner);

// ============ ADMIN ROUTES ============
router.use(protectAdmin);

// Get all sections
router.get("/", getAllSectionBanners);

// Upload media
router.post("/upload", upload.single("media"), uploadMedia);

// Section-specific operations
router.put("/:section/settings", updateSectionSettings);
router.put("/:section/live", toggleLiveStatus);
router.delete("/:section", deleteSection);

// Slide operations
router.post("/:section/slides", addSlide);
router.put("/:section/slides/reorder", reorderSlides);
router.put("/:section/slides/:slideId", updateSlide);
router.delete("/:section/slides/:slideId", deleteSlide);

export default router;
