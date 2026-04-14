import express from "express";
import * as youtubeController from "../controllers/youtubeController.js";
import { authenticateUser } from "../../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * PRODUCTION-GRADE YOUTUBE CREATOR ROUTES
 * Handles manual channel verification and management.
 */

// Initiate manual verification (Generate Token)
router.post("/manual-verify/initiate", authenticateUser, youtubeController.initiateManualVerification);

// Check manual verification status (Scan Description)
router.post("/manual-verify/check", authenticateUser, youtubeController.checkManualVerification);

export default router;
