import express from "express";
import {
  getEditorProfile,
  updateEditorProfile,
  addGig,
  updateGig,
  deleteGig,
} from "../controllers/editorcontroller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Profile
router.get("/profile", getEditorProfile);
router.put("/profile", updateEditorProfile);

// Gigs
router.post("/gig", addGig);
router.put("/gig", updateGig);
router.delete("/gig/:gigId", deleteGig);

export default router;
