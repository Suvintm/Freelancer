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

const router = express.Router();


// ---------------- PUBLIC ROUTE ----------------
// ✅ Fetch portfolios by user ID (for Public Editor Profile)
router.get("/user/:userId", getPortfoliosByUserId);

// Protect all routes
router.use(authMiddleware);

// Portfolio CRUD
router.post(
  "/",
  upload.fields([
    { name: "originalClip", maxCount: 1 },
    { name: "editedClip", maxCount: 1 },
  ]),
  createPortfolio
);

router.get("/", getPortfolios);
router.get("/:id", getPortfolio);
router.put(
  "/:id",
  upload.fields([
    { name: "originalClip", maxCount: 1 },
    { name: "editedClip", maxCount: 1 },
  ]),
  updatePortfolio
);
router.delete("/:id", deletePortfolio);

export default router;
