import User from "../models/User.js";
import FollowRequest from "../../connectivity/models/FollowRequest.js";
import Notification from "../../connectivity/models/Notification.js";
import { asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { io, getReceiverSocketId } from "../../../socket.js";

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

// @desc    Toggle follow user
// @route   POST /api/user/follow/:editorId
// @access  Private
export const toggleFollow = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const { editorId } = req.params;

  if (followerId.toString() === editorId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const [follower, editor] = await Promise.all([
    User.findById(followerId),
    User.findById(editorId)
  ]);

  if (!editor) {
    res.status(404);
    throw new Error("User to follow not found");
  }

  const isFollowing = follower.following.includes(editorId);

  if (isFollowing) {
    // Unfollow
    follower.following = follower.following.filter(id => id.toString() !== editorId.toString());
    editor.followers = editor.followers.filter(id => id.toString() !== followerId.toString());
    await Promise.all([follower.save(), editor.save()]);
    res.status(200).json({ success: true, message: "Unfollowed successfully", isFollowing: false });
  } else {
    // Check if user has manual approval enabled
    if (editor.followSettings?.manualApproval) {
      // Create follow request
      let followRequest = await FollowRequest.findOne({ sender: followerId, receiver: editorId });
      
      if (followRequest) {
        if (followRequest.status === 'pending') {
          // CANCEL REQUEST: If it's already pending, delete it and the notification
          await FollowRequest.findByIdAndDelete(followRequest._id);
          
          // Also remove the notification sent to the editor
          const deletedNotif = await Notification.findOneAndDelete({
            recipient: editorId,
            sender: followerId,
            type: "follow_request"
          });

          // Real-time: tell the recipient's page to remove the notification instantly
          if (deletedNotif) {
            const recipientSocketId = getReceiverSocketId(editorId.toString());
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("notification:remove", { notificationId: deletedNotif._id.toString() });
            }
          }

          return res.status(200).json({ 
            success: true, 
            message: "Follow request canceled", 
            isPending: false,
            isFollowing: false 
          });
        }
        // If they were rejected before, they can try again (resets status to pending)
        followRequest.status = 'pending';
        await followRequest.save();
      } else {
        followRequest = await FollowRequest.create({ sender: followerId, receiver: editorId });
      }

      // Send interactive notification
      await createNotification({
        recipient: editorId,
        type: "follow_request",
        title: "Follow Request",
        message: `${follower.name} wants to follow you`,
        link: `/notifications`, 
        sender: followerId,
        metaData: { 
          followRequestId: followRequest._id,
          senderId: followerId,
          type: "follow_request"
        } 
      });

      return res.status(200).json({ success: true, message: "Follow request sent", isPending: true });
    }

    // Auto Follow
    follower.following.push(editorId);
    editor.followers.push(followerId);
    await Promise.all([follower.save(), editor.save()]);

    // Send notification to the followed user (editorId)
    await createNotification({
      recipient: editorId,
      type: "follow",
      title: "New Follower",
      message: `${follower.name} started following you`,
      link: `/public-profile/${followerId}`,
      sender: followerId,
      metaData: {
        senderId: followerId,
        type: "follow"
      }
    });

    res.status(200).json({ success: true, message: "Followed successfully", isFollowing: true });
  }
});

// @desc    Get follow status
// @route   GET /api/user/follow/status/:editorId
// @access  Private
export const getFollowStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { editorId } = req.params;

  const [user, request] = await Promise.all([
    User.findById(userId),
    FollowRequest.findOne({ sender: userId, receiver: editorId, status: 'pending' })
  ]);

  const isFollowing = user.following.includes(editorId);
  const isPending = !!request;

  res.status(200).json({ success: true, isFollowing, isPending });
});

// @desc    Get user suggestions
// @route   GET /api/user/suggestions
// @access  Private
export const getUserSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 3, type = "suggested" } = req.query;

  const user = await User.findById(userId);
  const excludeIds = [userId, ...user.following];

  let matchQuery = { 
    _id: { $nin: excludeIds }, 
    isBanned: false,
    $or: [
      { role: { $ne: "editor" } }, // Always show non-editors (clients, etc)
      { role: "editor", profileCompleted: true } // Only show completed editors
    ]
  };
  let sortQuery = { createdAt: -1 };

  if (type === "trending") {
    // Trending based on followers count or suvixScore
    sortQuery = { "suvixScore.total": -1, "followers.length": -1 };
  } else if (type === "nearby") {
    // Nearby based on country
    matchQuery.country = user.country;
  } else if (type === "new") {
    sortQuery = { createdAt: -1 };
  } else {
    // Default shuffled suggestions
    return res.status(200).json({ 
      success: true, 
      suggestions: await User.aggregate([
        { $match: matchQuery },
        { $sample: { size: parseInt(limit) } },
        { $project: { name: 1, profilePicture: { $ifNull: ["$profilePicture", ""] }, role: 1, country: 1 } }
      ])
    });
  }

  const suggestions = await User.find(matchQuery)
    .sort(sortQuery)
    .limit(parseInt(limit))
    .select("name profilePicture role country")
    .lean();

  res.status(200).json({ success: true, suggestions });
});

