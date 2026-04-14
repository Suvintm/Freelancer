import express from "express";
import * as youtubeController from "../controllers/youtubeController.js";
import { authenticate as authenticateUser } from "../../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * PRODUCTION-GRADE YOUTUBE CREATOR ROUTES
 * Handles manual channel verification and management.
 */

// Metadata Endpoints
router.get("/meta/subcategories", authenticateUser, youtubeController.getYoutubeSubCategories);

// Initiate manual verification (Generate Token)
router.post("/manual-verify/initiate", authenticateUser, youtubeController.initiateManualVerification);

// Regenerate Token
router.post("/manual-verify/regenerate", authenticateUser, youtubeController.regenerateManualVerification);

// Check manual verification status (Scan Description)
router.post("/manual-verify/check", authenticateUser, youtubeController.checkManualVerification);

export default router;
