import express from "express";
import { getPublicProfile, recordClick } from "./controllers/publicProfile.controller.js";

const router = express.Router();

// GET /api/v1/public-profile/:username
router.get("/:username", getPublicProfile);

// POST /api/v1/public-profile/analytics/click
router.post("/analytics/click", recordClick);

export default router;
