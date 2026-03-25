import express from "express";
import asyncHandler from "express-async-handler";
import { AdPreview } from "../models/AdPreview.js";

const router = express.Router();

// GET /api/ad-previews — Public route to fetch demo media
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const previews = await AdPreview.getPreviews();
    res.json({ success: true, previews });
  })
);

export default router;
