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
    select: "name profilePicture role location rating totalProjects suvixScore availability", // Select fields to display in card
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check-on-Read: Filter out stale "busy" status
  const now = new Date();
  const validSavedEditors = user.savedEditors.map(editor => {
    if (editor.availability?.status === 'busy' && editor.availability.busyUntil && new Date(editor.availability.busyUntil) < now) {
         // This is a view-only fix, actual DB update happens when that specific user logs in or we access their full profile
         // For optimization, we just return the 'corrected' view here
         return {
            ...editor.toObject(),
            availability: { ...editor.availability, status: 'available', busyUntil: null }
         };
    }
    return editor;
  });

  res.status(200).json({
    success: true,
    savedEditors: validSavedEditors,
  });
});

// @desc    Update editor availability
// @route   PUT /api/user/availability
// @access  Private (Editor)
export const updateAvailability = asyncHandler(async (req, res) => {
  const { status, busyUntil } = req.body;
  
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.availability.status = status;
  user.availability.updatedAt = Date.now();
  
  if (status === 'busy') {
    if (!busyUntil) {
       res.status(400);
       throw new Error("Date is required for busy status");
    }
    user.availability.busyUntil = busyUntil;
  } else {
    user.availability.busyUntil = null;
  }

  await user.save();

  res.status(200).json({
    success: true,
    availability: user.availability,
    message: `Status updated to ${status === 'small_only' ? 'Small Projects Only' : status}`
  });
});
