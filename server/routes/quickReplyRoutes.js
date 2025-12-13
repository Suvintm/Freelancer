import express from "express";
import { QuickReply } from "../models/QuickReply.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get all quick replies for user
router.get("/", asyncHandler(async (req, res) => {
  const replies = await QuickReply.find({ user: req.user._id })
    .sort({ usageCount: -1, createdAt: -1 });
  
  res.json({ success: true, replies });
}));

// Create quick reply
router.post("/", asyncHandler(async (req, res) => {
  const { title, content, category, shortcut } = req.body;
  
  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }
  
  const reply = await QuickReply.create({
    user: req.user._id,
    title: title.trim(),
    content: content.trim(),
    category: category || "other",
    shortcut: shortcut?.toLowerCase().trim(),
  });
  
  res.status(201).json({ success: true, reply });
}));

// Update quick reply
router.patch("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, category, shortcut } = req.body;
  
  const reply = await QuickReply.findOne({ _id: id, user: req.user._id });
  
  if (!reply) {
    throw new ApiError(404, "Quick reply not found");
  }
  
  if (title) reply.title = title.trim();
  if (content) reply.content = content.trim();
  if (category) reply.category = category;
  if (shortcut !== undefined) reply.shortcut = shortcut?.toLowerCase().trim();
  
  await reply.save();
  
  res.json({ success: true, reply });
}));

// Delete quick reply
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const reply = await QuickReply.findOneAndDelete({ _id: id, user: req.user._id });
  
  if (!reply) {
    throw new ApiError(404, "Quick reply not found");
  }
  
  res.json({ success: true, message: "Quick reply deleted" });
}));

// Increment usage count (when used)
router.patch("/:id/use", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const reply = await QuickReply.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $inc: { usageCount: 1 } },
    { new: true }
  );
  
  if (!reply) {
    throw new ApiError(404, "Quick reply not found");
  }
  
  res.json({ success: true, reply });
}));

export default router;
