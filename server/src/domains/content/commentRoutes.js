import express from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  addComment,
  getComments,
  getReplies,
  toggleLike,
  deleteComment
} from "./controllers/commentController.js";

const router = express.Router();

// Public routes (if comments are public)
router.get("/:commentId/replies", getReplies);
router.get("/:entityType/:entityId", getComments);

// Protected routes
router.use(authenticate);
router.post("/", addComment);
router.post("/:commentId/like", toggleLike);
router.delete("/:commentId", deleteComment);

export default router;
