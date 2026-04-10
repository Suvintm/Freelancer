import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import storageService from "../../../utils/storageService.js";

// @desc    Get current authenticated user basic info
// @route   GET /api/user/me
// @access  Private
export const getMyBasicInfo = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          username: true,
          name: true,
          profile_picture: true,
          phone: true,
          location_country: true,
          bio: true,
        },
      },
      youtubeProfiles: {
        include: {
          videos: {
            orderBy: { published_at: 'desc' },
            take: 20
          }
        }
      }
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: req.user.role,
      systemRole: req.user.systemRole || user.role,
      isOnboarded: user.is_onboarded,
      isVerified: user.is_verified,
      name: user.profile?.name || "",
      username: user.profile?.username || "",
      profilePicture: user.profile?.profile_picture || "",
      phone: user.profile?.phone || "",
      country: user.profile?.location_country || "",
      bio: user.profile?.bio || "",
      youtubeProfile: user.youtubeProfiles,
      youtubeVideos: user.youtubeProfiles?.videos || [],
    },
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

  return res.status(200).json({
    success: true,
    message: "User profile updated",
    user: {
      id: userId,
      role: req.user.role,
      name: updated.name || "",
      username: updated.username || "",
      phone: updated.phone || "",
      country: updated.location_country || "",
      profilePicture: updated.profile_picture || "",
      bio: updated.bio || "",
    },
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

  // 💾 Standardized Storage Upload (Universal Service)
  const result = await storageService.uploadBuffer(req.file.buffer, "avatars", {
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" }
    ]
  });

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      profile_picture: result.secure_url,
      updated_at: new Date(),
    },
  });

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
 * Handles the 'Social Data Gap' for Google/OAuth users.
 */
export const updateMinimalProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { username, phone } = req.body;

  if (!username || !phone) {
    throw new ApiError(400, "Username and phone number are required for onboarding.");
  }

  const normalizedUsername = username.toLowerCase().trim();

  // 1. Check if username is already taken by someone else
  const existing = await prisma.userProfile.findFirst({
    where: { 
      username: normalizedUsername,
      NOT: { userId }
    }
  });

  if (existing) {
    throw new ApiError(409, "This username is already claimed. Choose another one!");
  }

  // 2. Update Profile & User status atomically
  const updated = await prisma.$transaction(async (tx) => {
    // Update Profile
    const profile = await tx.userProfile.update({
      where: { userId },
      data: {
        username: normalizedUsername,
        phone: phone.trim(),
        updated_at: new Date(),
      }
    });

    // Mark user as onboarded
    await tx.user.update({
      where: { id: userId },
      data: { is_onboarded: true }
    });

    return profile;
  });

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    username: updated.username,
    phone: updated.phone
  });
});
