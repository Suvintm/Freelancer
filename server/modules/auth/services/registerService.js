import prisma from "../../../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../../../middleware/errorHandler.js";
import youtubeApiService from "../../youtube-creator/services/youtubeApiService.js";
import youtubeSyncService from "../../youtube-creator/services/youtubeSyncService.js";
import { youtubeSyncQueue, scheduleYouTubeSync } from "../../workers/queues.js";
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
    pushToken,
    platform,
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
      const uploadResult = await storageService.uploadBuffer(profilePictureBuffer, "avatars/onboarding");
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
       preMirroredYoutubeAvatar = await storageService.uploadFromUrl(thumb, "uploads/avatars/youtube");
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

      // Step B-2. Register VIP Push Token Instantly
      if (pushToken) {
        await tx.pushToken.upsert({
          where: { token: pushToken },
          update: {
            userId: newUser.id,
            platform: platform ? platform.toUpperCase() : 'ANDROID',
            is_active: true,
            last_used_at: new Date()
          },
          create: {
            userId: newUser.id,
            token: pushToken,
            platform: platform ? platform.toUpperCase() : 'ANDROID',
            is_active: true,
            device_name: 'SuviX Mobile App'
          }
        });
      }

      // Step C: Map Dynamic Roles (Expertise)
      if (normalizedRoleSubCategoryIds.length > 0) {
        const mappings = normalizedRoleSubCategoryIds.map((subId, index) => ({
          profileId: profile.id,
          roleSubCategoryId: subId,
          isPrimary: index === 0,
        }));
        await tx.userRoleMapping.createMany({ data: mappings, skipDuplicates: true });
      }

      // Step D: SEED YOUTUBE SKELETONS (Immediate Identity)
      // This ensures the first response to the mobile app already identifies the user as a Creator
      // for all their selected channels, even while videos are still syncing in the background.
      if (isYoutubeCategory && normalizedChannels.length > 0) {
        // SAFE MODEL RESOLVER: Handle varying Prisma naming (youTubeProfile vs youtubeProfile)
        const ytModel = tx.youtubeProfile || tx.youTubeProfile || tx.youtubeProfiles;

        if (ytModel) {
            for (const [index, channel] of normalizedChannels.entries()) {
                // Use the pre-mirrored avatar for the primary channel if available
                const thumb = (index === 0 && preMirroredYoutubeAvatar) ? preMirroredYoutubeAvatar : channel.thumbnail_url;
                
                await ytModel.create({
                    data: {
                        userId: newUser.id,
                        channel_id: channel.channel_id,
                        channel_name: channel.channel_name,
                        thumbnail_url: thumb,
                        subscriber_count: channel.subscriber_count || 0,
                        video_count: channel.video_count || 0,
                        uploads_playlist_id: channel.uploads_playlist_id || null,
                        is_primary: channel.isPrimary || index === 0
                    }
                });
            }
            logger.info(`✨ [REG-SERVICE] Atomic YouTube Identity seeded for user ${newUser.id} (${normalizedChannels.length} channels)`);
        } else {
            logger.error(`❌ [REG-SERVICE] YouTubeProfile model NOT found in transaction client.`);
        }
      }

      return {
        ...newUser,
        profile,
        // Carry channels outward to enqueue them later
        _deferredYoutubeChannels: (isYoutubeCategory && normalizedChannels.length > 0) ? normalizedChannels : null
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
    
    // ── TRIGGER WELCOME NOTIFICATION (Elite Quality) ────────────────────────
    // VIP Token is inserted in the main registration transaction, so this is instant!
    const { default: notificationService } = await import("../../notification/services/notificationService.js");
    
    notificationService.notify({
      userId: hydratedUser.id,
      type: 'WELCOME',
      title: 'Welcome to SuviX! 🚀',
      body: `We're thrilled to have you here, ${fullName || 'User'}. Your professional profile is now live!`,
      priority: 'HIGH',
      metadata: { type: 'onboarding_welcome', onboarding_complete: true }
    }).catch(err => logger.error(`[NOTIFY-WELCOME] Failed to send welcome notification: ${err.message}`));

    // 6. 🚀 UNIFIED SYNC: Dispatch to background BullMQ workers for production stability
    // This offloads the heavy mirroring logic (S3 uploads) to workers, keeping registration fast.
    if (user._deferredYoutubeChannels) {
        logger.info(`✨ [REG-SERVICE] Scheduling background sync for ${user.id} (${user._deferredYoutubeChannels.length} channels)`);
        await scheduleYouTubeSync(user.id, user._deferredYoutubeChannels, "onboarding");
    }
    
    return hydratedUser;

  } catch (error) {
    logger.error("Registration Critical Failure:", error);
    throw error;
  }
};
