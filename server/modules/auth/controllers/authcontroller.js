import prisma from "../../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import logger from "../../../utils/logger.js";
import { createNotification } from "../../connectivity/controllers/notificationController.js";
import { sendPasswordResetEmail, sendOTPEmail } from "../../../utils/emailService.js";
import { validateIndianMobile } from "../../../services/otpService.js";


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// ============ REGISTER ============
export const register = asyncHandler(async (req, res) => {
  logger.info("Registration Request Body:", req.body);
  const { name, email, password, role, country = "IN", phone } = req.body;
  let profilePicture;

  // Check for existing user
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });
  if (existingEmail) {
    throw new ApiError(400, "Email already registered.");
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Upload profile picture if provided
  if (req.file) {
    if (req.file.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "Profile picture must be less than 5MB.");
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed.");
    }
    const uploadResult = await uploadToCloudinary(req.file.buffer, "profiles");
    profilePicture = uploadResult.url;
  }

  const isIndia = country.toUpperCase() === "IN";
  const phoneValue = typeof phone === 'string' ? phone : "";
  const mobile = isIndia ? validateIndianMobile(phoneValue) : null;

  if (isIndia && !mobile) {
    throw new ApiError(400, "A valid Indian mobile number is required for registration.");
  }

  // DIRECT CREATION FOR TESTING (As per current logic in file)
  const currencyMap = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD" };
  const currency = currencyMap[country] || "INR";

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashedPassword,
      role: role || 'editor',
      phone: mobile,
      is_phone_verified: !!mobile,
      country: country.toUpperCase(),
      currency,
      profile_picture: profilePicture || "",
    }
  });

  await prisma.userProfile.create({
    data: {
      user_id: user.id,
      about: "",
      skills: [],
      languages: [],
      experience: "",
    }
  });

  await createNotification({
    recipient: user.id,
    type: "success",
    title: "Welcome to SuviX! 🎉",
    message: "We're excited to have you on board. Complete your profile to get started.",
    link: "/editor-profile",
  });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profile_picture,
    },
    token
  });
});

// ============ LOGIN ============
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.is_banned) {
    return res.status(403).json({
      success: false,
      isBanned: true,
      message: "Your account has been suspended.",
      banReason: user.ban_reason || "Violation of terms of service",
      bannedAt: user.banned_at,
    });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profile_completed,
      profilePicture: user.profile_picture,
      isVerified: user.is_verified,
      kycStatus: user.kyc_status,
      profileCompletionPercent: user.profile_completion_percent,
    },
    token,
  });
});

