import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { Profile } from "../models/Profile.js";
import { ApiError, asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// ============ REGISTER ============
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, country = "IN" } = req.body;
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

  // Determine currency and payment gateway based on country
  const currencyMap = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD" };
  const currency = currencyMap[country] || "INR";
  const paymentGateway = country === "IN" ? "razorpay" : "none";

  // Create User
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    country: country.toUpperCase(),
    currency,
    paymentGateway,
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

  // Trigger Welcome Notification
  await createNotification({
    recipient: user._id,
    type: "success",
    title: "Welcome to SuviX! 🎉",
    message: "We're excited to have you on board. Complete your profile to get started.",
    link: "/editor-profile",
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

  // Check if user is banned
  if (user.isBanned) {
    return res.status(403).json({
      success: false,
      isBanned: true,
      message: "Your account has been suspended.",
      banReason: user.banReason || "Violation of terms of service",
      bannedAt: user.bannedAt,
    });
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
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
      profileCompletionPercent: user.profileCompletionPercent,
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

// ============ FORGOT PASSWORD ============
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration attacks
  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  }

  // Check if user is OAuth-only (no password)
  if (user.googleId && !user.password) {
    logger.info(`Password reset attempted for OAuth-only user: ${email}`);
    return res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  }

  // Generate reset token (32 bytes = 64 hex chars)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token before storing (so even DB breach doesn't expose tokens)
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token and expiry (1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendURL}/reset-password/${resetToken}`;

  try {
    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    logger.info(`Password reset email sent to: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    // Reset the token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Failed to send password reset email to ${user.email}:`, error);
    throw new ApiError(500, "Failed to send password reset email. Please try again later.");
  }
});

// ============ RESET PASSWORD ============
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Validate inputs
  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirm password are required.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  // Hash the token from URL to compare with stored hash
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid token and not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new ApiError(400, "Password reset link is invalid or has expired.");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password and clear reset token
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset successful for user: ${user.email}`);

  // Send success notification
  await createNotification({
    recipient: user._id,
    type: "success",
    title: "Password Changed Successfully 🔐",
    message: "Your password has been updated. If you didn't make this change, please contact support immediately.",
    link: "/login",
  });

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully. Please login with your new password.",
  });
});
