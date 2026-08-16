import prisma from "../../../infrastructure/database/postgres.js";
import { redis, redisAvailable } from "../../../infrastructure/cache/redis.client.js";
import { ApiError } from "../../../shared/kernel/errors.js";

const CACHE_TTL_SECONDS = 3600; // 1 hour for public profiles

export const getPublicProfileByUsername = async (username) => {
  const normalizedUsername = username.toLowerCase().trim();
  const cacheKey = `public_profile:${normalizedUsername}`;

  if (redisAvailable) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const profile = await prisma.publicProfile.findFirst({
    where: {
      user: { username: normalizedUsername },
      is_eligible: true,
      // is_active: true // Allowing active or not for now, or maybe require active
    },
    include: {
      blocks: {
        where: { is_visible: true },
        orderBy: { order_index: 'asc' }
      },
      user: {
        select: {
          username: true,
          profile: {
            select: { name: true, profile_picture: true, bio: true }
          }
        }
      }
    }
  });

  if (!profile) {
    throw new ApiError(404, "Profile not found or not eligible.");
  }
  
  if (!profile.is_active) {
      throw new ApiError(403, "Profile is currently inactive.");
  }

  if (redisAvailable) {
    await redis.set(cacheKey, JSON.stringify(profile), 'EX', CACHE_TTL_SECONDS);
  }

  return profile;
};

export const recordPublicProfileEvent = async (profileId, eventType, reqData) => {
  const event = {
    profileId,
    eventType,
    blockId: reqData.blockId || null,
    visitor_id: reqData.visitorId,
    referrer: reqData.referrer || null,
    device_type: reqData.deviceType || null,
    created_at: new Date().toISOString()
  };
  
  if (redisAvailable) {
    await redis.rpush('public_profile_analytics_queue', JSON.stringify(event));
  } else {
    await prisma.publicProfileAnalytics.create({
      data: {
        publicProfileId: profileId,
        event_type: eventType,
        blockId: event.blockId,
        visitor_id: event.visitor_id,
        referrer: event.referrer,
        device_type: event.device_type,
        created_at: new Date(event.created_at)
      }
    });
  }
};
