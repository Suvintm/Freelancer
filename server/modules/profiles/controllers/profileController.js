import prisma from "../../../config/prisma.js";
import { Portfolio } from "../models/Portfolio.js";
import { Reel } from "../../reels/models/Reel.js";
import { ProfileVisit } from "../models/ProfileVisit.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { calculateProfileCompletion } from "../utils/profileUtils.js";
import logger from "../../../utils/logger.js";
import redis from "../../../config/redisClient.js";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";

/**
 * Helper to map profile for frontend compatibility
 */
const mapProfile = (user, profile, portfolioCount = 0) => {
  if (!user) return null;
  const ratingStats = profile?.rating_stats ? (typeof profile.rating_stats === 'string' ? JSON.parse(profile.rating_stats) : profile.rating_stats) : { totalReviews: 0, averageRating: 0 };
  const suvixScore = profile?.suvix_score ? (typeof profile.suvix_score === 'string' ? JSON.parse(profile.suvix_score) : profile.suvix_score) : { total: 0 };

  return {
    ...profile,
    user: {
      ...user,
      id: user.id,
      profilePicture: user.profile_picture,
      isVerified: user.kyc_status === 'verified',
      followers: user.followers || [],
      following: user.following || [],
      followSettings: {
        manualApproval: user.follow_manual_approval || false
      },
      aiProfile: user.ai_profile || {
        aiKeywords: [],
        aiDescription: "",
        videoStyles: [],
        softwareProficiency: {}
      }
    },
    id: user.id,
    portfolioCount,
    profilePicture: user.profile_picture,
    isVerified: user.kyc_status === 'verified',
    skills: profile?.skills || [],
    languages: profile?.languages || [],
    softwares: profile?.softwares || [],
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
        tiktok: profile?.social_tiktok || "",
        twitter: profile?.social_twitter || "",
        linkedin: profile?.social_linkedin || "",
        website: profile?.social_website || ""
    },
    ratingStats,
    suvixScore
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
  const { name, bio, about, experience, location } = req.body;

  // Since we use multipart/form-data, some fields may arrive as strings
  let { skills, languages, softwares, socialLinks, aiProfile, followSettings } = req.body;

  // Robust parsing for multipart/form-data strings
  try {
    if (typeof skills === "string") skills = skills.split(",").map(s => s.trim()).filter(Boolean);
    if (typeof languages === "string") languages = languages.split(",").map(l => l.trim()).filter(Boolean);
    if (typeof softwares === "string") softwares = JSON.parse(softwares);
    if (typeof socialLinks === "string") socialLinks = JSON.parse(socialLinks);
    if (typeof aiProfile === "string") aiProfile = JSON.parse(aiProfile);
    if (typeof followSettings === "string") followSettings = JSON.parse(followSettings);
  } catch (err) {
    console.error("Error parsing profile update fields:", err);
  }

  const skillsArr = Array.isArray(skills) ? skills : [];
  const languagesArr = Array.isArray(languages) ? languages : [];
  const softwaresArr = Array.isArray(softwares) ? softwares : [];

  let profilePicture = undefined;
  if (req.files?.profile_picture?.[0]) {
    try {
      const result = await uploadToCloudinary(req.files.profile_picture[0].buffer, "profiles");
      profilePicture = result.url;
    } catch (err) {
      logger.error("Profile picture upload failed:", err);
    }
  }

  // Update User (PostgreSQL)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name !== undefined ? name : undefined,
      bio: bio !== undefined ? bio : undefined,
      profile_picture: profilePicture || undefined,
      follow_manual_approval: followSettings?.manualApproval !== undefined ? followSettings.manualApproval : undefined,
      ai_profile: aiProfile || undefined
    }
  });

  // Update Profile (PostgreSQL)
  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      about: about || "",
      skills: skillsArr,
      languages: languagesArr,
      softwares: softwaresArr,
      experience: experience || "",
      social_instagram: socialLinks?.instagram || "",
      social_youtube: socialLinks?.youtube || "",
      social_tiktok: socialLinks?.tiktok || "",
      social_twitter: socialLinks?.twitter || "",
      social_linkedin: socialLinks?.linkedin || "",
      social_website: socialLinks?.website || "",
      location_country: location?.country || ""
    },
    update: {
      about: about !== undefined ? about : undefined,
      skills: skillsArr.length > 0 ? skillsArr : undefined,
      languages: languagesArr.length > 0 ? languagesArr : undefined,
      softwares: softwaresArr.length > 0 ? softwaresArr : undefined,
      experience: experience !== undefined ? experience : undefined,
      social_instagram: socialLinks?.instagram !== undefined ? socialLinks.instagram : undefined,
      social_youtube: socialLinks?.youtube !== undefined ? socialLinks.youtube : undefined,
      social_tiktok: socialLinks?.tiktok !== undefined ? socialLinks.tiktok : undefined,
      social_twitter: socialLinks?.twitter !== undefined ? socialLinks.twitter : undefined,
      social_linkedin: socialLinks?.linkedin !== undefined ? socialLinks.linkedin : undefined,
      social_website: socialLinks?.website !== undefined ? socialLinks.website : undefined,
      location_country: location?.country !== undefined ? location.country : undefined
    }
  });

  // Recalculate completion
  const portfolioCount = await Portfolio.countDocuments({ user: userId });
  const completionData = calculateProfileCompletion(updatedUser, updatedProfile, portfolioCount);
  const percent = completionData.percent;
  
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
  
    const completion = calculateProfileCompletion(user, profile, portfolioCount);
  
    res.json({
      success: true,
      completion: {
        ...completion,
        isCompleted: completion.percent >= 100
      },
      // Added for absolute legacy compatibility
      percent: completion.percent 
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