// ============ VERIFY OTP ============
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, phone, otp } = req.body;

  if (!email && !phone) {
    throw new ApiError(400, "Email or Phone is required.");
  }
  if (!otp) {
    throw new ApiError(400, "OTP is required.");
  }

  const otpIn = otp.trim();
  const hashedOtp = crypto.createHash("sha256").update(otpIn).digest("hex");

  const otpDoc = await prisma.otp.findFirst({
    where: phone ? { phone: phone.trim() } : { email: email.toLowerCase().trim() },
    orderBy: { created_at: 'desc' }
  });

  if (!otpDoc) {
    throw new ApiError(400, "Invalid or expired verification code.");
  }

  if (otpDoc.attempts >= 5) {
    throw new ApiError(403, "Too many failed attempts. Please request a new code.");
  }

  const isExpired = Date.now() - new Date(otpDoc.created_at).getTime() > 600000;
  if (isExpired) {
    await prisma.otp.delete({ where: { id: otpDoc.id } });
    throw new ApiError(400, "Verification code has expired.");
  }

  if (otpDoc.otp !== hashedOtp) {
    await prisma.otp.update({
      where: { id: otpDoc.id },
      data: { attempts: { increment: 1 } }
    });
    const remaining = 4 - otpDoc.attempts;
    throw new ApiError(400, `Invalid code. ${remaining} attempts remaining.`);
  }

  let user;

  if (otpDoc.type === "register") {
    const regData = otpDoc.registration_data;
    const currencyMap = { IN: "INR", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD" };
    const currency = currencyMap[regData.country] || "INR";

    user = await prisma.user.create({
      data: {
        name: regData.name,
        email: regData.email,
        password_hash: regData.password,
        role: regData.role || 'editor',
        phone: otpDoc.phone,
        is_phone_verified: !!otpDoc.phone,
        country: regData.country.toUpperCase(),
        currency,
        profile_picture: regData.profilePicture || "",
      }
    });

    await prisma.userProfile.create({
      data: {
        user_id: user.id,
        about: "",
        skills: [],
        languages: [],
        experience: "",
      }
    });

    await createNotification({
      recipient: user.id,
      type: "success",
      title: "Welcome to SuviX! 🎉",
      message: "We're excited to have you on board. Complete your profile to get started.",
      link: "/editor-profile",
    });

    logger.info(`New user verified and created: ${user.email}`);
  } else {
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
  }

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await prisma.otp.delete({ where: { id: otpDoc.id } });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    success: true,
    message: "Verification successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profile_completed,
      profilePicture: user.profile_picture,
      isVerified: user.is_verified,
      kycStatus: user.kyc_status,
      profileCompletionPercent: user.profile_completion_percent,
    },
    token,
  });
});

// ============ RESEND OTP ============
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    throw new ApiError(400, "Email or Phone is required.");
  }

  const query = phone ? { phone: phone.trim() } : { email: email.toLowerCase().trim() };
  
  const existingOtpDoc = await prisma.otp.findFirst({
    where: query,
    orderBy: { created_at: 'desc' }
  });

  if (!existingOtpDoc) {
    throw new ApiError(400, "Session expired. Please register or login again.");
  }

  const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(newOtpCode).digest("hex");
  
  await prisma.otp.update({
    where: { id: existingOtpDoc.id },
    data: {
      otp: hashedOtp,
      attempts: 0,
      created_at: new Date()
    }
  });

  let name = "User";
  if (existingOtpDoc.type === "register") {
    name = existingOtpDoc.registration_data.name;
  } else {
    const userDoc = await prisma.user.findUnique({ where: query });
    if (userDoc) name = userDoc.name;
  }

  await sendOTPEmail(existingOtpDoc.email, name, newOtpCode);
  logger.info(`Email OTP Resent to: ${existingOtpDoc.email}`);

  res.status(200).json({
    success: true,
    message: "A new verification code has been sent to your email.",
    otpMethod: "Email"
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
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

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
  if (req.file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, "Profile picture must be less than 5MB.");
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ApiError(400, "Only JPEG, PNG, WebP, and GIF images are allowed.");
  }

  const uploadResult = await uploadToCloudinary(req.file.buffer, "profiles");
  const profilePicture = uploadResult.url;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { profile_picture: profilePicture }
  });

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

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  }

  if (user.google_id && !user.password_hash) {
    logger.info(`Password reset attempted for OAuth-only user: ${email}`);
    return res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_reset_token: hashedToken,
      password_reset_expires: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendURL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    logger.info(`Password reset email sent to: ${user.email}`);
    res.status(200).json({
      success: true,
      message: "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: null,
        password_reset_expires: null
      }
    });
    logger.error(`Failed to send password reset email to ${user.email}:`, error);
    throw new ApiError(500, "Failed to send password reset email. Please try again later.");
  }
});

// ============ RESET PASSWORD ============
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirm password are required.");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      password_reset_token: hashedToken,
      password_reset_expires: { gt: new Date() },
    }
  });

  if (!user) {
    throw new ApiError(400, "Password reset link is invalid or has expired.");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null
    }
  });

  logger.info(`Password reset successful for user: ${user.email}`);

  await createNotification({
    recipient: user.id,
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
