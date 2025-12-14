import { Profile } from "../models/Profile.js";
import User from "../models/User.js";
import { Reel } from "../models/Reel.js";
import { Portfolio } from "../models/Portfolio.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";
import fs from "fs";

// ============ GET PROFILE ============
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user?.id;

  let profile = await Profile.findOne({ user: userId })
    .populate("user", "name email role profilePicture")
    .lean();

  if (!profile) {
    throw new ApiError(404, "Profile not found");
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
  const items = [
    {
      id: "profilePicture",
      label: "Profile Photo",
      weight: 10,
      complete: user?.profilePicture && !user.profilePicture.includes("flaticon"),
    },
    {
      id: "about",
      label: "Bio (50+ chars)",
      weight: 15,
      complete: profile?.about && profile.about.length >= 50,
    },
    {
      id: "skills",
      label: "Skills (3+)",
      weight: 15,
      complete: profile?.skills && profile.skills.length >= 3,
    },
    {
      id: "portfolio",
      label: "Portfolio (2+)",
      weight: 15,
      complete: portfolioCount >= 2,
    },
    {
      id: "experience",
      label: "Experience",
      weight: 10,
      complete: profile?.experience && profile.experience.length > 0,
    },
    {
      id: "languages",
      label: "Languages (1+)",
      weight: 5,
      complete: profile?.languages && profile.languages.length >= 1,
    },
    {
      id: "socialLinks",
      label: "Social Links (2+)",
      weight: 10,
      complete: (() => {
        if (!profile?.socialLinks) return false;
        const links = Object.values(profile.socialLinks).filter(v => v && v.trim().length > 0);
        return links.length >= 2;
      })(),
    },
    {
      id: "kycVerified",
      label: "Bank Account (KYC)",
      weight: 15,
      complete: user?.kycStatus === "verified",
    },
    {
      id: "hourlyRate",
      label: "Hourly Rate",
      weight: 5,
      complete: profile?.hourlyRate && profile.hourlyRate.min > 0,
    },
  ];
  
  // Calculate percentage
  const percent = items.reduce((acc, item) => acc + (item.complete ? item.weight : 0), 0);
  
  // Update user's profileCompletionPercent in database
  await User.findByIdAndUpdate(userId, { 
    profileCompletionPercent: percent,
    profileCompleted: percent >= 80,
  });
  
  res.status(200).json({
    success: true,
    percent,
    breakdown: items.map(item => ({
      id: item.id,
      label: item.label,
      weight: item.weight,
      complete: item.complete,
    })),
    message: percent >= 100 
      ? "Profile complete! Maximum engagement unlocked."
      : percent >= 80 
        ? "Great progress! Complete 100% for maximum engagement."
        : "Complete at least 80% to get noticed by clients.",
  });
});

