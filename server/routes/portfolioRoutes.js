import express from "express";
import {
  createPortfolio,
  getPortfolios,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfoliosByUserId,
} from "../controllers/portfolioController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { portfolioValidator, mongoIdValidator, userIdValidator } from "../middleware/validators.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { checkStorage } from "../middleware/storageMiddleware.js";

const router = express.Router();

// ============ PUBLIC ROUTE ============
// Fetch portfolios by user ID (for Public Editor Profile)
router.get("/user/:userId", userIdValidator, getPortfoliosByUserId);

// Protect all routes below
router.use(authMiddleware);

// ============ PORTFOLIO CRUD ============

// Create portfolio - supports multiple original clips (up to 5)
router.post(
  "/",
  uploadLimiter,
  checkStorage, // Check storage before upload
  upload.fields([
    { name: "originalClip", maxCount: 5 }, // Allow up to 5 original clips
    { name: "editedClip", maxCount: 1 },
  ]),
  portfolioValidator,
  createPortfolio
);

// Get all portfolios (paginated)
router.get("/", getPortfolios);

// Get single portfolio
router.get("/:id", mongoIdValidator, getPortfolio);

// Update portfolio - supports multiple original clips
router.put(
  "/:id",
  uploadLimiter,
  mongoIdValidator,
  checkStorage, // Check storage before upload
  upload.fields([
    { name: "originalClip", maxCount: 5 },
    { name: "editedClip", maxCount: 1 },
  ]),
  updatePortfolio
);

// Delete portfolio
router.delete("/:id", mongoIdValidator, deletePortfolio);

export default router;