// @desc    Handle follow request (accept/reject)
// @route   POST /api/user/follow-request/:requestId/:status
// @access  Private
export const handleFollowRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { requestId, status } = req.params; // status: 'accepted' or 'rejected'

  const followRequest = await FollowRequest.findById(requestId);

  // If the follow request no longer exists (sender canceled it), 
  // tell the frontend to remove the notification and respond gracefully
  if (!followRequest) {
    // Find and clean up the stale notification on the recipient's side
    const staleNotif = await Notification.findOneAndDelete({
      recipient: userId,
      type: "follow_request",
      "metaData.followRequestId": requestId
    });
    // Emit remove event so the UI updates instantly
    const recipientSocketId = getReceiverSocketId(userId.toString());
    if (recipientSocketId && staleNotif) {
      io.to(recipientSocketId).emit("notification:remove", { notificationId: staleNotif._id.toString() });
    }
    return res.status(200).json({ success: false, message: "Follow request was already canceled by the sender", alreadyCanceled: true });
  }

  if (followRequest.receiver.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Unauthorized: This request is not for you");
  }

  if (status === 'accepted') {
    const [sender, receiver] = await Promise.all([
      User.findById(followRequest.sender),
      User.findById(followRequest.receiver)
    ]);

    // Update follow lists
    if (!sender.following.includes(receiver._id)) {
      sender.following.push(receiver._id);
    }
    if (!receiver.followers.includes(sender._id)) {
      receiver.followers.push(sender._id);
    }

    await Promise.all([sender.save(), receiver.save()]);
    
    // Update request status
    followRequest.status = 'accepted';
    await followRequest.save();

    // Notify sender they are now following
    await createNotification({
      recipient: sender._id,
      type: "follow_accept",
      title: "Request Accepted",
      message: `${receiver.name} accepted your follow request`,
      link: `/public-profile/${receiver._id}`,
      sender: receiver._id,
      metaData: {
        senderId: receiver._id,
        type: "follow_accept"
      }
    });

    res.status(200).json({ success: true, message: "Request accepted" });
  } else {
    // Rejected
    followRequest.status = 'rejected';
    await followRequest.save();
    res.status(200).json({ success: true, message: "Request rejected" });
  }
});

// @desc    Get followers list
// @route   GET /api/user/followers/:userId
// @access  Private
export const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate({
    path: "followers",
    select: "name profilePicture role country suvixScore",
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    followers: user.followers,
  });
});

// @desc    Get following list
// @route   GET /api/user/following/:userId
// @access  Private
export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate({
    path: "following",
    select: "name profilePicture role country suvixScore",
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    following: user.following,
  });
});
// @desc    Search users by name
// @route   GET /api/user/search
// @access  Private
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json({ success: true, users: [] });
  }

  const searchRegex = new RegExp(query, "i");

  const users = await User.find({
    name: searchRegex,
    isBanned: { $ne: true },
    $or: [
      { role: { $ne: "editor" } },
      { role: "editor", profileCompleted: true }
    ]
  })
    .select("name profilePicture role country")
    .limit(8)
    .lean();

  res.status(200).json({ success: true, users });
});

// @desc    Update FCM Token for push notifications
// @route   POST /api/user/fcm-token
// @access  Private
export const updateFcmToken = asyncHandler(async (req, res) => {
  // 🔍 Diagnostic logging to find why req.body is missing in production
  if (!req.body) {
    logger.error(`FCM registration failed: req.body is undefined. Content-Type: ${req.get('Content-Type')}`);
    res.status(400);
    throw new Error("Request body is missing. Ensure Content-Type is application/json.");
  }

  const { token } = req.body;
  const userId = req.user._id;

  if (!token) {
    res.status(400);
    throw new Error("FCM Token is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Add token if it doesn't exist (Maintain max 5 tokens for performance)
  if (!user.fcmTokens.includes(token)) {
    if (user.fcmTokens.length >= 5) {
      user.fcmTokens.shift(); // Remove oldest token (FIFO)
    }
    user.fcmTokens.push(token);
    await user.save();
    logger.info(`FCM Token registered for user ${userId} (Count: ${user.fcmTokens.length})`);
  }

  res.status(200).json({
    success: true,
    message: "FCM Token updated successfully",
  });
});






