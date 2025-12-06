import { Profile } from "../models/Profile.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// ============ GET PROFILE ============
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user?.id;

  const profile = await Profile.findOne({ user: userId })
    .populate("user", "name email role profilePicture")
    .populate("portfolio");

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    profile,
  });
});

// ============ UPDATE PROFILE ============
export const updateProfile = asyncHandler(async (req, res) => {
  const { about, experience, contactEmail, country, skills, languages } = req.body;

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
