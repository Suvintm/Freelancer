import crypto from "crypto";
import logger from "../../../utils/logger.js";
import prisma from "../../../config/prisma.js";
import { redis } from "../../../config/redisClient.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import youtubeApiService from "./youtubeApiService.js";
import { deleteCache, CacheKey } from "../../../utils/cache.js";
import { scheduleYouTubeSync } from "../../workers/queues.js";

/**
 * PRODUCTION-GRADE YOUTUBE VERIFICATION SERVICE
 * Handles token generation, hashing, rate limiting, and description scanning.
 */

// Helper to clean and extract YouTube identifier from various inputs
const extractYoutubeIdentifier = (input) => {
  if (!input) return null;
  let identifier = input.trim();
  
  // Smart Extraction Logic (Handles @handle, channel/UC..., c/handle, etc.)
  const handleRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c\/|user\/)?([\w.-]{3,})/;
  const idRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/(UC[\w-]{22})/;
  
  const idMatch = identifier.match(idRegex);
  const handleMatch = identifier.match(handleRegex);
  
  if (idMatch) {
    identifier = idMatch[1];
  } else if (handleMatch) {
    identifier = handleMatch[1].startsWith("@") ? handleMatch[1] : `@${handleMatch[1]}`;
  }
  
  return identifier;
};

/**
 * Initiate verification by generating a token and hashing it in Redis
 */
export const initiateVerification = async (userId, channelInput, metadata = {}) => {
  const identifier = extractYoutubeIdentifier(channelInput);
  if (!identifier) throw new ApiError(400, "Channel handle or ID is required.");
  
  const { subCategoryId, language } = metadata;
  // 1. Normalize Input (Identify if Handle or ID)
  const isHandle = identifier.startsWith("@") || !identifier.startsWith("UC");
  const type = isHandle ? "handle" : "id";

  logger.info(`🎬 [VERIFY-SVC] Requesting verification for ${type}: ${identifier} (User: ${userId})`);
  
  // 🛡️ [LIMIT] Check if user already reached the 5-account maximum
  const accountCount = await prisma.youTubeProfile.count({ where: { userId } });
  if (accountCount >= 5) {
    throw new ApiError(403, "You have reached the maximum limit of 5 linked YouTube accounts. Please delete an existing channel to link a new one.");
  }

  // 2. Global Rate Limit (Max 3 Generations per 24 hours per user for testing)
  const rateLimitKey = `ratelimit:verify_gen:${userId}`;
  const genCount = await redis.incr(rateLimitKey);
  if (genCount === 1) await redis.expire(rateLimitKey, 86400); // 24 hours

  if (genCount > 3) {
    throw new ApiError(429, "You have reached the daily limit (3) for channel verification requests. Please try again tomorrow.");
  }

  // 3. Generate Random Plaintext Token (SVX- + 10 Hex characters)
  const plaintextToken = `SVX-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  
  // 4. Hash the token (SHA-256) for secure storage
  const tokenHash = crypto.createHash("sha256").update(plaintextToken).digest("hex");

  // 5. Build State Object
  const verifyData = {
    tokenHash,
    identifier,
    type,
    subCategoryId,
    language,
    attemptCount: 0,
    createdAt: Date.now(),
  };

  // 6. Store in Redis bound to User + Input (15 Minute TTL)
  // Use a unique key for this specific channel attempt
  const verifyKey = `verify:${userId}:${identifier}`;
  await redis.set(verifyKey, JSON.stringify(verifyData), "EX", 900); // 15 mins

  return {
    token: plaintextToken,
    expiresIn: 900,
  };
};

/**
 * Verify channel by scanning description using 1-unit API call
 */
export const verifyChannel = async (userId, channelInput, reqData) => {
  const identifier = extractYoutubeIdentifier(channelInput);
  if (!identifier) throw new ApiError(400, "Channel handle or ID is required.");
  const verifyKey = `verify:${userId}:${identifier}`;

  // 1. Fetch State from Redis
  const storedData = await redis.get(verifyKey);
  if (!storedData) {
    throw new ApiError(410, "Verification session expired or not found. Please initiate again.");
  }

  const state = JSON.parse(storedData);

  // 2. Brute-Force Check (Max 5 attempts)
  state.attemptCount += 1;
  if (state.attemptCount > 5) {
    await redis.del(verifyKey);
    throw new ApiError(429, "Too many failed attempts. Verification session locked. Please generate a new code.");
  }
  
  // Update attempts in background
  await redis.set(verifyKey, JSON.stringify(state), "EX", 900);

  // 3. One-Unit API Call: Fetch YouTube Data
  // This gets Snippet (description), Statistics, and Branding in one request
  const channelData = await youtubeApiService.getChannelPublicData({
    identifier: state.identifier,
    type: state.type,
  });

  // 4. Pattern Match (Plaintext check in description)
  // The client must provide the plaintextToken they were given during Initiation
  const { token } = reqData; // reqData passed from controller
  if (!token) {
    throw new ApiError(400, "Verification token is required for validation.");
  }

  if (!channelData.description.includes(token)) {
    throw new ApiError(422, "Verification token not found in channel description. Please ensure you saved the changes on YouTube.");
  }

  // 5. Hash Security Check (Double verification)
  const incomingHash = crypto.createHash("sha256").update(token).digest("hex");
  if (incomingHash !== state.tokenHash) {
    logger.error(`🚨 [SECURITY] Token mismatch detected for User ${userId} on Channel ${channelData.channelId}`);
    throw new ApiError(403, "Invalid verification token for this session.");
  }

  // 6. DB Persistence (PostgreSQL)
  // Check if channel already belongs to SOMEONE else
  const existingChannel = await prisma.youTubeProfile.findUnique({
    where: { channel_id: channelData.channelId },
  });

  if (existingChannel) {
    if (existingChannel.userId === userId) {
      throw new ApiError(409, "This channel is already linked to your profile.");
    } else {
      throw new ApiError(409, "This channel is already claimed by another user and cannot be linked.");
    }
  }

  // Save the new profile
  const newProfile = await prisma.youTubeProfile.create({
    data: {
      userId: userId,
      channel_id: channelData.channelId,
      channel_name: channelData.title,
      subscriber_count: channelData.subscriberCount,
      video_count: channelData.videoCount,
      thumbnail_url: channelData.thumbnailUrl,
      uploads_playlist_id: channelData.uploadsPlaylistId,
      subCategoryId: state.subCategoryId,
      language: state.language,
      country: channelData.country,
      is_primary: false, // Explicitly false for manual additions
    },
  });

  // 🚀 Trigger 20-video fetch in background
  await scheduleYouTubeSync(userId, [newProfile], "manual_verify");

  // 7. Cleanup Redis & Invalidate Profile Cache
  await redis.del(verifyKey);
  await deleteCache(CacheKey.userProfile(userId));

  logger.info(`✅ [VERIFY-SVC] Channel ${channelData.channelId} verified and linked to User ${userId}`);

  return {
    status: "verified",
    profile: newProfile,
  };
};
