import express from "express";
import  protect  from "../../middleware/authMiddleware.js";
import { 
  createAiSession, 
  processAiChat, 
  processGuidedMatch 
} from "../../controllers/aiworkspace/aiController.js";

const router = express.Router();

// All AI Workspace routes are protected
router.use(protect);

router.post("/sessions", createAiSession);
router.post("/sessions/:id/chat", processAiChat);
router.post("/sessions/:id/match", processGuidedMatch);

export default router;
