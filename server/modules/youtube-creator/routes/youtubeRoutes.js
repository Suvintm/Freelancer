import express from "express";
import rateLimit from "express-rate-limit";
import * as youtubeController from "../controllers/youtubeController.js";
import * as youtubeSearchController from "../controllers/youtubeSearchController.js";
import { authenticate as authenticateUser } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Search: 30 req/min per IP — protects DB from scraping/abuse
const searchLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many search requests. Please slow down.' },
});

// Suggestions: 60 req/min — fires on every keystroke so higher limit
const suggestLimit = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many suggestion requests.' },
});

// Click tracking: 20 req/min — each click = 1 event
const clickLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many click events.' },
});


// ─── Authenticated Management Routes ─────────────────────────────────────────
router.get("/meta/subcategories",        authenticateUser, youtubeController.getYoutubeSubCategories);
router.post("/manual-verify/initiate",   authenticateUser, youtubeController.initiateManualVerification);
router.post("/manual-verify/regenerate", authenticateUser, youtubeController.regenerateManualVerification);
router.post("/manual-verify/check",      authenticateUser, youtubeController.checkManualVerification);
router.delete("/channel/:profileId",     authenticateUser, youtubeController.deleteChannel);

// ─── Public Explore Routes ────────────────────────────────────────────────────

// Legacy feed endpoint (kept for backward compatibility)
router.get("/explore", youtubeController.getExploreVideos);

// 🌟 Production-grade popular feed (replaces legacy explore over time)
router.get("/explore/popular",           searchLimit, youtubeSearchController.getPopularVideos);

// 🔍 Main search — rate limited, cursor paginated, multi-tier cached
router.get("/explore/search",            searchLimit, youtubeSearchController.getExploreSearch);

// 💡 Suggestions — higher rate limit (fires on every keystroke)
router.get("/explore/suggestions",       suggestLimit, youtubeSearchController.getExploreSuggestions);

// 🔗 Related videos — no rate limit (internal-ish, called after search result display)
router.get("/explore/related/:videoId",  youtubeSearchController.getRelatedVideos);

// 📊 Click tracking — feedback loop signal (fire-and-forget from mobile)
router.post("/explore/click",            clickLimit, youtubeSearchController.recordSearchClick);

export default router;
