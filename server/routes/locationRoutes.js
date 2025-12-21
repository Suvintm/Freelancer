import express from "express";
import protect, { authorize } from "../middleware/authMiddleware.js";
import {
  updateLocationSettings,
  getLocationSettings,
  getNearbyEditors,
  logLocationConsent,
  deleteLocationSettings,
} from "../controllers/locationController.js";
import { locationSearchLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Editor-only routes
router
  .route("/settings")
  .get(authorize("editor"), getLocationSettings)
  .patch(authorize("editor"), updateLocationSettings)
  .delete(authorize("editor"), deleteLocationSettings);

// Client-only route (with rate limiting to prevent scraping)
router.get("/nearby", authorize("client"), locationSearchLimiter, getNearbyEditors);

// Consent logging (any authenticated user)
router.post("/consent", logLocationConsent);

export default router;
