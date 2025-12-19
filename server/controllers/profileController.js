import { Profile } from "../models/Profile.js";
import User from "../models/User.js";
import { Reel } from "../models/Reel.js";
import { Portfolio } from "../models/Portfolio.js";
import { ProfileVisit } from "../models/ProfileVisit.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";
import fs from "fs";

// ============ GET PROFILE ============
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user?.id;
  const viewerId = req.user?._id?.toString() || req.user?.id;

  let profile = await Profile.findOne({ user: userId })
    .populate("user", "name email role profilePicture kycStatus")
    .lean();

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  // Record profile visit if viewer is different from profile owner
  if (viewerId && viewerId !== userId.toString()) {
    // Get viewer info for caching
    const viewer = req.user;
    const source = req.query.source || "direct";
    const referrerGig = req.query.gig || null;

    // Record detailed visit (async, don't wait)
    ProfileVisit.recordVisit({
      profileOwner: userId,
      visitor: viewer._id,
      visitorName: viewer.name || "Anonymous",
      visitorPicture: viewer.profilePicture || "",
      visitorRole: viewer.role || "guest",
      source,
      referrerGig,
    }).catch(err => logger.warn("Failed to record profile visit:", err));

    // Also increment the simple counter for backward compatibility
    await Profile.findOneAndUpdate(
      { user: userId },
      { $inc: { profileViews: 1 } }
    );
  }

  // Fetch Portfolios manually (since they might not be linked in profile array)
  const portfolios = await Portfolio.find({ user: userId }).sort({ uploadedAt: -1 });

  logger.info(`Fetching profile for user: ${userId}`);
  logger.info(`Found ${portfolios.length} portfolios for user ${userId}`);
  profile.portfolio = portfolios;

  // Fetch Reel Stats
  const reels = await Reel.find({ editor: userId, isPublished: true });
  logger.info(`Found ${reels.length} published reels for user ${userId}`);
  const totalReels = reels.length;
  const totalViews = reels.reduce((acc, reel) => acc + (reel.viewsCount || 0), 0);
  const totalLikes = reels.reduce((acc, reel) => acc + (reel.likesCount || 0), 0);

  res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    profile,
    reels, // Return reels array
    stats: {
      totalReels,
      totalViews,
      totalLikes,
    },
  });
});

// ============ UPDATE PROFILE ============
export const updateProfile = asyncHandler(async (req, res) => {
  const { 
    about, 
    experience, 
    contactEmail, 
    country, 
    skills, 
    languages,
    socialLinks,
    hourlyRate,
    availability,
    responseTime
  } = req.body;

  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) {
    throw new ApiError(404, "Profile not found.");
  }

  // Update basic text fields with sanitization
  if (about !== undefined) {
    profile.about = about.trim().substring(0, 1000); // Limit to 1000 chars
  }
  if (experience !== undefined) {
    profile.experience = experience.trim();
  }
  if (contactEmail !== undefined) {
    profile.contactEmail = contactEmail.toLowerCase().trim();
  }
  if (country !== undefined) {
    profile.location.country = country.trim().substring(0, 100);
  }

  // Update skills & languages with limits
  if (skills !== undefined) {
    const skillsArray = typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : skills;
    profile.skills = skillsArray.slice(0, 20); // Max 20 skills
  }

  if (languages !== undefined) {
    const langsArray = typeof languages === "string"
      ? languages.split(",").map((l) => l.trim()).filter(Boolean)
      : languages;
    profile.languages = langsArray.slice(0, 10); // Max 10 languages
  }

  // Update social links
  if (socialLinks !== undefined) {
    profile.socialLinks = {
      instagram: socialLinks.instagram?.trim() || '',
      youtube: socialLinks.youtube?.trim() || '',
      twitter: socialLinks.twitter?.trim() || '',
      linkedin: socialLinks.linkedin?.trim() || '',
      website: socialLinks.website?.trim() || '',
      behance: socialLinks.behance?.trim() || '',
      dribbble: socialLinks.dribbble?.trim() || '',
    };
  }

  // Update hourly rate
  if (hourlyRate !== undefined) {
    profile.hourlyRate = {
      min: Number(hourlyRate.min) || 0,
      max: Number(hourlyRate.max) || 0,
      currency: hourlyRate.currency || 'INR',
    };
  }

  // Update availability
  if (availability !== undefined) {
    profile.availability = availability;
  }

  // Update response time
  if (responseTime !== undefined) {
    profile.responseTime = responseTime;
  }

  // Handle certifications upload
  if (req.files?.certifications?.length > 0) {
    const uploadedCerts = [];

    // Limit to 10 certifications total
    const maxNewCerts = 10 - (profile.certifications?.length || 0);
    const certsToUpload = req.files.certifications.slice(0, maxNewCerts);

    for (const file of certsToUpload) {
      // Validate file size (max 5MB per cert)
      if (file.size > 5 * 1024 * 1024) {
        logger.warn(`Certification file too large: ${file.originalname}`);
        continue;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn(`Invalid certification file type: ${file.mimetype}`);
        continue;
      }

      const result = await uploadToCloudinary(file.buffer, "certifications");
      uploadedCerts.push({
        title: file.originalname.split(".")[0].substring(0, 100),
        image: result.url,
      });
    }

    profile.certifications = [
      ...(profile.certifications || []),
      ...uploadedCerts,
    ];
  }

  await profile.save();

  // Mark profile as completed if required fields are filled
  const isComplete = profile.about && profile.skills?.length > 0 &&
    profile.languages?.length > 0 && profile.location?.country;

  await User.findByIdAndUpdate(req.user._id, {
    profileCompleted: Boolean(isComplete)
  });

  // Trigger Notification
  await createNotification({
    recipient: req.user._id,
    type: "info",
    title: "Profile Updated",
    message: "Your profile has been successfully updated.",
    link: `/public-profile/${req.user._id}`,
  });

  // Return populated profile
  const populatedProfile = await Profile.findOne({ user: req.user._id })
    .populate("user", "name email role profileCompleted profilePicture")
    .populate("portfolio");

  logger.info(`Profile updated for user: ${req.user._id}`);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    profile: populatedProfile,
  });
});

