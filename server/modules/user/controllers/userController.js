import prisma from "../../../config/prisma.js";
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
  const userId = req.user.id;
  const { editorId } = req.params;

  const existing = await prisma.userSavedEditor.findUnique({
      where: { user_id_editor_id: { user_id: userId, editor_id: editorId } }
  });

  if (existing) {
    await prisma.userSavedEditor.delete({
        where: { user_id_editor_id: { user_id: userId, editor_id: editorId } }
    });
    res.status(200).json({ success: true, message: "Editor removed from saved list", isSaved: false });
  } else {
    await prisma.userSavedEditor.create({
        data: { user_id: userId, editor_id: editorId }
    });
    res.status(200).json({ success: true, message: "Editor saved successfully", isSaved: true });
  }
});

// @desc    Get saved editors list
// @route   GET /api/user/saved-editors
// @access  Private
export const getSavedEditors = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const saved = await prisma.userSavedEditor.findMany({
      where: { user_id: userId },
      include: {
          editor: {
              select: {
                  id: true, name: true, profile_picture: true, role: true, 
                  location: true, rating: true, total_projects: true, 
                  suvix_score_total: true, availability_status: true,
                  availability_busy_until: true
              }
          }
      }
  });

  const now = new Date();
  const validSavedEditors = saved.map(s => {
      const editor = s.editor;
      let status = editor.availability_status;
      if (status === 'busy' && editor.availability_busy_until && new Date(editor.availability_busy_until) < now) {
          status = 'available';
      }
      return {
          id: editor.id,
          name: editor.name,
          profilePicture: editor.profile_picture,
          role: editor.role,
          location: editor.location,
          rating: Number(editor.rating),
          totalProjects: editor.total_projects,
          suvixScore: editor.suvix_score_total,
          availability: { status }
      };
  });

  res.status(200).json({ success: true, savedEditors: validSavedEditors });
});

// @desc    Update editor availability
export const updateAvailability = asyncHandler(async (req, res) => {
  const { status, busyUntil } = req.body;
  const userId = req.user.id;

  const updateData = {
      availability_status: status,
      availability_updated_at: new Date()
  };

  if (status === 'busy') {
    if (!busyUntil) throw new ApiError(400, "Date is required for busy status");
    updateData.availability_busy_until = new Date(busyUntil);
  } else {
    updateData.availability_busy_until = null;
  }

  const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData
  });

  res.status(200).json({
    success: true,
    availability: { status: updated.availability_status, busyUntil: updated.availability_busy_until },
    message: `Status updated successfully`
  });
});

// @desc    Toggle follow user (Hybrid)
export const toggleFollow = asyncHandler(async (req, res) => {
  const followerId = req.user.id;
  const { editorId } = req.params;

  if (followerId === editorId) throw new ApiError(400, "You cannot follow yourself");

  const [follower, editor] = await Promise.all([
    prisma.user.findUnique({ where: { id: followerId } }),
    prisma.user.findUnique({ where: { id: editorId } })
  ]);

  if (!editor) throw new ApiError(404, "User not found");

  const existingFollow = await prisma.userFollow.findUnique({
      where: { follower_id_following_id: { follower_id: followerId, following_id: editorId } }
  });

  if (existingFollow) {
    // Unfollow (PostgreSQL)
    await prisma.userFollow.delete({
        where: { follower_id_following_id: { follower_id: followerId, following_id: editorId } }
    });
    res.status(200).json({ success: true, message: "Unfollowed successfully", isFollowing: false });
  } else {
    // Follow Logic (Checks Mongoose for settings)
    // For now we assume auto-follow as the complex settings remain in MongoDB
    // and would require further refactoring. We maintain standard follow here.
    
    await prisma.userFollow.create({
        data: { follower_id: followerId, following_id: editorId }
    });

    // Notify (MongoDB)
    await createNotification({
      recipient: editorId,
      type: "follow",
      title: "New Follower",
      message: `${follower.name} started following you`,
      link: `/public-profile/${followerId}`,
      sender: followerId,
    });

    res.status(200).json({ success: true, message: "Followed successfully", isFollowing: true });
  }
});

