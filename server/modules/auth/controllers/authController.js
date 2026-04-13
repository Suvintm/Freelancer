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
import { redis, redisAvailable } from "../../../config/redisClient.js";
import axios from "axios";
import crypto from "crypto";
import { trackFailedLogin, resetFailedLogin } from "../../../middleware/lockoutMiddleware.js";
import logger from "../../../utils/logger.js";
import youtubeApiService from "../../youtube-creator/services/youtubeApiService.js";
import { 
  USER_INCLUDE, 
  formatAuthResponse, 
  generateUserTokens 
} from "../utils/authHelpers.js";
import { 
  isValidEmail, 
  isValidPhone, 
  isValidPassword, 
  isValidUsername 
} from "../../../utils/validation.js";

// Centralized Identity Logic moved to utils/authHelpers.js

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
        // PRODUCTION REFINEMENT: If Redis is online but the token is missing,
        // it may have been purged or already rotated due to a race condition.
        // We throw 401 but NO LONGER nuke the whole family unless we have explicit proof of fraud.
        if (redisAvailable) {
            logger.warn(`[SECURITY] Refresh token missing from Redis for user ${userId}. Session may have expired or was already rotated.`);
            throw new ApiError(401, "Session expired or invalid. Please log in again.");
        }

        // If Redis is down, we allow the refresh if the JWT itself is valid,
        // because we can't verify reuse without the cache.
        if (!redisAvailable) {
            logger.warn(`[SECURITY] Redis offline: Skipping reuse detection for user ${userId}. Availability prioritized.`);
        }
    }

    const sessionData = JSON.parse(storedData);

    // 4. Fetch User with standard relations
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: USER_INCLUDE
    });
    if (!user) throw new ApiError(404, "User no longer exists");

    // 5. Issue NEW pair with identity claims
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateUserTokens(user, familyId);
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
        user: formatAuthResponse(user)
    });
});

// ============ LOGIN ============
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // 🔍 [DIAGNOSTIC] Log why validation is failing (Scrubbing password for security)
  if (!email || !password || !isValidEmail(email)) {
    logger.debug(`[AUTH] Login validation failed for IP ${req.ip}. Body Keys: ${Object.keys(req.body).join(", ")}`);
    logger.debug(`[AUTH] DEBUG: email=${email}, hasPassword=${!!password}, formatValid=${isValidEmail(email)}`);
    
    // Check if the body was possibly sent correctly but parsed weirdly
    if (!req.body || Object.keys(req.body).length === 0) {
        logger.error(`[AUTH] CRITICAL: req.body is EMPTY. Check Content-Type header on mobile app.`);
    }

    throw new ApiError(400, "A valid email address and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: USER_INCLUDE
  });

  if (!user) {
    await trackFailedLogin(email);
    throw new ApiError(401, "Invalid credentials.");
  }

  // 🚩 [SECURITY] IMMEDIATE BAN CHECK
  // Block authentication even before password check for maximum safety.
  if (user.is_banned) {
    logger.warn(`[AUTH] Login attempt blocked for banned user: ${user.id}`);
    throw new ApiError(403, "Your account has been suspended. Please contact support.", true, { 
      isBanned: true,
      banReason: user.ban_reason || "Violation of terms"
    });
  }


  // 🛡️ [SECURITY] ENFORCE ONE-WAY OAUTH RESTRICTION
  // If the account was created via Google and has NO password, block manual login.
  if (!user.password_hash && user.google_id) {
    logger.warn(`[AUTH] Manual login blocked for Google-native user: ${user.id}`);
    throw new ApiError(403, "This account is linked with Google. Please use the 'Continue with Google' button to sign in.");
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
  const { accessToken, refreshToken } = generateUserTokens(user, familyId);
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
  // 🛡️ [RESILIENCE] Wrap Redis call in try-catch to prevent 500 errors if Upstash limit is hit
  try {
    await redis.pipeline()
      .set(`refresh_token:${hashedToken}`, sessionData, "EX", 7 * 24 * 60 * 60)
      .sadd(`token_family:${familyId}`, hashedToken)
      .expire(`token_family:${familyId}`, 7 * 24 * 60 * 60)
      .exec();
    logger.info(`[SECURITY] Session stored in Redis for user ${user.id}`);
  } catch (redisError) {
    logger.error(`⚠️ [REDIS-FAILURE] Could not store session in Redis: ${redisError.message}. Proceeding with DB-only auth.`);
  }

  logger.info(`[SECURITY] Successful login for user ${user.id} (${email}). New family: ${familyId}`);

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    user: formatAuthResponse(user),
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

  const channels = await youtubeApiService.discoverChannels(accessToken);

  // 🛡️ PRODUCTION CHECK: Identify which channels are already on SuviX
  if (channels && channels.length > 0) {
    try {
      const channelIds = channels.map(ch => ch.channelId);
      
      // Safe Property Resolver: Prisma naming can vary by version/generation
      const ytModel = prisma.youtubeProfile || prisma.youTubeProfile || prisma.youtubeProfiles;
      
      if (!ytModel) {
        const availableModels = Object.keys(prisma).filter(k => !k.startsWith('_'));
        logger.error(`❌ [YT-GUARD] YouTube profile model not found on Prisma client. Available: ${availableModels.join(', ')}`);
        // Fallback: don't crash discovery if check fails, just mark all as unclaimed
        channels.forEach(ch => ch.isClaimed = false);
      } else {
        const existingProfiles = await ytModel.findMany({
          where: { channel_id: { in: channelIds } },
          select: { channel_id: true }
        });

        const claimedSet = new Set(existingProfiles.map(p => p.channel_id));
        channels.forEach(ch => {
          ch.isClaimed = claimedSet.has(ch.channelId);
        });
      }
    } catch (ytError) {
      logger.error(`⚠️ [YT-GUARD] Duplicate check failed: ${ytError.message}`);
      // Fail open for discovery; don't block user from seeing their channels
      channels.forEach(ch => ch.isClaimed = false);
    }
  }

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
    motherTongue, country, categoryId, roleSubCategoryIds, youtubeChannels,
    pushToken, platform
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
    pushToken, platform,
    profilePictureBuffer: req.file ? req.file.buffer : null
  };

  if (!categoryId) {
    throw new ApiError(400, "categoryId is required.");
  }

  const userWithProfile = await registerService(userData);
  const familyId = crypto.randomUUID();

  const { accessToken, refreshToken } = generateUserTokens(userWithProfile, familyId);
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
  
  res.status(201).json({
    success: true,
    message: "Welcome to SuviX!",
    user: formatAuthResponse(userWithProfile),
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
    include: USER_INCLUDE
  });

  if (!user) throw new ApiError(404, "User session invalid.");
  
  res.status(200).json({ 
    success: true, 
    user: formatAuthResponse(user) 
  });
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
    throw new ApiError(400, "Email and username are required for validation.");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email format. Please use a valid email address.");
  }

  if (!isValidUsername(username)) {
    throw new ApiError(400, "Invalid handle format. Handles must be 3-30 characters (letters, numbers, underscore, dot).");
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
