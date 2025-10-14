import { Profile } from "../models/Profile.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// -------------------- GET PROFILE --------------------
export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

    const profile = await Profile.findOne({ user: userId })
      .populate("user", "name email role profilePicture")
      .populate("portfolio");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      message: "Profile fetched successfully.",
      profile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// -------------------- UPDATE PROFILE --------------------
export const updateProfile = async (req, res) => {
  try {
    const { about, experience, contactEmail, country, skills, languages } =
      req.body;

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile)
      return res.status(404).json({ message: "Profile not found." });

    // --- Update basic text fields ---
    if (about !== undefined) profile.about = about;
    if (experience !== undefined) profile.experience = experience;
    if (contactEmail !== undefined) profile.contactEmail = contactEmail;
    if (country !== undefined) profile.location.country = country;

    // --- Update skills & languages ---
    if (skills !== undefined) {
      profile.skills =
        typeof skills === "string"
          ? skills.split(",").map((s) => s.trim())
          : skills;
    }

    if (languages !== undefined) {
      profile.languages =
        typeof languages === "string"
          ? languages.split(",").map((l) => l.trim())
          : languages;
    }

    // --- Update certifications (optional) ---
    if (req.files?.certifications?.length > 0) {
      const uploadedCerts = [];
      for (const file of req.files.certifications) {
        const result = await uploadToCloudinary(file.buffer, "certifications");
        uploadedCerts.push({
          title: file.originalname.split(".")[0],
          image: result.url,
        });
      }

      // Append new certifications instead of replacing
      profile.certifications = [
        ...(profile.certifications || []),
        ...uploadedCerts,
      ];
    }

    // --- Portfolio handled separately ---
    await profile.save();

    // --- Mark profile as completed in User DB ---
    await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });

    // --- Return populated profile ---
    const populatedProfile = await Profile.findOne({ user: req.user._id })
      .populate("user", "name email role profileCompleted profilePicture")
      .populate("portfolio");

    res.status(200).json({
      message: "Profile updated successfully.",
      profile: populatedProfile,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      message: "Server error while updating profile.",
      error: error.message,
    });
  }
};
