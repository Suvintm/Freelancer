import express from "express";
import {
  createGig,
  getAllGigs,
  getGig,
  getMyGigs,
  updateGig,
  deleteGig,
  toggleGigStatus,
} from "../controllers/gigController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getAllGigs);

// Protected routes (Editor only) - MUST come before /:id routes!
router.get("/my/list", authMiddleware, roleMiddleware(["editor"]), getMyGigs);
router.post("/", authMiddleware, roleMiddleware(["editor"]), upload.single("thumbnail"), createGig);

// Parameterized routes (must be last)
router.get("/:id", getGig);
router.put("/:id", authMiddleware, roleMiddleware(["editor"]), upload.single("thumbnail"), updateGig);
router.delete("/:id", authMiddleware, roleMiddleware(["editor"]), deleteGig);
router.patch("/:id/toggle", authMiddleware, roleMiddleware(["editor"]), toggleGigStatus);

export default router;

