// routes/exploreRoutes.js
import express from "express";
import { getAllEditors, getEditorSuggestions } from "../controllers/exploreController.js";
import { getAllGigs } from "../../marketplace/controllers/gigController.js"; // Added gig import
import { optionalAuth } from "../../../middleware/authMiddleware.js"; // Use optionalAuth for public access
import { exploreLimiter } from "../../../middleware/rateLimiter.js";

const router = express.Router();

router.get("/suggestions", exploreLimiter, getEditorSuggestions);
router.get("/editors", optionalAuth, exploreLimiter, getAllEditors);
router.get("/gigs", optionalAuth, exploreLimiter, getAllGigs); // Added gigs endpoint

export default router;