// @desc    Get follow status
export const getFollowStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { editorId } = req.params;

  const follow = await prisma.userFollow.findUnique({
      where: { follower_id_following_id: { follower_id: userId, following_id: editorId } }
  });

  res.status(200).json({ success: true, isFollowing: !!follow, isPending: false });
});

// @desc    Search users
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ success: true, users: [] });

  const users = await prisma.user.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
      is_banned: false,
      OR: [
        { role: { not: "editor" } },
        { role: "editor", profile_completed: true }
      ]
    },
    select: { id: true, name: true, profile_picture: true, role: true, country: true },
    take: 8
  });

  res.status(200).json({ 
      success: true, 
      users: users.map(u => ({ ...u, profilePicture: u.profile_picture })) 
  });
});

/**
 * Handle Follow Request (Accept/Reject)
 * Still largely Mongoose-based for the request list, but updates Prisma for the follow.
 */
export const handleFollowRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { requestId, status } = req.params;

    const followRequest = await FollowRequest.findById(requestId);
    if (!followRequest) return res.status(200).json({ success: false, message: "Request not found" });

    if (followRequest.receiver.toString() !== userId) throw new ApiError(403, "Unauthorized");

    if (status === 'accepted') {
        // Create Follow (PostgreSQL)
        await prisma.userFollow.upsert({
            where: { follower_id_following_id: { follower_id: followRequest.sender, following_id: followRequest.receiver } },
            update: {},
            create: { follower_id: followRequest.sender, following_id: followRequest.receiver }
        });

        followRequest.status = 'accepted';
        await followRequest.save();

        res.status(200).json({ success: true, message: "Request accepted" });
    } else {
        followRequest.status = 'rejected';
        await followRequest.save();
        res.status(200).json({ success: true, message: "Request rejected" });
    }
});

// Utility: FCM Token
export const updateFcmToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;
    if (!token) throw new ApiError(400, "Token is required");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let tokens = user.fcm_tokens || [];
    if (!tokens.includes(token)) {
        if (tokens.length >= 5) tokens.shift();
        tokens.push(token);
        await prisma.user.update({
            where: { id: userId },
            data: { fcm_tokens: tokens }
        });
    }
    res.status(200).json({ success: true, message: "Token updated" });
});

export const getFollowers = asyncHandler(async (req, res) => {
    const follows = await prisma.userFollow.findMany({
        where: { following_id: req.params.userId },
        include: { follower: { select: { id: true, name: true, profile_picture: true, role: true, country: true } } }
    });
    res.status(200).json({ success: true, followers: follows.map(f => ({ ...f.follower, profilePicture: f.follower.profile_picture })) });
});

export const getFollowing = asyncHandler(async (req, res) => {
    const follows = await prisma.userFollow.findMany({
        where: { follower_id: req.params.userId },
        include: { following: { select: { id: true, name: true, profile_picture: true, role: true, country: true } } }
    });
    res.status(200).json({ success: true, following: follows.map(f => ({ ...f.following, profilePicture: f.following.profile_picture })) });
});

/**
 * Get Suggestions
 * Shuffled suggestions from PostgreSQL
 */
export const getUserSuggestions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 3 } = req.query;

    const following = await prisma.userFollow.findMany({
        where: { follower_id: userId },
        select: { following_id: true }
    });
    const excludeIds = [userId, ...following.map(f => f.following_id)];

    const suggestions = await prisma.user.findMany({
        where: {
            id: { notIn: excludeIds },
            is_banned: false,
            OR: [
                { role: { not: "editor" } },
                { role: "editor", profile_completed: true }
            ]
        },
        select: { id: true, name: true, profile_picture: true, role: true, country: true },
        take: parseInt(limit)
    });

    res.status(200).json({ success: true, suggestions: suggestions.map(u => ({ ...u, profilePicture: u.profile_picture })) });
});
