import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// @desc    Toggle saved editor (save/unsave)
// @route   POST /api/user/saved-editors/:editorId
// @access  Private
export const toggleSavedEditor = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { editorId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if editor is already saved
  const isSaved = user.savedEditors.includes(editorId);

  if (isSaved) {
    // Unsave
    user.savedEditors = user.savedEditors.filter(
      (id) => id.toString() !== editorId
    );
    await user.save();
    res.status(200).json({ success: true, message: "Editor removed from saved list", isSaved: false });
  } else {
    // Save
    user.savedEditors.push(editorId);
    await user.save();
    res.status(200).json({ success: true, message: "Editor saved successfully", isSaved: true });
  }
});

// @desc    Get saved editors list
// @route   GET /api/user/saved-editors
// @access  Private
export const getSavedEditors = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate({
    path: "savedEditors",
    select: "name profilePicture role location rating totalProjects suvixScore", // Select fields to display in card
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    savedEditors: user.savedEditors,
  });
});
