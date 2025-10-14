// routes/exploreRoutes.js
import express from "express";
import { getAllEditors } from "../controllers/exploreController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/editors", protect, getAllEditors);

export default router;
