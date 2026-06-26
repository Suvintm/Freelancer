import prisma from "../../../infrastructure/database/postgres.js";
import { ApiError } from "../../../shared/kernel/errors.js";
import { asyncHandler } from "../../../shared/middleware/error-handler.middleware.js";;
import storageService from "../../../shared/utils/storage-service.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";
import { emitToUser } from '../../../platform/socket/socket.gateway.js';
import logger from "../../../infrastructure/monitoring/logger.js";
import { deleteCache, CacheKey } from "../../../shared/utils/cache.js";
import { smartResolveMediaUrl } from "../../../shared/utils/media-resolver.js";
import { formatAuthResponse, USER_INCLUDE } from "../../auth/services/identity.service.js";

// @desc    Get current authenticated user basic info
// @route   GET /api/user/me
// @access  Private
export const getMyBasicInfo = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_INCLUDE,
  });

  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json({
    success: true,
    user: formatAuthResponse(user)
  });
});

// @desc    Update current authenticated user basic info
// @route   PATCH /api/user/me
// @access  Private
export const updateMyBasicInfo = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { name, username, phone, country, bio } = req.body;

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { id: true, username: true },
  });

  if (!profile) throw new ApiError(404, "User profile not found");

  if (username && username !== profile.username) {
    const normalizedUsername = username.toLowerCase().trim();
    const existing = await prisma.userProfile.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });
    if (existing) throw new ApiError(409, "Username already taken");
  }

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(username ? { username: username.toLowerCase().trim() } : {}),
      ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
      ...(country !== undefined ? { location_country: String(country).trim() } : {}),
      ...(bio !== undefined ? { bio: String(bio).substring(0, 150).trim() } : {}),
      updated_at: new Date(),
    },
    select: {
      name: true,
      username: true,
      phone: true,
      location_country: true,
      profile_picture: true,
      bio: true,
    },
  });

  const responseUser = {
    id: userId,
    role: req.user.role,
    name: updated.name || "",
    username: updated.username || "",
    phone: updated.phone || "",
    country: updated.location_country || "",
    profilePicture: updated.profile_picture || "",
    bio: updated.bio || "",
  };

  // 🧹 [CACHE] Invalidate user cache and broadcast surgical update
  await deleteCache(CacheKey.userProfile(userId));
  
  // 🛰️ [SOCKET] Surgical Broadcast for real-time profile persistence
  emitToUser(userId, "user:profile_updated", { 
    bio: updated.bio, 
    location: updated.location_country 
  });

  return res.status(200).json({
    success: true,
    message: "User profile updated",
    user: responseUser,
  });
});

// @desc    Update current user profile picture
// @route   POST /api/user/me/profile-picture
// @access  Private
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!req.file) {
    throw new ApiError(400, "Please upload an image file");
  }

  // Fetch the old profile to get the existing picture key
  const oldProfile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { profile_picture: true }
  });

  // 💾 Standardized Storage Upload (Universal Service)
  const result = await storageService.uploadBuffer(req.file.buffer, "avatars", {
    userId,
    contentType: req.file.mimetype
  });

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      profile_picture: result.secure_url,
      updated_at: new Date(),
    },
  });

  // 🗑️ Delete the old profile picture from S3 to save storage costs
  if (
    oldProfile?.profile_picture &&
    !oldProfile.profile_picture.startsWith("http")
  ) {
    await storageService.deleteFile(oldProfile.profile_picture);
  }

  // 🧹 [CACHE] Invalidate cache
  await deleteCache(CacheKey.userProfile(userId));
  
  // 🛰️ [SOCKET] Surgical Sync & Community Broadcast
  emitToUser(userId, "user:profile_updated", { profilePicture: profile.profile_picture });
  
  // Also broadcast to community rooms if possible
  const { getIO } = await import('../../../platform/socket/socket.gateway.js');
  const io = getIO();
  if (io) {
    // We don't want to fetch ALL communities here for performance, 
    // but we can emit a global event or the client can handle it if they are in the same room.
    // For now, let's emit a global identity update that clients can use to refresh their local cache.
    io.emit("identity:profile_updated", { 
      userId, 
      profilePicture: profile.profile_picture,
      name: profile.name
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    profilePicture: profile.profile_picture,
  });
});

/**
 * @desc    Social Onboarding: Complete Minimal Profile
 * @route   PUT /api/user/profile/minimal
 * @access  Private (Authenticated but not fully onboarded)
 */
