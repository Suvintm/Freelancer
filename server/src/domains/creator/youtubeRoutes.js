import express from "express";
import rateLimit from "express-rate-limit";
import * as youtubeController from "./controllers/youtubeController.js";

import { authenticate as authenticateUser } from "../../shared/middleware/auth.middleware.js";

const router = express.Router();



// ─── Authenticated Management Routes ─────────────────────────────────────────
router.get("/meta/subcategories",        authenticateUser, youtubeController.getYoutubeSubCategories);
router.post("/manual-verify/initiate",   authenticateUser, youtubeController.initiateManualVerification);
router.post("/manual-verify/regenerate", authenticateUser, youtubeController.regenerateManualVerification);
router.post("/manual-verify/check",      authenticateUser, youtubeController.checkManualVerification);
router.delete("/channel/:profileId",     authenticateUser, youtubeController.deleteChannel);
router.post("/channel/link",             authenticateUser, youtubeController.linkOAuthChannel);
router.post("/channel/sync-manual",      authenticateUser, youtubeController.manualSyncChannels);
router.get("/videos/:userId",            authenticateUser, youtubeController.getUserVideos);

// ─── Public Explore Routes ────────────────────────────────────────────────────

// Legacy feed endpoint (kept for backward compatibility)
router.get("/explore", youtubeController.getExploreVideos);


export default router;
