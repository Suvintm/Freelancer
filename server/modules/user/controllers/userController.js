import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";

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
        },
      },
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
    },
  });
});

// @desc    Update current authenticated user basic info
// @route   PATCH /api/user/me
// @access  Private
export const updateMyBasicInfo = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { name, username, phone, country } = req.body;

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
      updated_at: new Date(),
    },
    select: {
      name: true,
      username: true,
      phone: true,
      location_country: true,
      profile_picture: true,
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
    },
  });
});
