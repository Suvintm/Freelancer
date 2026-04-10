import prisma from "../../../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import youtubeSyncService from "../../youtube-creator/services/youtubeSyncService.js";
import storageService from "../../../utils/storageService.js";
import logger from "../../../utils/logger.js";
import mongoose from "mongoose";

/**
 * PRODUCTION-GRADE ATOMIC REGISTRATION (Split Schema)
 * 1. User (Auth) in PostgreSQL
 * 2. UserProfile (Identity) in PostgreSQL
 * 3. UserRoleMapping (Expertise) in PostgreSQL
 * 4. Auth-first onboarding flow (no cross-module sync)
 */
export const registerFullUser = async (userData) => {
  const {
    fullName,
    username,
    email,
    password,
    phone,
    motherTongue,
    country = "India",
    categoryId, // Optional primary category (legacy compatibility)
    roleSubCategoryIds = [], // Array of UUIDs
    youtubeChannels = [],
    profilePictureBuffer,
    authProvider = "local",
    googleId = null,
  } = userData;

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();

  // 1. Conflict Check: Email or Username
  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail }
  });
  if (existingUser) throw new ApiError(400, "Email already registered. Please login.");

  const existingProfile = await prisma.userProfile.findFirst({
    where: { username: normalizedUsername }
  });
  if (existingProfile) throw new ApiError(400, "Username already taken.");

  // 1.5 Conflict Check: YouTube Channels (Prevent Hijacking)
  if (youtubeChannels && youtubeChannels.length > 0) {
    const channelIds = youtubeChannels.map(ch => String(ch.channelId || ch.channel_id || ch.id || "").trim()).filter(Boolean);
    
    // Safe Property Resolver
    const ytModel = prisma.youtubeProfile || prisma.youTubeProfile || prisma.youtubeProfiles;
    
    if (ytModel) {
      const claimedProfiles = await ytModel.findMany({
        where: { channel_id: { in: channelIds } },
        select: { channel_name: true }
      });

      if (claimedProfiles.length > 0) {
         const names = claimedProfiles.map(p => p.channel_name).join(", ");
         throw new ApiError(409, `The following YouTube channels are already registered on SuviX: ${names}. Each channel can only be linked to one account.`);
      }
    }
  }

  // 2. Hash Password (if local)
  const hashedPassword = password ? await hashPassword(password) : null;

  // 3. Image Upload
  let profilePictureUrl = "";
  if (profilePictureBuffer) {
    try {
      const uploadResult = await storageService.uploadBuffer(profilePictureBuffer, "profiles");
      profilePictureUrl = uploadResult.secure_url;
    } catch (error) {
      logger.error("Storage Upload Failed:", error);
    }
  }

  // 3.5 Pre-Transaction Performance Optimization (Move Network Calls Out)
  let preMirroredYoutubeAvatar = null;
  if (youtubeChannels?.length > 0) {
    const mainChannel = youtubeChannels[0];
    const thumb = mainChannel.thumbnailUrl || mainChannel.thumbnail_url || mainChannel.thumbnail;
    if (thumb) {
       logger.info(`💾 [REG-SYNC] Pre-mirroring YouTube avatar to avoid transaction timeout...`);
       preMirroredYoutubeAvatar = await storageService.uploadFromUrl(thumb, "youtube-profiles");
    }
  }

  // 4. Atomic PostgreSQL Transaction
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      let resolvedCategoryId = categoryId || null;
      if (!resolvedCategoryId && roleSubCategoryIds.length > 0) {
        const firstSubCategory = await tx.roleSubCategory.findFirst({
          where: { id: roleSubCategoryIds[0] },
          select: { roleCategoryId: true },
        });
        resolvedCategoryId = firstSubCategory?.roleCategoryId || null;
      }

      const selectedCategory = resolvedCategoryId
        ? await tx.roleCategory.findUnique({
            where: { id: resolvedCategoryId },
            select: { id: true, slug: true },
          })
        : null;
      const isYoutubeCategory = selectedCategory?.slug === "yt_influencer";

      let normalizedRoleSubCategoryIds = Array.from(
        new Set((roleSubCategoryIds || []).filter(Boolean))
      );
      let normalizedChannels = [];

      if (isYoutubeCategory) {
        if (!youtubeChannels?.length) {
          throw new ApiError(400, "YouTube creator onboarding requires at least one connected channel.");
        }

        normalizedChannels = youtubeChannels
          .map((ch, index) => {
            const channelId = String(ch.channelId || ch.channel_id || ch.id || "").trim();
            const channelName = String(ch.channelName || ch.channel_name || ch.name || "").trim();
            if (!channelId || !channelName) return null;
            return {
              channel_id: channelId,
              channel_name: channelName,
              thumbnail_url: ch.thumbnailUrl || ch.thumbnail_url || null,
              subscriber_count: Number.isFinite(Number(ch.subscriberCount)) ? Number(ch.subscriberCount) : 0,
              video_count: Number.isFinite(Number(ch.videoCount)) ? Number(ch.videoCount) : 0,
              subCategoryRef:
                ch.subCategoryId ||
                ch.sub_category_id ||
                ch.subCategorySlug ||
                ch.sub_category_slug ||
                ch.categorySlug ||
                ch.category_slug ||
                null,
              isPrimary: ch.isPrimary === true || index === 0,
              is_verified: ch.isVerified !== false,
              uploads_playlist_id: ch.uploadsPlaylistId || null,
              videos: ch.videos || [],
            };
          })
          .filter(Boolean);

        if (!normalizedChannels.length) {
          throw new ApiError(400, "Connected YouTube channels are invalid.");
        }

        const refs = Array.from(
          new Set(normalizedChannels.map((ch) => ch.subCategoryRef).filter(Boolean))
        );
        const unresolvedChannels = normalizedChannels.filter((ch) => !ch.subCategoryRef);
        if (unresolvedChannels.length > 0) {
          throw new ApiError(400, "Each selected YouTube channel must have a subcategory.");
        }

        const idRefs = refs.filter((ref) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ref)
        );
        const slugRefs = refs.filter((ref) => !idRefs.includes(ref));

        const matchedSubCategories = await tx.roleSubCategory.findMany({
          where: {
            roleCategoryId: selectedCategory.id,
            OR: [
              ...(idRefs.length ? [{ id: { in: idRefs } }] : []),
              ...(slugRefs.length ? [{ slug: { in: slugRefs.map((r) => String(r).toLowerCase()) } }] : []),
            ],
          },
          select: { id: true, slug: true },
        });

        const byId = new Map(matchedSubCategories.map((sub) => [sub.id, sub]));
        const bySlug = new Map(matchedSubCategories.map((sub) => [sub.slug, sub]));

        normalizedChannels = normalizedChannels.map((channel) => {
          const ref = String(channel.subCategoryRef).toLowerCase();
          const matched = byId.get(channel.subCategoryRef) || bySlug.get(ref);
          if (!matched) {
            throw new ApiError(
              400,
              `Invalid YouTube subcategory for channel ${channel.channel_name}.`
            );
          }
          return {
            ...channel,
            category_slug: matched.slug,
            roleSubCategoryId: matched.id,
          };
        });

        normalizedRoleSubCategoryIds = Array.from(
          new Set([
            ...normalizedRoleSubCategoryIds,
            ...normalizedChannels.map((ch) => ch.roleSubCategoryId),
          ])
        );
      }

      // Step A: Create User (Auth)
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password_hash: hashedPassword,
          auth_provider: authProvider,
          google_id: googleId,
          role: 'suvix_user', // Standardized Professional Role
          is_onboarded: !!resolvedCategoryId || normalizedRoleSubCategoryIds.length > 0,
        },
      });

      // Step B: Create User Profile (Identity)
      const profile = await tx.userProfile.create({
        data: {
          userId: newUser.id,
          username: normalizedUsername,
          name: fullName,
          profile_picture: profilePictureUrl,
          mother_tongue: motherTongue,
          location_country: country,
          phone: phone,
          auth_provider: authProvider,
          categoryId: resolvedCategoryId,
        },
      });

      await tx.userStats.upsert({
        where: { userId: newUser.id },
        update: { updated_at: new Date() },
        create: { userId: newUser.id },
      });

      // Step C: Map Dynamic Roles (Expertise)
      if (normalizedRoleSubCategoryIds.length > 0) {
        const mappings = normalizedRoleSubCategoryIds.map((subId, index) => ({
          profileId: profile.id,
          roleSubCategoryId: subId,
          isPrimary: index === 0,
        }));
        await tx.userRoleMapping.createMany({ data: mappings, skipDuplicates: true });
      }

      if (isYoutubeCategory && normalizedChannels.length > 0) {
        // 🔄 Use the specialized YouTube Sync Service (Production Pattern)
        const channel = normalizedChannels[0];
        // Inject pre-mirrored avatar to save time inside transaction
        channel.mirroredAvatarUrl = preMirroredYoutubeAvatar; 
        
        const ytProfile = await youtubeSyncService.persistYouTubeContent(newUser.id, channel, tx);

        // 🔗 HYBRID SYNC: Persistence to MongoDB (Foundation for Dynamic Portfolios)
        try {
          const db = mongoose.connection.db;
          if (db) {
            await db.collection("profiles").updateOne(
              { user_id: newUser.id }, 
              { 
                $set: {
                  youtube_channel_id: channel.channel_id,
                  youtube_channel_name: channel.channel_name,
                  youtube_thumbnail: ytProfile.thumbnail_url,
                  youtube_stats: {
                    subscribers: channel.subscriber_count,
                    videos: channel.video_count
                  },
                  updated_at: new Date()
                }
              },
              { upsert: true }
            );
            logger.info(`✅ MongoDB Sync: YouTube metadata synchronized for user ${newUser.id}`);
          }
        } catch (mongoErr) {
          logger.warn(`⚠️ MongoDB Sync Failed: ${mongoErr.message}`);
        }
      }

      return {
        ...newUser,
        profile,
      };
    }, {
      timeout: 30000 // Increase timeout to 30s for Neon/Cloudinary latency
    });

    // 5. Hydrate the final user object with all professional relations
    // This ensure resolvePrimaryIdentity() works correctly on the first response
    const hydratedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: {
          include: { 
            category: true,
            roles: { include: { subCategory: { include: { category: true } } } } 
          }
        },
        youtubeProfiles: {
          include: {
            videos: {
              orderBy: { published_at: 'desc' },
              take: 15
            }
          }
        },
        stats: true
      }
    });

    logger.info(`Production Registration Success: ${hydratedUser.email} (${hydratedUser.id})`);
    return hydratedUser;

  } catch (error) {
    logger.error("Registration Critical Failure:", error);
    throw error;
  }
};
