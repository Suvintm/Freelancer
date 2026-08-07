import jwt from "jsonwebtoken";
import prisma from "../../../infrastructure/database/postgres.js";
import { hashPassword } from "./password.service.js";
import { ApiError } from "../../../shared/kernel/errors.js";
import { eventBus } from "../../../shared/kernel/events.js";
import storageService from "../../../infrastructure/storage/storage-client.js";
import logger from "../../../infrastructure/monitoring/logger.js";
import { redis } from "../../../infrastructure/cache/redis.client.js";
import { sendOTPEmail } from "../../../infrastructure/email/email.client.js";
import { USER_INCLUDE } from "./identity.service.js";

/**
 * PRODUCTION-GRADE ATOMIC REGISTRATION
 * 1. User (Auth)
 * 2. UserProfile (Identity)
 * 3. Role-specific Profiles (CreatorProfile + YouTubeChannel, EditorProfile, BrandProfile)
 * 4. UserStats & PushToken
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
    categoryId, // RoleCategory UUID or slug
    categorySlug,
    youtubeChannels = [],
    skills = [],
    softwareUsed = [],
    specializations = [],
    portfolioUrl = null,
    experienceYears = 0,
    companyName,
    companyWebsite = null,
    companySize = null,
    approxBudget = null,
    industry,
    designation,
    pushToken,
    platform,
    profilePictureBuffer,
    authProvider = "local",
    googleId = null,
    website,
    role = null,
    discoveryToken = null,
  } = userData;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // 1. Conflict Check: Email or Username
  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });
  if (existingUser) throw new ApiError(400, "Email already registered. Please login.");

  const existingProfile = await prisma.userProfile.findFirst({
    where: { username: normalizedUsername },
  });
  if (existingProfile) throw new ApiError(400, "Username already taken.");

  // 1.5 Conflict & Ownership Check: YouTube Channels (Prevent Hijacking)
  if (youtubeChannels && youtubeChannels.length > 0) {
    const channelIds = youtubeChannels
      .map((ch) => String(ch.channelId || ch.channel_id || ch.id || "").trim())
      .filter(Boolean);

    if (channelIds.length > 0) {
      // 🛡️ Cryptographic Proof: Verify channel ownership signature
      if (discoveryToken) {
        try {
          const decoded = jwt.verify(
            discoveryToken,
            process.env.JWT_SECRET || "suvix_dev_secret"
          );
          if (decoded.type !== "youtube_discovery") {
            throw new ApiError(403, "Invalid channel discovery token.");
          }
          const authorizedIds = new Set(decoded.channelIds || []);
          const unauthorized = channelIds.filter((id) => !authorizedIds.has(id));
          if (unauthorized.length > 0) {
            throw new ApiError(
              403,
              "Channel ownership verification failed. Please reconnect your YouTube channel."
            );
          }
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(
            403,
            "Expired or invalid channel verification token. Please reconnect your YouTube channel."
          );
        }
      }

      const claimedChannels = await prisma.youTubeChannel.findMany({
        where: { channel_id: { in: channelIds } },
        select: { channel_name: true },
      });

      if (claimedChannels.length > 0) {
        const names = claimedChannels.map((p) => p.channel_name).join(", ");
        throw new ApiError(
          409,
          `The following YouTube channels are already registered on SuviX: ${names}. Each channel can only be linked to one account.`
        );
      }
    }
  }

  // 2. Hash Password (if local)
  const hashedPassword = password ? await hashPassword(password) : null;

  // 3. Image Upload
  let profilePictureUrl = "";
  if (profilePictureBuffer) {
    try {
      const uploadResult = await storageService.uploadBuffer(
        profilePictureBuffer,
        "avatars/onboarding"
      );
      profilePictureUrl = uploadResult.secure_url;
    } catch (error) {
      logger.error("Storage Upload Failed:", error);
    }
  }

  // 3.5 Pre-Transaction Avatar Mirroring
  let preMirroredYoutubeAvatar = null;
  if (youtubeChannels?.length > 0) {
    const mainChannel = youtubeChannels[0];
    const thumb =
      mainChannel.thumbnailUrl || mainChannel.thumbnail_url || mainChannel.thumbnail;
    if (thumb) {
      logger.info(`💾 [REG-SYNC] Pre-mirroring YouTube avatar to avoid transaction timeout...`);
      preMirroredYoutubeAvatar = await storageService.uploadFromUrl(
        thumb,
        "media/avatars/youtube"
      );
    }
  }

  // 4. Atomic PostgreSQL Transaction
  let user;
  try {
    user = await prisma.$transaction(
      async (tx) => {
        // Resolve RoleCategory
        let selectedCategory = null;
        if (categoryId) {
          selectedCategory = await tx.roleCategory.findFirst({
            where: {
              OR: [{ id: categoryId }, { slug: categoryId }],
            },
            select: { id: true, slug: true, maps_to_role: true },
          });
        } else if (categorySlug) {
          selectedCategory = await tx.roleCategory.findUnique({
            where: { slug: categorySlug },
            select: { id: true, slug: true, maps_to_role: true },
          });
        }

        let assignedRole = selectedCategory?.maps_to_role || role;
        if (!assignedRole || assignedRole === "suvix_user" || assignedRole === "user") {
          if (categorySlug === "creator" || categorySlug === "yt_influencer" || role === "creator" || role === "yt_influencer") {
            assignedRole = "creator";
          } else if (selectedCategory?.maps_to_role) {
            assignedRole = selectedCategory.maps_to_role;
          } else {
            assignedRole = "user";
          }
        }

        const isCreator = assignedRole === "creator" || selectedCategory?.slug === "creator" || categorySlug === "creator" || categorySlug === "yt_influencer";

        let normalizedChannels = [];
        if (isCreator && youtubeChannels && Array.isArray(youtubeChannels) && youtubeChannels.length > 0) {
          normalizedChannels = youtubeChannels
            .map((ch, index) => {
              const channelId = String(ch.channelId || ch.channel_id || ch.id || "").trim();
              const channelName = String(
                ch.channelName || ch.channel_name || ch.name || ""
              ).trim();
              if (!channelId || !channelName) return null;
              return {
                channel_id: channelId,
                channel_name: channelName,
                thumbnail_url: ch.thumbnailUrl || ch.thumbnail_url || null,
                subscriber_count: Number.isFinite(Number(ch.subscriberCount || ch.subscriber_count))
                  ? Number(ch.subscriberCount || ch.subscriber_count)
                  : 0,
                video_count: Number.isFinite(Number(ch.videoCount || ch.video_count))
                  ? Number(ch.videoCount || ch.video_count)
                  : 0,
                niche: ch.niche || ch.subCategoryName || ch.category || null,
                language: ch.language || null,
                country: ch.country || null,
                isPrimary: ch.isPrimary === true || index === 0,
                uploads_playlist_id: ch.uploadsPlaylistId || ch.uploads_playlist_id || null,
              };
            })
            .filter(Boolean);
        }

        // Step A: Create User
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            username: normalizedUsername,
            password_hash: hashedPassword,
            auth_provider: authProvider,
            google_id: googleId,
            role: assignedRole,
            is_onboarded: true,
            is_email_verified: authProvider === "google",
            email_verified_at: authProvider === "google" ? new Date() : null,
          },
        });

        // Step B: Create UserProfile
        const profile = await tx.userProfile.create({
          data: {
            userId: newUser.id,
            username: normalizedUsername,
            name: fullName,
            profile_picture: profilePictureUrl || null,
            mother_tongue: motherTongue || null,
            location_country: country,
            phone: phone || null,
            categoryId: selectedCategory?.id || null,
            website: website || null,
          },
        });

        // Step C: Create Role-Specific Profile
        if (isCreator) {
          const channelLinkStatus = normalizedChannels.length > 0 ? "VERIFIED" : "UNLINKED";
          const creatorProfile = await tx.creatorProfile.create({
            data: {
              userId: newUser.id,
              business_email: normalizedEmail,
              channel_link_status: channelLinkStatus,
              channel_linked_at: normalizedChannels.length > 0 ? new Date() : null,
            },
          });

          let primaryChannelId = null;

          for (const [index, channel] of normalizedChannels.entries()) {
            const thumb =
              index === 0 && preMirroredYoutubeAvatar
                ? preMirroredYoutubeAvatar
                : channel.thumbnail_url;

            const createdChannel = await tx.youTubeChannel.create({
              data: {
                creatorProfileId: creatorProfile.id,
                userId: newUser.id,
                channel_id: channel.channel_id,
                channel_name: channel.channel_name,
                thumbnail_url: thumb,
                subscriber_count: channel.subscriber_count,
                video_count: channel.video_count,
                uploads_playlist_id: channel.uploads_playlist_id,
                niche: channel.niche,
                language: channel.language,
                country: channel.country,
                is_primary: channel.isPrimary,
              },
            });

            if (channel.isPrimary && !primaryChannelId) {
              primaryChannelId = createdChannel.id;
            }
          }

          if (primaryChannelId) {
            await tx.creatorProfile.update({
              where: { id: creatorProfile.id },
              data: { primary_channel_id: primaryChannelId },
            });
          }
        } else if (assignedRole === "editor") {
          const parsedExp = typeof experienceYears === "number"
            ? experienceYears
            : (parseInt(experienceYears, 10) || 0);

          await tx.editorProfile.create({
            data: {
              userId: newUser.id,
              portfolio_url: portfolioUrl || website || null,
              experience_years: parsedExp,
              skills: Array.isArray(skills) ? skills : [],
              software_used: Array.isArray(softwareUsed) ? softwareUsed : [],
              specializations: Array.isArray(specializations) ? specializations : [],
            },
          });
        } else if (assignedRole === "brand") {
          let parsedBudget = null;
          if (approxBudget) {
            if (typeof approxBudget === "number") {
              parsedBudget = approxBudget;
            } else if (typeof approxBudget === "string") {
              const match = approxBudget.replace(/,/g, "").match(/\d+(\.\d+)?/);
              if (match) parsedBudget = parseFloat(match[0]);
            }
          }

          await tx.brandProfile.create({
            data: {
              userId: newUser.id,
              company_name: companyName || fullName,
              company_website: companyWebsite || website || null,
              industry: industry || null,
              company_size: companySize || null,
              designation: designation || null,
              approx_budget: parsedBudget,
            },
          });
        }

        // Step D: UserStats
        await tx.userStats.upsert({
          where: { userId: newUser.id },
          update: { updated_at: new Date() },
          create: { userId: newUser.id },
        });

        // Step E: Register Push Token
        if (pushToken) {
          await tx.pushToken.upsert({
            where: { token: pushToken },
            update: {
              userId: newUser.id,
              platform: platform ? platform.toUpperCase() : "ANDROID",
              is_active: true,
              last_used_at: new Date(),
            },
            create: {
              userId: newUser.id,
              token: pushToken,
              platform: platform ? platform.toUpperCase() : "ANDROID",
              is_active: true,
              device_name: "SuviX Mobile App",
            },
          });
        }

        return {
          ...newUser,
          profile,
          _deferredYoutubeChannels: isCreator ? normalizedChannels : null,
        };
      },
      {
        timeout: 60000,
      }
    );

    // 5. Hydrate final user with full relations
    const hydratedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: USER_INCLUDE,
    });

    logger.info(`Production Registration Success: ${hydratedUser.email} (${hydratedUser.id})`);

    if (authProvider === "local") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const redisKey = `email_otp:${normalizedEmail}`;
      try {
        await redis.set(redisKey, otp, "EX", 15 * 60); // 15 minutes TTL
        await sendOTPEmail(normalizedEmail, fullName, otp);
        logger.info(`📧 [REG-OTP] Sent email verification code to ${normalizedEmail}`);
      } catch (emailError) {
        logger.error(`❌ [REG-OTP] Failed to generate/send email OTP: ${emailError.message}`);
      }
    } else {
      eventBus.publish("user.registered", {
        userId: hydratedUser.id,
        email: hydratedUser.email,
      });
    }

    return hydratedUser;
  } catch (error) {
    logger.error("Registration Critical Failure:", error);
    throw error;
  }
};
