import asyncHandler from "express-async-handler";
import commentService from "../services/commentService.js";

/**
 * @desc    Add a comment or reply
 * @route   POST /api/content/comments
 * @access  Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { entityType, entityId, parentId, content } = req.body;
  const userId = req.user.id; // From auth middleware

  if (!content) {
    res.status(400);
    throw new Error("Comment content is required");
  }

  const comment = await commentService.addComment({
    userId,
    entityType,
    entityId,
    parentId,
    content
  });

  res.status(201).json({
    success: true,
    data: comment
  });
});

/**
 * @desc    Get top level comments for an entity
 * @route   GET /api/content/comments/:entityType/:entityId
 * @access  Public (or Private depending on visibility)
 */
export const getComments = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { limit, cursor } = req.query;

  const result = await commentService.getComments(
    entityType.toUpperCase(),
    entityId,
    limit ? parseInt(limit, 10) : 20,
    cursor
  );

  res.status(200).json({
    success: true,
    data: result.comments,
    nextCursor: result.nextCursor
  });
});

/**
 * @desc    Get replies for a specific comment
 * @route   GET /api/content/comments/:commentId/replies
 * @access  Public (or Private depending on visibility)
 */
export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { limit, cursor } = req.query;

  const result = await commentService.getReplies(
    commentId,
    limit ? parseInt(limit, 10) : 50,
    cursor
  );

  res.status(200).json({
    success: true,
    data: result.replies,
    nextCursor: result.nextCursor
  });
});

/**
 * @desc    Toggle like on a comment
 * @route   POST /api/content/comments/:commentId/like
 * @access  Private
 */
export const toggleLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await commentService.toggleLike(userId, commentId);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/content/comments/:commentId
 * @access  Private
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  await commentService.deleteComment(userId, commentId);

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully"
  });
});