// ============ GET PROFILE COMPLETION STATUS ============
export const getProfileCompletionStatus = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  
  // Fetch user and profile data
  const [user, profile] = await Promise.all([
    User.findById(userId).lean(),
    Profile.findOne({ user: userId }).lean(),
  ]);
  
  // Get portfolio count
  const portfolioCount = await Portfolio.countDocuments({ user: userId });
  
  // Define completion items with weights
  // REQUIRED fields contribute to the 80% minimum
  // OPTIONAL fields are nice-to-have for 100%
  const items = [
    {
      id: "profilePicture",
      label: "Profile Photo",
      weight: 10,
      required: true,
      section: "basic",
      complete: user?.profilePicture && !user.profilePicture.includes("flaticon"),
    },
    {
      id: "about",
      label: "Professional Bio",
      weight: 15,
      required: true,
      section: "about",
      complete: profile?.about && profile.about.length >= 50,
    },
    {
      id: "skills",
      label: "Skills (3+)",
      weight: 15,
      required: true,
      section: "skills",
      complete: profile?.skills && profile.skills.length >= 3,
    },
    {
      id: "portfolio",
      label: "Portfolio (2+)",
      weight: 15,
      required: true,
      section: "portfolio",
      complete: portfolioCount >= 2,
    },
    {
      id: "experience",
      label: "Experience",
      weight: 10,
      required: false,
      section: "experience",
      complete: profile?.experience && profile.experience.length > 0,
    },
    {
      id: "languages",
      label: "Languages",
      weight: 5,
      required: false,
      section: "languages",
      complete: profile?.languages && profile.languages.length >= 1,
    },
    {
      id: "socialLinks",
      label: "Social Links",
      weight: 10,
      required: false,
      section: "social",
      complete: (() => {
        if (!profile?.socialLinks) return false;
        const links = Object.values(profile.socialLinks).filter(v => v && v.trim().length > 0);
        return links.length >= 2;
      })(),
    },
    {
      id: "kycVerified",
      label: "Bank Account",
      weight: 15,
      required: true,
      section: "kyc",
      complete: user?.kycStatus === "verified",
    },
    {
      id: "hourlyRate",
      label: "Hourly Rate",
      weight: 5,
      required: false,
      section: "rate",
      complete: profile?.hourlyRate && profile.hourlyRate.min > 0,
    },
  ];
  
  // Calculate percentage from REQUIRED items only (5 items @ 20% each = 100%)
  const requiredItems = items.filter(i => i.required);
  const optionalItems = items.filter(i => !i.required);
  const percent = requiredItems.reduce((acc, item) => acc + (item.complete ? 20 : 0), 0);
  const optionalComplete = optionalItems.filter(i => i.complete).length;
  
  // Update user's profileCompletionPercent in database
  await User.findByIdAndUpdate(userId, { 
    profileCompletionPercent: percent,
    profileCompleted: percent >= 100,
  });
  
  res.status(200).json({
    success: true,
    percent,
    requiredCount: requiredItems.length,
    requiredComplete: requiredItems.filter(i => i.complete).length,
    optionalCount: optionalItems.length,
    optionalComplete,
    breakdown: items.map(item => ({
      id: item.id,
      label: item.label,
      weight: item.required ? 20 : 0,
      required: item.required,
      section: item.section,
      complete: item.complete,
    })),
    message: percent >= 100 
      ? "Profile complete! You're all set to receive orders."
      : `Complete ${requiredItems.length - requiredItems.filter(i => i.complete).length} more required field(s)`,
  });
});

