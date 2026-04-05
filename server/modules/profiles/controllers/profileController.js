import prisma from "../../../config/prisma.js";
import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../../reels/models/Reel.js";
import { ProfileVisit } from "../models/ProfileVisit.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { calculateProfileCompletion } from "../utils/profileUtils.js";
import logger from "../../../utils/logger.js";
import redis from "../../../config/redisClient.js";

/**
 * Helper to map profile for frontend compatibility
 */
const mapProfile = (user, profile, portfolioCount = 0) => {
  if (!user) return null;
  return {
    ...user,
    id: user.id,
    portfolioCount,
    profilePicture: user.profile_picture,
    isVerified: user.is_verified,
    kycStatus: user.kyc_status,
    profileCompleted: user.profile_completed,
    completionPercentage: user.profile_completion_percent,
    skills: profile?.skills || [],
    languages: profile?.languages || [],
    experience: profile?.experience || "",
    about: profile?.about || "",
    location: {
        country: profile?.location_country || "",
        state: user.location?.state || "",
        city: user.location?.city || ""
    },
    socialLinks: {
        instagram: profile?.social_instagram || "",
        youtube: profile?.social_youtube || "",
        twitter: profile?.social_twitter || "",
        linkedin: profile?.social_linkedin || ""
    },
    ratingStats: profile?.rating_stats || { averageRating: 0, totalReviews: 0 },
  };
};

/**
 * Get Profile (Unified for me and others)
 * GET /api/profile
 * GET /api/profile/me
 * GET /api/profile/:userId
 */
export const getProfile = asyncHandler(async (req, res) => {
  const targetId = req.params.userId || req.user?.id;

  if (!targetId) {
    throw new ApiError(400, "User ID is required");
  }

  const [user, profile, portfolioCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: targetId },
      include: { location: true }
    }),
    prisma.userProfile.findUnique({ where: { user_id: targetId } }),
    Portfolio.countDocuments({ user: targetId })
  ]);

  if (!user) throw new ApiError(404, "User not found");

  // Record visit if looking at someone else's profile
  if (req.user?.id && req.user.id !== user.id) {
    recordProfileVisit(user.id, req.user.id).catch(err => logger.error("Visit log failed", err));
  }

  res.json({
    success: true,
    profile: mapProfile(user, profile, portfolioCount),
  });
});

/**
 * Update Profile
 * PATCH /api/profile/update
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, bio, about, skills, languages, experience, location, socialLinks } = req.body;

  // Update User (PostgreSQL)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name !== undefined ? name : undefined,
      bio: bio !== undefined ? bio : undefined,
    }
  });

  // Update Profile (PostgreSQL)
  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      about: about || "",
      skills: Array.isArray(skills) ? skills : [],
      languages: Array.isArray(languages) ? languages : [],
      experience: experience || "",
      social_instagram: socialLinks?.instagram || "",
      social_youtube: socialLinks?.youtube || "",
      location_country: location?.country || ""
    },
    update: {
      about: about !== undefined ? about : undefined,
      skills: Array.isArray(skills) ? skills : undefined,
      languages: Array.isArray(languages) ? languages : undefined,
      experience: experience !== undefined ? experience : undefined,
      social_instagram: socialLinks?.instagram !== undefined ? socialLinks.instagram : undefined,
      social_youtube: socialLinks?.youtube !== undefined ? socialLinks.youtube : undefined,
      location_country: location?.country !== undefined ? location.country : undefined
    }
  });

  // Recalculate completion
  const portfolioCount = await Portfolio.countDocuments({ user: userId });
  const percent = calculateProfileCompletion(updatedUser, updatedProfile, portfolioCount);
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
        profile_completion_percent: percent,
        profile_completed: percent >= 100
    }
  });

  // Invalidate cache
  if (updatedUser.username) {
    await redis.del(`profile:${updatedUser.username}`);
  }

  res.json({
    success: true,
    message: "Profile updated successfully",
    profile: mapProfile(updatedUser, updatedProfile, portfolioCount),
  });
});

/**
 * Get Profile Completion Status
 * GET /api/profile/completion-status
 */
export const getProfileCompletionStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
  
    const [user, profile, portfolioCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userProfile.findUnique({ where: { user_id: userId } }),
      Portfolio.countDocuments({ user: userId })
    ]);
  
    if (!user) throw new ApiError(404, "User not found");
  
    const percentage = calculateProfileCompletion(user, profile, portfolioCount);
  
    res.json({
      success: true,
      completion: {
        percentage,
        isCompleted: percentage >= 100
      }
    });
  });

/**
 * Record Profile Visit (MongoDB)
 */
async function recordProfileVisit(ownerId, visitorId) {
    if (!ownerId) return;
    if (visitorId && visitorId === ownerId) return;

    let visitorData = null;
    if (visitorId) {
        const vUser = await prisma.user.findUnique({
            where: { id: visitorId },
            select: { name: true, profile_picture: true, role: true }
        });
        if (vUser) {
            visitorData = {
                visitor: visitorId,
                visitorName: vUser.name,
                visitorPicture: vUser.profile_picture,
                visitorRole: vUser.role
            };
        }
    }

    await ProfileVisit.recordVisit({
        profileOwner: ownerId,
        ...visitorData,
        source: "direct"
    });
}

/**
 * Get Profile Stats
 * GET /api/profile/stats
 */
export const getProfileStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [visitStats, portfolioCount, reelsCount] = await Promise.all([
    ProfileVisit.getStats(userId),
    Portfolio.countDocuments({ user: userId }),
    Reel.countDocuments({ editor: userId })
  ]);

  res.json({
    success: true,
    stats: {
        ...visitStats,
        portfolioCount,
        reelsCount
    }
  });
});

export default { getProfile, updateProfile, getProfileStats, getProfileCompletionStatus };
