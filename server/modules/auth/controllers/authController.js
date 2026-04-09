import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  hashToken
} from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";
import { registerFullUser as registerService } from "../services/registerService.js";
import prisma from "../../../config/prisma.js";
import { ApiError, asyncHandler } from "../../../middleware/errorHandler.js";
import { redis } from "../../../middleware/rateLimiter.js";
import axios from "axios";
import crypto from "crypto";
import { trackFailedLogin, resetFailedLogin } from "../../../middleware/lockoutMiddleware.js";
import logger from "../../../utils/logger.js";

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

    const { id: userId, familyId } = decoded;
    const hashedToken = hashToken(refreshToken);

    // 2. Check if token is in Redis (Reuse Detection)
    const storedData = await redis.get(`refresh_token:${hashedToken}`);
    
    if (!storedData) {
        // TOKEN REUSE DETECTED! (Security breach attempt)
        if (familyId) {
            logger.error(`[SECURITY] Refresh token reuse detected for user ${userId}. Invalidating family: ${familyId}`);
            
            // Nuke the entire family session
            const familyKey = `token_family:${familyId}`;
            const familyTokens = await redis.smembers(familyKey);
            
            if (familyTokens.length > 0) {
                const keysToDel = familyTokens.map(t => `refresh_token:${t}`);
                await redis.del(...keysToDel, familyKey);
            }
        }
        throw new ApiError(401, "Security Alert: This session has been invalidated due to token reuse detection.");
    }

    const sessionData = JSON.parse(storedData);

    // 4. Fetch User
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
    if (!user) throw new ApiError(404, "User no longer exists");

    // 5. Issue NEW pair (Keep the same familyId)
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id, familyId });
    const newHashedToken = hashToken(newRefreshToken);

    // 6. Update Metadata and store in Redis (ONE HIT PIPELINE)
    const currentSession = JSON.parse(storedData);
    const userAgent = req.headers["user-agent"] || currentSession.metadata?.userAgent || "Unknown Device";
    const ip = req.ip || currentSession.metadata?.ip || req.connection.remoteAddress;

    const newSessionData = JSON.stringify({ 
        userId: user.id, 
        familyId,
        metadata: {
            userAgent,
            ip,
            lastActive: new Date().toISOString()
        }
    });

    // ATOMIC ROTATION & REFRESH (1 Hit to Upstash)
    await redis.pipeline()
        .del(`refresh_token:${hashedToken}`) // Nuke old
        .srem(`token_family:${familyId}`, hashedToken) // Remove from family
        .set(`refresh_token:${newHashedToken}`, newSessionData, "EX", 7 * 24 * 60 * 60) // New token
        .sadd(`token_family:${familyId}`, newHashedToken) // Add new to family
        .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60) // Keep family set alive
        .exec();

    // 7. Send Response
    // ---------------------------------------------------------
    // 💡 [SECURITY] TODO: Add NEW Email OTP Verification here
    // Steps for later:
    // 1. Generate 6-digit OTP
    // 2. Store user data in Redis temporary buffer
    // 3. Send email to user.email via Resend
    // 4. Client verifies OTP -> then we call registerService()
    // ---------------------------------------------------------

    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    res.status(200).json({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
            id: user.id,
            isOnboarded: user.is_onboarded,
            isVerified: user.is_verified,
            role: user.role
        }
    });
});

