import express from "express";
import {
  createGig,
  getAllGigs,
  getGig,
  getMyGigs,
  updateGig,
  deleteGig,
  toggleGigStatus,
  getGigSuggestions
} from "../controllers/gigController.js";
import authMiddleware from "../../../middleware/authMiddleware.js";
import { roleMiddleware } from "../../../middleware/roleMiddleware.js";
import { upload } from "../../../middleware/upload.js";
import { gigValidator, mongoIdValidator } from "../../../middleware/validators.js";

const router = express.Router();

// Public routes
router.get("/suggestions", getGigSuggestions);
router.get("/", getAllGigs);

// Protected routes (Editor only) - MUST come before /:id routes!
router.get("/my/list", authMiddleware, roleMiddleware(["editor"]), getMyGigs);
router.post("/", authMiddleware, roleMiddleware(["editor"]), upload.single("thumbnail"), gigValidator, createGig);

// Parameterized routes (must be last)
router.get("/:id", mongoIdValidator, getGig);
router.put("/:id", authMiddleware, roleMiddleware(["editor"]), upload.single("thumbnail"), mongoIdValidator, gigValidator, updateGig);
router.delete("/:id", authMiddleware, roleMiddleware(["editor"]), mongoIdValidator, deleteGig);
router.patch("/:id/toggle", authMiddleware, roleMiddleware(["editor"]), mongoIdValidator, toggleGigStatus);

export default router;







