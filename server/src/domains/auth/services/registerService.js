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
    instagramAccounts = [],
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
        where: {
          channel_id: { in: channelIds },
        },
        select: { channel_name: true, channel_id: true },
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

        let normalizedInstagramAccounts = [];
        if (isCreator && instagramAccounts && Array.isArray(instagramAccounts) && instagramAccounts.length > 0) {
          normalizedInstagramAccounts = instagramAccounts
            .map((acc, index) => {
              const accountId = String(acc.accountId || acc.account_id || acc.id || "").trim();
              const handle = String(acc.handle || acc.username || "").trim();
              if (!accountId || !handle) return null;
              return {
                account_id: accountId,
                handle: handle,
                name: acc.name || null,
                biography: acc.bio || acc.biography || null,
                website: acc.website || null,
                account_type: acc.accountType || acc.account_type || "CREATOR",
                profile_picture_url: acc.profilePictureUrl || acc.profile_picture_url || null,
                follower_count: Number.isFinite(Number(acc.followerCount || acc.follower_count))
                  ? Number(acc.followerCount || acc.follower_count)
                  : 0,
                following_count: Number.isFinite(Number(acc.followingCount || acc.following_count))
                  ? Number(acc.followingCount || acc.following_count)
                  : 0,
                media_count: Number.isFinite(Number(acc.mediaCount || acc.media_count))
                  ? Number(acc.mediaCount || acc.media_count)
                  : 0,
                is_primary: acc.isPrimary === true || index === 0,
                recentMedia: Array.isArray(acc.recentMedia) ? acc.recentMedia : [],
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
          await tx.creatorProfile.create({
            data: {
              userId: newUser.id,
              business_email: normalizedEmail,
            },
          });

          if (normalizedChannels.length > 0) {
            const ytProfile = await tx.youTubeProfile.create({
              data: {
                userId: newUser.id,
                status: 'LINKED',
                connected_at: new Date(),
              }
            });
            for (const [index, channel] of normalizedChannels.entries()) {
              const thumb =
                index === 0 && preMirroredYoutubeAvatar
                  ? preMirroredYoutubeAvatar
                  : channel.thumbnail_url;

              await tx.youTubeChannel.create({
                data: {
                  youtubeProfileId: ytProfile.id,
                  userId: newUser.id,
                  channel_id: channel.channel_id,
                  channel_name: channel.channel_name,
                  thumbnail_url: thumb,
                  subscriber_count: channel.subscriber_count,
                  video_count: channel.video_count,
                  is_primary: channel.isPrimary,
                  uploads_playlist_id: channel.uploads_playlist_id,
                  niche: channel.niche,
                  language: channel.language,
                  country: channel.country,
                },
              });
            }
          }

          if (normalizedInstagramAccounts.length > 0) {
            const igProfile = await tx.instagramProfile.create({
              data: {
                userId: newUser.id,
                status: 'LINKED',
                connected_at: new Date(),
              }
            });
            for (const acc of normalizedInstagramAccounts) {
              const createdAcc = await tx.instagramAccount.create({
                data: {
                  instagramProfileId: igProfile.id,
                  userId: newUser.id,
                  account_id: acc.account_id,
                  username: acc.handle,
                  display_name: acc.name,
                  biography: acc.biography,
                  website: acc.website,
                  account_type: acc.account_type,
                  profile_picture_url: acc.profile_picture_url,
                  followers_count: acc.follower_count,
                  following_count: acc.following_count,
                  media_count: acc.media_count,
                  is_primary: acc.is_primary,
                },
              });

              // Seed initial posts if available in signup payload
              if (acc.recentMedia && acc.recentMedia.length > 0) {
                const initialPosts = acc.recentMedia.slice(0, 15).map((m) => ({
                  post_id: String(m.id || m.post_id),
                  instagramAccountId: createdAcc.id,
                  userId: newUser.id,
                  media_type: String(m.mediaType || m.media_type || "IMAGE").toUpperCase(),
                  thumbnail_url: m.thumbnailUrl || m.thumbnail_url || m.mediaUrl || m.media_url || null,
                  media_url: m.mediaUrl || m.media_url || null,
                  permalink: m.permalink || `https://instagram.com/p/${m.id}`,
                  caption: m.caption || null,
                  like_count: Number(m.likeCount || m.like_count || 0),
                  comment_count: Number(m.commentsCount || m.comment_count || 0),
                  timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                }));

                await tx.instagramPost.createMany({
                  data: initialPosts,
                  skipDuplicates: true,
                });
              }
            }
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

        // Step F: Initialize Public Profile (Link-in-bio) for creators and editors only
        if (assignedRole === "creator" || assignedRole === "editor") {
          const hasSocials = normalizedChannels.length > 0 || normalizedInstagramAccounts.length > 0;
          
          let initialBlocks = [];
          let orderIdx = 0;
          if (normalizedChannels.length > 0) {
            initialBlocks.push({
              type: "YOUTUBE_CHANNEL",
              title: normalizedChannels[0].channel_name || "My YouTube Channel",
              url: `https://youtube.com/channel/${normalizedChannels[0].channel_id}`,
              order_index: orderIdx++
            });
          }
          if (normalizedInstagramAccounts.length > 0) {
            initialBlocks.push({
              type: "INSTAGRAM_PROFILE",
              title: normalizedInstagramAccounts[0].handle ? `@${normalizedInstagramAccounts[0].handle}` : "My Instagram",
              url: `https://instagram.com/${normalizedInstagramAccounts[0].handle}`,
              order_index: orderIdx++
            });
          }

          await tx.publicProfile.create({
            data: {
              userId: newUser.id,
              is_active: hasSocials,
              is_eligible: hasSocials,
              blocks: initialBlocks.length > 0 ? {
                create: initialBlocks
              } : undefined
            }
          });
        }

        return {
          ...newUser,
          profile,
          _deferredYoutubeChannels: isCreator ? normalizedChannels : null,
          _deferredInstagramAccounts: isCreator ? normalizedInstagramAccounts : null,
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