export const updateMinimalProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { username, phone } = req.body;

  if (!username || !phone) {
    throw new ApiError(400, "Username and phone number are required for onboarding.");
  }

  const normalizedUsername = username.toLowerCase().trim();

  // 1. Check if username is already taken
  const existing = await prisma.userProfile.findFirst({
    where: { 
      username: normalizedUsername,
      NOT: { userId }
    }
  });

  if (existing) {
    throw new ApiError(409, "This username is already claimed.");
  }

  // 2. Update Profile & User status atomically
  const updated = await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.update({
      where: { userId },
      data: {
        username: normalizedUsername,
        phone: phone.trim(),
        updated_at: new Date(),
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { is_onboarded: true }
    });

    return profile;
  });

  // 🧹 [CACHE] Invalidate user profile cache
  await deleteCache(CacheKey.userProfile(userId));

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    username: updated.username,
    phone: updated.phone
  });
});

// @desc    Update current user cover banner
// @route   PUT /api/user/me/cover-banner
// @access  Private
export const updateCoverBanner = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { bannerUrl } = req.body;

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      cover_banner: bannerUrl || null,
      updated_at: new Date(),
    },
  });

  // 🧹 [CACHE] Invalidate cache
  await deleteCache(CacheKey.userProfile(userId));

  // 🛰️ [SOCKET] Surgical Sync
  emitToUser(userId, "user:profile_updated", { coverBanner: smartResolveMediaUrl(profile.cover_banner) });

  return res.status(200).json({
    success: true,
    message: "Cover banner updated successfully",
    coverBanner: smartResolveMediaUrl(profile.cover_banner),
  });
});

// @desc    Follow a user
// @route   POST /api/user/follow
// @access  Private
export const followUser = asyncHandler(async (req, res) => {
  const followerId = req.user?.id;
  const { targetUserId } = req.body;

  if (!followerId) throw new ApiError(401, "Unauthorized");
  if (!targetUserId) throw new ApiError(400, "Target user ID is required");
  if (followerId === targetUserId) throw new ApiError(400, "You cannot follow yourself");

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  });
  if (!targetUser) throw new ApiError(404, "Target user not found");

  // Create follow record and update stats atomically in a transaction
  await prisma.$transaction(async (tx) => {
    // Check if already following
    const existing = await tx.userFollow.findFirst({
      where: {
        followerId,
        followingId: targetUserId
      }
    });

    if (!existing) {
      await tx.userFollow.create({
        data: {
          followerId,
          followingId: targetUserId
        }
      });

      // Increment stats
      await tx.userStats.upsert({
        where: { userId: followerId },
        update: { following_count: { increment: 1 } },
        create: { userId: followerId, following_count: 1 }
      });

      await tx.userStats.upsert({
        where: { userId: targetUserId },
        update: { followers_count: { increment: 1 } },
        create: { userId: targetUserId, followers_count: 1 }
      });
    }
  });

  // Fetch updated list of following IDs
  const follows = await prisma.userFollow.findMany({
    where: { followerId },
    select: { followingId: true }
  });

  const followingIds = follows.map(f => f.followingId);

  return res.status(200).json({
    success: true,
    message: "Successfully followed user",
    followingIds
  });
});

// @desc    Unfollow a user
// @route   POST /api/user/unfollow
// @access  Private
export const unfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.user?.id;
  const { targetUserId } = req.body;

  if (!followerId) throw new ApiError(401, "Unauthorized");
  if (!targetUserId) throw new ApiError(400, "Target user ID is required");

  // Delete follow record and update stats atomically in a transaction
  await prisma.$transaction(async (tx) => {
    // Check if following
    const existing = await tx.userFollow.findFirst({
      where: {
        followerId,
        followingId: targetUserId
      }
    });

    if (existing) {
      await tx.userFollow.delete({
        where: {
          id: existing.id
        }
      });

      // Decrement stats safely (min 0)
      const fStat = await tx.userStats.findUnique({ where: { userId: followerId } });
      if (fStat) {
        await tx.userStats.update({
          where: { userId: followerId },
          data: { following_count: Math.max(0, fStat.following_count - 1) }
        });
      }

      const tStat = await tx.userStats.findUnique({ where: { userId: targetUserId } });
      if (tStat) {
        await tx.userStats.update({
          where: { userId: targetUserId },
          data: { followers_count: Math.max(0, tStat.followers_count - 1) }
        });
      }
    }
  });

  // Fetch updated list of following IDs
  const follows = await prisma.userFollow.findMany({
    where: { followerId },
    select: { followingId: true }
  });

  const followingIds = follows.map(f => f.followingId);

  return res.status(200).json({
    success: true,
    message: "Successfully unfollowed user",
    followingIds
  });
});

export default {
  getMyBasicInfo,
  updateMyBasicInfo,
  updateProfilePicture,
  updateMinimalProfile,
  updateCoverBanner,
  followUser,
  unfollowUser
};

