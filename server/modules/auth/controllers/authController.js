/**
 * authController.js — Production Authentication Controller
 *
 * ── Critical Fix Applied ─────────────────────────────────────────────────────
 * BUG: getMe was calling formatAuthResponse() on data that was ALREADY
 *      formatted by authMiddleware and stored in Redis cache.
 *
 * The cache stores a flat object like:
 *   { isOnboarded: true, name: "Alex", username: "alex123", primaryRole: {...} }
 *
 * formatAuthResponse() reads raw Prisma nested fields:
 *   name: user.profile?.name          → undefined (profile was flattened out)
 *   username: user.profile?.username  → undefined
 *   isOnboarded: user.is_onboarded    → undefined (field is now `isOnboarded`)
 *
 * Result: every cache hit returns { name: undefined, username: undefined, isOnboarded: undefined }
 * The navigation guard sees missing username/name → redirects to /complete-profile.
 *
 * Fix: When there is a cache hit in getMe, return the cached data DIRECTLY.
 *      The cache already contains the correctly formatted response.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_SECONDS,
  ACCESS_TOKEN_TTL_MS,
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
  generateUserTokens,
} from "../utils/authHelpers.js";
import {
  getCache,
  setCache,
  deleteCache,
  CacheKey,
  TTL,
} from "../../../utils/cache.js";
import {
  isValidEmail,
  isValidUsername,
} from "../../../utils/validation.js";

// ─── Cookie Options ────────────────────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Refresh Token Rotation ────────────────────────────────────────────────

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) throw new ApiError(401, "Refresh token required");

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) throw new ApiError(401, "Invalid or expired refresh token");

  const { id: userId, familyId } = decoded;
  const hashedToken = hashToken(refreshToken);

  const storedData = await redis.get(`refresh_token:${hashedToken}`);

  if (!storedData) {
    if (redisAvailable) {
      logger.warn(
        `[SECURITY] Refresh token missing from Redis for user ${userId}. Session may have expired or was already rotated.`
      );
      throw new ApiError(
        401,
        "Session expired or invalid. Please log in again."
      );
    }
    if (!redisAvailable) {
      logger.warn(
        `[SECURITY] Redis offline: Skipping reuse detection for user ${userId}. Availability prioritized.`
      );
    }
  }

  const currentSession = storedData ? JSON.parse(storedData) : {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_INCLUDE,
  });
  if (!user) throw new ApiError(404, "User no longer exists");

  const incomingDeviceId = req.headers["x-device-id"] || null;
  const storedDeviceId = currentSession.deviceId || null;
  if (
    storedDeviceId &&
    incomingDeviceId &&
    storedDeviceId !== incomingDeviceId
  ) {
    logger.warn(
      `[SECURITY] device_id mismatch on refresh for user ${userId}. Stored: ${storedDeviceId} | Incoming: ${incomingDeviceId}`
    );
  }

  const {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  } = generateUserTokens(user, familyId, incomingDeviceId);
  const newHashedToken = hashToken(newRefreshToken);

  const newSessionData = JSON.stringify({
    userId: user.id,
    familyId,
    deviceId: currentSession.deviceId,
    metadata: {
      userAgent:
        req.headers["user-agent"] ||
        currentSession.metadata?.userAgent ||
        "Unknown Device",
      ip:
        req.ip ||
        currentSession.metadata?.ip ||
        req.connection.remoteAddress,
      lastActive: new Date().toISOString(),
    },
  });

  await redis
    .pipeline()
    .del(`refresh_token:${hashedToken}`)
    .srem(`token_family:${familyId}`, hashedToken)
    .set(
      `refresh_token:${newHashedToken}`,
      newSessionData,
      "EX",
      REFRESH_TOKEN_TTL_SECONDS
    )
    .sadd(`token_family:${familyId}`, newHashedToken)
    .expire(`token_family:${familyId}`, REFRESH_TOKEN_TTL_SECONDS)
    .exec();

  // Bust old user cache so fresh data is served on next profile fetch
  await deleteCache(CacheKey.userProfile(userId));

  res.cookie("refreshToken", newRefreshToken, cookieOptions);
  res.status(200).json({
    success: true,
    token: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    user: formatAuthResponse(user),
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || !isValidEmail(email)) {
    logger.debug(
      `[AUTH] Login validation failed for IP ${req.ip}. Keys: ${Object.keys(req.body).join(", ")}`
    );
    throw new ApiError(
      400,
      "A valid email address and password are required."
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: USER_INCLUDE,
  });

  if (!user) {
    await trackFailedLogin(email);
    throw new ApiError(401, "Invalid credentials.");
  }

  if (user.is_banned) {
    logger.warn(`[AUTH] Login blocked for banned user: ${user.id}`);
    throw new ApiError(
      403,
      "Your account has been suspended. Please contact support.",
      true,
      { isBanned: true, banReason: user.ban_reason || "Violation of terms" }
    );
  }

  if (!user.password_hash && user.google_id) {
    throw new ApiError(
      403,
      "This account is linked with Google. Please use 'Continue with Google' to sign in."
    );
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    await trackFailedLogin(email);
    throw new ApiError(401, "Invalid credentials.");
  }

  await resetFailedLogin(email);

  const deviceId = req.headers["x-device-id"] || null;
  const deviceName = req.headers["x-device-name"] || "Unknown Device";

  // Session limit: max 5 active sessions per user — evict oldest
  try {
    const sessionHashes = await redis.smembers(`user_sessions:${user.id}`);
    if (sessionHashes && sessionHashes.length >= 5) {
      const sessions = [];
      for (const hash of sessionHashes) {
        const data = await redis.get(`refresh_token:${hash}`);
        if (data) {
          const s = JSON.parse(data);
          sessions.push({ hash, lastActive: s.metadata?.lastActive });
        }
      }
      sessions.sort(
        (a, b) => new Date(a.lastActive) - new Date(b.lastActive)
      );
      const oldest = sessions[0];
      if (oldest) {
        await redis.del(`refresh_token:${oldest.hash}`);
        await redis.srem(`user_sessions:${user.id}`, oldest.hash);
        logger.info(
          `[SECURITY] 5-session limit: Evicted oldest session for user ${user.id}`
        );
      }
    }
  } catch (limitErr) {
    logger.warn(
      `[SECURITY] Session limit check failed: ${limitErr.message}. Proceeding.`
    );
  }

  const familyId = crypto.randomUUID();
  const { accessToken, refreshToken } = generateUserTokens(
    user,
    familyId,
    deviceId
  );
  const hashedToken = hashToken(refreshToken);

  const sessionData = JSON.stringify({
    userId: user.id,
    familyId,
    deviceId,
    metadata: {
      userAgent: req.headers["user-agent"] || "Unknown Device",
      ip: req.ip || req.connection.remoteAddress,
      deviceName,
      lastActive: new Date().toISOString(),
    },
  });

  try {
    await redis
      .pipeline()
      .set(
        `refresh_token:${hashedToken}`,
        sessionData,
        "EX",
        REFRESH_TOKEN_TTL_SECONDS
      )
      .sadd(`token_family:${familyId}`, hashedToken)
      .expire(`token_family:${familyId}`, REFRESH_TOKEN_TTL_SECONDS)
      .sadd(`user_sessions:${user.id}`, hashedToken)
      .expire(`user_sessions:${user.id}`, REFRESH_TOKEN_TTL_SECONDS)
      .exec();
    logger.info(
      `[SECURITY] Session stored for user ${user.id} (device: ${deviceId || "unknown"})`
    );
  } catch (redisError) {
    logger.error(
      `⚠️ [REDIS-FAILURE] Could not store session: ${redisError.message}. Proceeding.`
    );
  }

  // Bust stale cache on fresh login
  await deleteCache(CacheKey.userProfile(user.id));

  logger.info(
    `[SECURITY] Successful login for user ${user.id} (${email}). Family: ${familyId}`
  );

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(200).json({
    success: true,
    user: formatAuthResponse(user),
    token: accessToken,
    refreshToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  });
});

// ─── Get Role Categories ───────────────────────────────────────────────────

export const getRoles = asyncHandler(async (req, res) => {
  const categories = await prisma.roleCategory.findMany({
    include: { subCategories: true },
    orderBy: { name: "asc" },
  });
  res.status(200).json({ success: true, categories });
});

// ─── Get YouTube Channels (for signup) ────────────────────────────────────

export const getYouTubeChannels = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken || typeof accessToken !== "string") {
    throw new ApiError(400, "Google accessToken is required.");
  }

  const channels = await youtubeApiService.discoverChannels(accessToken);

  if (channels && channels.length > 0) {
    try {
      const channelIds = channels.map((ch) => ch.channelId);
      const ytModel =
        prisma.youtubeProfile ||
        prisma.youTubeProfile ||
        prisma.youtubeProfiles;

      if (!ytModel) {
        channels.forEach((ch) => (ch.isClaimed = false));
      } else {
        const existingProfiles = await ytModel.findMany({
          where: { channel_id: { in: channelIds } },
          select: { channel_id: true },
        });
        const claimedSet = new Set(existingProfiles.map((p) => p.channel_id));
        channels.forEach((ch) => {
          ch.isClaimed = claimedSet.has(ch.channelId);
        });
      }
    } catch (ytError) {
      logger.error(`⚠️ [YT-GUARD] Duplicate check failed: ${ytError.message}`);
      channels.forEach((ch) => (ch.isClaimed = false));
    }
  }

  res.status(200).json({ success: true, channels });
});

// ─── Atomic Register ──────────────────────────────────────────────────────

export const registerFull = asyncHandler(async (req, res) => {
  const {
    fullName,
    username,
    email,
    password,
    phone,
    motherTongue,
    country,
    categoryId,
    roleSubCategoryIds,
    youtubeChannels,
    pushToken,
    platform,
  } = req.body;

  let parsedSubIds = roleSubCategoryIds;
  if (typeof roleSubCategoryIds === "string" && roleSubCategoryIds) {
    try {
      parsedSubIds = JSON.parse(roleSubCategoryIds);
    } catch {
      parsedSubIds = [roleSubCategoryIds];
    }
  }

  let finalSubIds = parsedSubIds || [];
  if (
    finalSubIds.length > 0 &&
    !finalSubIds[0].match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  ) {
    const dbSubs = await prisma.roleSubCategory.findMany({
      where: { slug: { in: finalSubIds } },
      select: { id: true },
    });
    finalSubIds = dbSubs.map((s) => s.id);
  }

  let parsedYoutubeChannels = youtubeChannels;
  if (typeof youtubeChannels === "string" && youtubeChannels) {
    try {
      parsedYoutubeChannels = JSON.parse(youtubeChannels);
    } catch {
      parsedYoutubeChannels = [];
    }
  }

  if (!categoryId) throw new ApiError(400, "categoryId is required.");

  const userData = {
    fullName,
    username,
    email,
    password,
    phone,
    motherTongue,
    country,
    categoryId,
    roleSubCategoryIds: finalSubIds,
    youtubeChannels: Array.isArray(parsedYoutubeChannels)
      ? parsedYoutubeChannels
      : [],
    pushToken,
    platform,
    profilePictureBuffer: req.file ? req.file.buffer : null,
  };

  const userWithProfile = await registerService(userData);

  const familyId = crypto.randomUUID();
  const deviceId = req.headers["x-device-id"] || null;
  const deviceName = req.headers["x-device-name"] || "Unknown Device";
  const { accessToken, refreshToken } = generateUserTokens(
    userWithProfile,
    familyId,
    deviceId
  );
  const hashedToken = hashToken(refreshToken);

  const sessionData = JSON.stringify({
    userId: userWithProfile.id,
    familyId,
    deviceId,
    metadata: {
      userAgent: req.headers["user-agent"] || "Mobile App",
      ip: req.ip || req.connection.remoteAddress,
      deviceName,
      lastActive: new Date().toISOString(),
    },
  });

  await redis
    .pipeline()
    .set(
      `refresh_token:${hashedToken}`,
      sessionData,
      "EX",
      REFRESH_TOKEN_TTL_SECONDS
    )
    .sadd(`user_sessions:${userWithProfile.id}`, hashedToken)
    .expire(`user_sessions:${userWithProfile.id}`, REFRESH_TOKEN_TTL_SECONDS)
    .exec();

  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(201).json({
    success: true,
    message: "Welcome to SuviX!",
    user: formatAuthResponse(userWithProfile),
    token: accessToken,
    refreshToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);
    const storedData = await redis.get(`refresh_token:${hashedToken}`);
    if (storedData) {
      const { familyId, userId } = JSON.parse(storedData);
      const pipe = redis
        .pipeline()
        .del(`refresh_token:${hashedToken}`);
      if (familyId) pipe.srem(`token_family:${familyId}`, hashedToken);
      if (userId) pipe.srem(`user_sessions:${userId}`, hashedToken);
      await pipe.exec();
    }
  }

  res.clearCookie("refreshToken", cookieOptions);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ─── Get Profile (ME) ──────────────────────────────────────────────────────
//
// ✅ CRITICAL FIX:
// The Redis cache stores data that was ALREADY formatted by authMiddleware.
// Calling formatAuthResponse() again on cached data causes double-formatting:
//   - formatAuthResponse reads user.profile?.name  → undefined (already flattened)
//   - formatAuthResponse reads user.is_onboarded   → undefined (renamed to isOnboarded)
// This was the root cause of the /complete-profile redirect bug on page refresh.
//
// Fix: When cache hits, return the cached data DIRECTLY without re-formatting.
// ──────────────────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cacheKey = CacheKey.userProfile(userId);

  // ── Cache hit: return as-is (already formatted by authMiddleware) ──────────
  const cachedUser = await getCache(cacheKey);
  if (cachedUser) {
    logger.info(`⚡ [CACHE] Serving profile for user ${userId} from Redis`);
    return res.status(200).json({
      success: true,
      user: cachedUser, // ← DO NOT call formatAuthResponse() here — it's already formatted
      _fromCache: true,
    });
  }

  // ── Cache miss: fetch raw from DB, format, cache, return ──────────────────
  logger.info(`📡 [API] Profile hydration (Cache Miss) for user: ${userId}`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_INCLUDE,
  });

  if (!user) throw new ApiError(404, "User session invalid.");

  const formattedUser = formatAuthResponse(user);

  // Cache the formatted response for subsequent requests
  await setCache(cacheKey, formattedUser, TTL.USER_PROFILE);

  res.status(200).json({ success: true, user: formattedUser });
});

// ─── Check Username Availability ──────────────────────────────────────────

export const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const exists = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
  res.status(200).json({ success: true, available: !exists });
});

// ─── Validate Signup (email + username) ───────────────────────────────────

export const validateSignup = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    throw new ApiError(400, "Email and username are required for validation.");
  }
  if (!isValidEmail(email)) {
    throw new ApiError(
      400,
      "Invalid email format. Please use a valid email address."
    );
  }
  if (!isValidUsername(username)) {
    throw new ApiError(
      400,
      "Invalid handle format. Handles must be 3-30 characters (letters, numbers, underscore, dot)."
    );
  }

  const emailExists = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (emailExists) {
    throw new ApiError(
      409,
      "This email is already registered. Please log in instead."
    );
  }

  const usernameExists = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
  if (usernameExists) {
    throw new ApiError(409, "This username is already taken. Try another!");
  }

  res.status(200).json({ success: true, available: true });
});

// ─── Active Sessions ───────────────────────────────────────────────────────

export const getActiveSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sessionHashes = await redis.smembers(`user_sessions:${userId}`);
  const activeSessions = [];

  for (const hash of sessionHashes || []) {
    const data = await redis.get(`refresh_token:${hash}`);
    if (data) {
      const session = JSON.parse(data);
      const currentRefresh =
        req.cookies?.refreshToken &&
        hashToken(req.cookies.refreshToken) === hash;
      activeSessions.push({
        id: hash,
        ...session.metadata,
        isCurrent: currentRefresh,
      });
    }
  }

  res.status(200).json({
    success: true,
    sessions: activeSessions.sort(
      (a, b) => new Date(b.lastActive) - new Date(a.lastActive)
    ),
  });
});

// ─── Revoke Session ────────────────────────────────────────────────────────

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const sessionData = await redis.get(`refresh_token:${sessionId}`);
  if (!sessionData) {
    throw new ApiError(404, "Session not found or already expired");
  }

  const session = JSON.parse(sessionData);
  if (session.userId !== userId) {
    throw new ApiError(403, "You do not have permission to revoke this session");
  }

  await redis.del(`refresh_token:${sessionId}`);
  if (session.familyId) {
    await redis.srem(`token_family:${session.familyId}`, sessionId);
  }
  await redis.srem(`user_sessions:${userId}`, sessionId);

  logger.info(`[SECURITY] User ${userId} revoked session ${sessionId} remotely.`);
  res.status(200).json({ success: true, message: "Session revoked successfully" });
});

// ─── Logout All Devices ────────────────────────────────────────────────────

export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Increment token_version → instantly invalidates all existing JWTs
  await prisma.user.update({
    where: { id: userId },
    data: { token_version: { increment: 1 } },
  });
  logger.info(`[SECURITY] token_version incremented for user ${userId} (logout-all)`);

  // Delete all sessions via secondary index
  const sessionHashes = await redis.smembers(`user_sessions:${userId}`);
  if (sessionHashes && sessionHashes.length > 0) {
    const pipe = redis.pipeline();
    for (const hash of sessionHashes) {
      pipe.del(`refresh_token:${hash}`);
    }
    pipe.del(`user_sessions:${userId}`);
    pipe.del(`token_version:${userId}`); // Bust version cache immediately
    await pipe.exec();
    logger.info(
      `[SECURITY] Deleted ${sessionHashes.length} Redis sessions for user ${userId}`
    );
  }

  // Bust profile cache
  await deleteCache(CacheKey.userProfile(userId));

  res.clearCookie("refreshToken", cookieOptions);
  res.status(200).json({
    success: true,
    message: "You have been logged out of all devices successfully.",
    sessionsRevoked: sessionHashes?.length ?? 0,
  });
});

// ─── Vault Sanitizer ──────────────────────────────────────────────────────

export const validateVault = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ success: false, message: "An array of userIds is required." });
  }

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true },
  });

  res.status(200).json({ success: true, validIds: existingUsers.map((u) => u.id) });
});