import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { Profile } from "../models/Profile.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// ============ REGISTER ============
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  let profilePicture;

  // Check for existing user
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(400, "Email already registered.");
  }

  const existingName = await User.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") }
  });
  if (existingName) {
    throw new ApiError(400, "This name already exists, choose another one.");
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Upload profile picture if provided
  if (req.file) {
    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "Profile picture must be less than 5MB.");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed.");
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, "profiles");
    profilePicture = uploadResult.url;
  }

  // Create User
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    profilePicture,
  });

  // Auto-create Profile document
  await Profile.create({
    user: user._id,
    about: "",
    portfolio: [],
    skills: [],
    languages: [],
    experience: "",
    certifications: [],
    contactEmail: "",
    location: { country: "" },
  });

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  logger.info(`New user registered: ${user.email} (${user.role})`);

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      profilePicture: user.profilePicture,
    },
    token,
  });
});

// ============ LOGIN ============
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  logger.info(`User logged in: ${user.email}`);

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      profilePicture: user.profilePicture,
    },
    token,
  });
});

// ============ LOGOUT ============
export const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: "Logout successful. Please remove token from client.",
  });
});

// ============ GET CURRENT USER ============
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ============ UPDATE PROFILE PICTURE ============
export const updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded.");
  }

  // Validate file size (max 5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, "Profile picture must be less than 5MB.");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed.");
  }

  const uploadResult = await uploadToCloudinary(req.file.buffer, "profiles");
  const profilePicture = uploadResult.url;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture },
    { new: true }
  ).select("-password");

  logger.info(`Profile picture updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    user,
  });
});
