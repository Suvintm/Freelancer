import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken
} from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";
import { registerFullUser as registerService } from "../services/registerService.js";
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { redis } from "../../../middleware/rateLimiter.js";
import axios from "axios";

const mapGroupToAppRole = (group, systemRole) => {
  if (systemRole === "admin") return "admin";
  if (group === "CLIENT") return "client";
  if (group === "PROVIDER") return "editor";
  return "client";
};

/**
 * HELPER: Resolve Primary Professional Identity
 * Merges system roles with professional categories to provide a clear UI identity.
 */
const resolvePrimaryIdentity = (user) => {
  if (!user.profile) {
    return {
      group: 'CLIENT',
      category: 'General',
      subCategory: 'Member',
      appRole: mapGroupToAppRole('CLIENT', user.role),
      is_onboarded: user.is_onboarded
    };
  }

  const primaryMapping =
    user.profile.roles?.find((mapping) => mapping.isPrimary) ||
    user.profile.roles?.[0];
  const subCat = primaryMapping?.subCategory;
  const cat = user.profile.category || subCat?.category;

  if (!cat && !subCat) {
    return {
      group: 'CLIENT',
      category: 'General',
      subCategory: 'Member',
      appRole: mapGroupToAppRole('CLIENT', user.role),
      is_onboarded: user.is_onboarded
    };
  }

  const group = cat?.roleGroup || 'CLIENT';

  return {
    group,
    category: cat?.name || 'General',
    categorySlug: cat?.slug,
    subCategory: subCat?.name || 'Member',
    categoryId: cat?.id || user.profile.categoryId,
    subCategoryId: subCat?.id,
    subCategorySlug: subCat?.slug,
    appRole: mapGroupToAppRole(group, user.role),
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
  
  // Explicit Validation (prevents crashes and ensures consistent 400 response)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !password || !emailRegex.test(email)) {
    throw new ApiError(400, "Valid email and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { 
      profile: {
        include: { roles: { include: { subCategory: { include: { category: true } } } } }
      },
      youtubeProfiles: true
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
      displayName: user.profile?.display_name || user.profile?.name,
      username: user.profile?.username,
      email: user.email,
      role: primaryIdentity.appRole,
      primaryRole: primaryIdentity, // detailed metadata
      profilePicture: user.profile?.profile_picture,
      location: user.profile?.location_country,
      isOnboarded: user.is_onboarded,
      youtubeProfile: user.youtubeProfiles
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

export const getYouTubeChannels = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken || typeof accessToken !== "string") {
    throw new ApiError(400, "Google accessToken is required.");
  }

  let channelPayload;
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          mine: true,
          maxResults: 50,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    channelPayload = response.data;
  } catch (error) {
    if (error.response) {
      console.error("Google API Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Google Request Failed:", error.message);
    }
    const status = error.response?.status || 500;
    if (status === 401) throw new ApiError(401, "Google token expired. Please reconnect YouTube.");
    if (status === 403) throw new ApiError(403, "YouTube permission denied. Request youtube.readonly scope.");
    throw new ApiError(502, "Could not fetch YouTube channels from Google.");
  }

  const channels = (channelPayload?.items || []).map((item) => ({
    channelId: item.id,
    channelName: item.snippet?.title || "Untitled Channel",
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      null,
    subscriberCount: Number(item.statistics?.subscriberCount || 0),
    videoCount: Number(item.statistics?.videoCount || 0),
  }));

  res.status(200).json({
    success: true,
    channels,
  });
});

// ============ ATOMIC REGISTER ============
export const registerFull = asyncHandler(async (req, res) => {
  const { 
    fullName, username, email, password, phone, 
    motherTongue, country, categoryId, roleSubCategoryIds, youtubeChannels
  } = req.body;

  let parsedSubIds = roleSubCategoryIds;
  if (typeof roleSubCategoryIds === "string" && roleSubCategoryIds) {
    try { parsedSubIds = JSON.parse(roleSubCategoryIds); } catch { parsedSubIds = [roleSubCategoryIds]; }
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

  let parsedYoutubeChannels = youtubeChannels;
  if (typeof youtubeChannels === "string" && youtubeChannels) {
    try { parsedYoutubeChannels = JSON.parse(youtubeChannels); } catch { parsedYoutubeChannels = []; }
  }

  const userData = {
    fullName, username, email, password, phone,
    motherTongue, country, categoryId,
    roleSubCategoryIds: finalSubIds,
    youtubeChannels: Array.isArray(parsedYoutubeChannels) ? parsedYoutubeChannels : [],
    profilePictureBuffer: req.file ? req.file.buffer : null
  };

  if (!categoryId) {
    throw new ApiError(400, "categoryId is required.");
  }

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
      displayName: userWithProfile.profile.display_name || userWithProfile.profile.name,
      username: userWithProfile.profile.username,
      email: userWithProfile.email,
      role: primaryIdentity.appRole,
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
                roles: { include: { subCategory: { include: { category: true } } } } 
            }
        },
        youtubeProfiles: true,
        stats: true
    }
  });

  if (!user) throw new ApiError(404, "User session invalid.");
  
  const primaryIdentity = resolvePrimaryIdentity(user);
  
  const responseUser = {
      id: user.id,
      name: user.profile?.name,
      displayName: user.profile?.display_name || user.profile?.name,
      username: user.profile?.username,
      email: user.email,
      role: primaryIdentity.appRole,
      primaryRole: primaryIdentity,
      profilePicture: user.profile?.profile_picture,
      isOnboarded: user.is_onboarded,
      youtubeProfile: user.youtubeProfiles,
      followers: user.stats?.followers_count || 0,
      following: user.stats?.following_count || 0
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
