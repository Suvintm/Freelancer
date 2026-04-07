import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";
import { registerFullUser as registerService } from "../services/registerService.js";
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { redis } from "../../../middleware/rateLimiter.js";
import crypto from "crypto";
import logger from "../../../utils/logger.js";

/**
 * HELPER: Resolve Primary Professional Identity
 * Merges system roles with professional categories to provide a clear UI identity.
 */
const resolvePrimaryIdentity = (user) => {
  if (!user.profile || !user.profile.categoryId) {
    return {
      group: 'CLIENT',
      category: 'General',
      subCategory: 'Member',
      is_onboarded: user.is_onboarded
    };
  }

  // Use the new locked category field
  const cat = user.profile.category;
  // Fallback to first mapping for sub-category display
  const primaryMapping = user.profile.roles?.[0];
  const subCat = primaryMapping?.subCategory;

  return {
    group: cat?.roleGroup || 'CLIENT',
    category: cat?.name || 'General',
    subCategory: subCat?.name || 'Member',
    categoryId: cat?.id || user.profile.categoryId,
    subCategoryId: subCat?.id,
    is_onboarded: user.is_onboarded
  };
};

/**
 * Cookie Options for Production Security
 */
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matches refresh token expiry)
};

// ============ REFRESH TOKEN ROTATION ============
export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Refresh token required");

    // 1. Verify Token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new ApiError(401, "Invalid or expired refresh token");

    // 2. Check if token is in Redis (Rotation Check)
    const redisKey = `refresh_token:${refreshToken}`;
    const isValid = await redis.get(redisKey);
    if (!isValid) {
        // TOKEN REUSE DETECTED! (Security breach attempt)
        // In a strictly advanced setup, we might invalidate all user sessions here.
        throw new ApiError(401, "Token has already been used or is invalid");
    }

    // 3. One-time use: Revoke the old token
    await redis.del(redisKey);

    // 4. Fetch User with profile
    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { profile: true }
    });
    if (!user) throw new ApiError(404, "User no longer exists");

    // 5. Issue NEW pair
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    // 6. Store NEW refresh token in Redis
    await redis.set(`refresh_token:${newRefreshToken}`, user.id, "EX", 7 * 24 * 60 * 60);

    // 7. Send Response
    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    res.status(200).json({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken // Also send back for mobile apps
    });
});

// ============ LOGIN ============
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { 
      profile: {
        include: { roles: { include: { subCategory: { include: { category: true } } } } }
      }
    }
  });

  if (!user || user.auth_provider === "google") {
    throw new ApiError(401, "Invalid credentials.");
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Store refresh token in Redis for rotation
  await redis.set(`refresh_token:${refreshToken}`, user.id, "EX", 7 * 24 * 60 * 60);

  // Set Secure Cookie for Web
  res.cookie("refreshToken", refreshToken, cookieOptions);

  const primaryIdentity = resolvePrimaryIdentity(user);

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.profile?.name,
      username: user.profile?.username,
      email: user.email,
      role: primaryIdentity.group.toLowerCase(), // Return professional group as 'role'
      primaryRole: primaryIdentity, // detailed metadata
      profilePicture: user.profile?.profile_picture,
      location: user.profile?.location_country,
      isOnboarded: user.is_onboarded
    },
    token: accessToken,
    refreshToken // For Mobile Apps
  });
});

export const getRoles = asyncHandler(async (req, res) => {
    const categories = await prisma.roleCategory.findMany({
        include: {
            subCategories: true
        },
        orderBy: {
            name: "asc"
        }
    });

    res.status(200).json({
        success: true,
        categories
    });
});

// ============ ATOMIC REGISTER ============
export const registerFull = asyncHandler(async (req, res) => {
  const { 
    fullName, username, email, password, phone, 
    motherTongue, country, categoryId, roleSubCategoryIds 
  } = req.body;

  let parsedSubIds = roleSubCategoryIds;
  if (typeof roleSubCategoryIds === "string" && roleSubCategoryIds) {
    try { parsedSubIds = JSON.parse(roleSubCategoryIds); } catch (e) { parsedSubIds = [roleSubCategoryIds]; }
  }

  // SLUG RESOLUTION (Advanced Compatibility)
  // If the frontend sends slugs instead of IDs, we resolve them here
  let finalSubIds = parsedSubIds || [];
  if (finalSubIds.length > 0 && !finalSubIds[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      const dbSubs = await prisma.roleSubCategory.findMany({
          where: { slug: { in: finalSubIds } },
          select: { id: true }
      });
      finalSubIds = dbSubs.map(s => s.id);
  }

  const userData = {
    fullName, username, email, password, phone,
    motherTongue, country, categoryId,
    roleSubCategoryIds: finalSubIds,
    profilePictureBuffer: req.file ? req.file.buffer : null
  };

  const userWithProfile = await registerService(userData);

  const accessToken = generateAccessToken({ id: userWithProfile.id, role: userWithProfile.role });
  const refreshToken = generateRefreshToken({ id: userWithProfile.id });

  // Store refresh token in Redis
  await redis.set(`refresh_token:${refreshToken}`, userWithProfile.id, "EX", 7 * 24 * 60 * 60);

  // Set Cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  const primaryIdentity = resolvePrimaryIdentity(userWithProfile);
  
  res.status(201).json({
    success: true,
    message: "Welcome to SuviX!",
    user: {
      id: userWithProfile.id,
      name: userWithProfile.profile.name,
      username: userWithProfile.profile.username,
      email: userWithProfile.email,
      role: primaryIdentity.group.toLowerCase(), // Consistent with login
      profilePicture: userWithProfile.profile.profile_picture,
      primaryRole: primaryIdentity,
      isOnboarded: true,
    },
    token: accessToken,
    refreshToken
  });
});

// ============ LOGOUT ============
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    // Revoke token if it exists
    if (refreshToken) {
        await redis.del(`refresh_token:${refreshToken}`);
    }

    // Clear Browser Cookies
    res.clearCookie("refreshToken", cookieOptions);
    
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

// ============ ME (PROFILE) ============
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { 
        profile: {
            include: { 
                category: true,
                roles: { include: { subCategory: true } } 
            }
        } 
    }
  });

  if (!user) throw new ApiError(404, "User session invalid.");
  
  const primaryIdentity = resolvePrimaryIdentity(user);
  
  const responseUser = {
      id: user.id,
      name: user.profile?.name,
      username: user.profile?.username,
      email: user.email,
      role: primaryIdentity.group.toLowerCase(),
      primaryRole: primaryIdentity,
      profilePicture: user.profile?.profile_picture,
      isOnboarded: user.is_onboarded
  };

  res.status(200).json({ success: true, user: responseUser });
});

// ============ CHECK USERNAME ============
export const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const exists = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase().trim() }
  });
  res.status(200).json({ success: true, available: !exists });
});
export const validateSignup = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    throw new ApiError(400, "Email and username are required for validation");
  }

  // Check Email (User table)
  const emailExists = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (emailExists) {
    throw new ApiError(409, "This email is already registered. Please log in instead.");
  }
  
  // Check Username (UserProfile table)
  const usernameExists = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase().trim() }
  });

  if (usernameExists) {
    throw new ApiError(409, "This username is already taken. Try another!");
  }

  res.status(200).json({ success: true, available: true });
});