// ============ LOGIN ============
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
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
    await trackFailedLogin(email);
    throw new ApiError(401, "Invalid credentials.");
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    await trackFailedLogin(email);
    throw new ApiError(401, "Invalid credentials.");
  }

  // SUCCESS: Reset lockout tracking
  await resetFailedLogin(email);

  // ---------------------------------------------------------
  // 💡 [SECURITY] TODO: Add Two-Factor Authentication (2FA) here
  // If user.twoFactorEnabled then return 2fa_required: true
  // ---------------------------------------------------------

  // START NEW SESSION FAMILY
  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, familyId });
  const hashedToken = hashToken(refreshToken);

  // CAPTURE METADATA FOR ACTIVE SESSION MANAGEMENT
  const userAgent = req.headers["user-agent"] || "Unknown Device";
  const ip = req.ip || req.connection.remoteAddress;

  const sessionData = JSON.stringify({ 
    userId: user.id, 
    familyId,
    metadata: { userAgent, ip, lastActive: new Date().toISOString() }
  });

  // ATOMIC SESSION STORAGE (1 Hit to Upstash)
  await redis.pipeline()
    .set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60)
    .sadd(`token_family:${familyId}`, hashedToken)
    .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
    .exec();

  logger.info(`[SECURITY] Successful login for user ${user.id} (${email}). New family: ${familyId}`);

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
      primaryRole: primaryIdentity,
      profilePicture: user.profile?.profile_picture,
      location: user.profile?.location_country,
      bio: user.profile?.bio,
      isOnboarded: user.is_onboarded,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      youtubeProfile: user.youtubeProfiles
    },
    token: accessToken,
    refreshToken
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
  // ---------------------------------------------------------
  // 💡 [SECURITY] TODO: Add Email OTP Verification here
  // Steps for later:
  // 1. Send OTP to req.body.email
  // 2. Verify OTP before calling registerService
  // ---------------------------------------------------------
  console.log("🔒 [SECURITY] OTP Verification placeholder hit — Proceeding with registration for dev.");

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
  const hashedToken = hashToken(refreshToken);

  // CAPTURE METADATA
  const userAgent = req.headers["user-agent"] || "Mobile App";
  const ip = req.ip || req.connection.remoteAddress;

  const sessionData = JSON.stringify({ 
    userId: userWithProfile.id,
    familyId,
    metadata: { userAgent, ip, lastActive: new Date().toISOString() }
  });

  // OPTIMIZED STORAGE (1 Hit)
  await redis.set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60);

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
      location: userWithProfile.profile.location_country,
      bio: userWithProfile.profile.bio,
      primaryRole: primaryIdentity,
      isOnboarded: true,
      isVerified: userWithProfile.is_verified,
      createdAt: userWithProfile.created_at
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
        const hashedToken = hashToken(refreshToken);
        const storedData = await redis.get(`refresh_token:${hashedToken}`);
        if (storedData) {
            const { familyId } = JSON.parse(storedData);
            
            // ATOMIC REVOKE (1 Hit)
            const pipe = redis.pipeline().del(`refresh_token:${hashedToken}`);
            if (familyId) pipe.srem(`token_family:${familyId}`, hashedToken);
            await pipe.exec();
        }
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
  logger.info(`📡 [API] Profile hydration requested for user: ${req.user.id}`);
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
      bio: user.profile?.bio,
      isOnboarded: user.is_onboarded,
      isVerified: user.is_verified,
      createdAt: user.created_at,
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

// ============ ACTIVE SESSIONS ============

/**
 * Get all active sessions for the current user.
 * Returns a list of devices, IPs, and login times.
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // 1. Scan Redis for all keys matching 'refresh_token:*'
    // Note: In high-scale prod, use a secondary index (user:sessions:id)
    // For now, we'll scan which is fine for small/mid scale.
    const keys = await redis.keys("refresh_token:*");
    const activeSessions = [];

    for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
            const session = JSON.parse(data);
            if (session.userId === userId) {
                activeSessions.push({
                    id: key.replace("refresh_token:", ""), // The hashed token (safe to share)
                    ...session.metadata,
                    isCurrent: req.cookies?.refreshToken && hashToken(req.cookies.refreshToken) === key.replace("refresh_token:", "")
                });
            }
        }
    }

    res.status(200).json({
        success: true,
        sessions: activeSessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
    });
});

/**
 * Revoke a specific session (Log out a device remotely).
 */
export const revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params; // This is the hashed token
    const userId = req.user.id;

    const sessionData = await redis.get(`refresh_token:${sessionId}`);
    if (!sessionData) {
        throw new ApiError(404, "Session not found or already expired");
    }

    const session = JSON.parse(sessionData);
    if (session.userId !== userId) {
        throw new ApiError(403, "You do not have permission to revoke this session");
    }

    // Nuke it
    await redis.del(`refresh_token:${sessionId}`);
    if (session.familyId) {
        await redis.srem(`token_family:${session.familyId}`, sessionId);
    }

    logger.info(`[SECURITY] User ${userId} revoked session ${sessionId} remotely.`);

    res.status(200).json({
        success: true,
        message: "Session revoked successfully"
    });
});
