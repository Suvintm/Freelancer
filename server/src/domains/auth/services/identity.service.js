/**
 * identity.service.js — Single Source of Truth for User Identity & Session Hydration
 *
 * Fully updated for:
 * 1. Dynamic RoleCategory architecture (user, creator, editor, brand)
 * 2. CreatorProfile + YouTubeChannel (1:N)
 * 3. EditorProfile & BrandProfile
 * 4. Zero obsolete junction tables (UserRoleMapping/RoleSubCategory removed)
 */

import { generateAccessToken, generateRefreshToken } from "./token.service.js";
import { smartResolveMediaUrl } from "../../../infrastructure/storage/media-resolver.js";

// ─── Standard Prisma Include for Full Hydration ────────────────────────────

export const USER_INCLUDE = {
  profile: {
    include: {
      category: true,
    },
  },
  creatorProfile: true,
  youtubeProfile: {
    include: {
      channels: {
        include: {
          videos: {
            orderBy: { published_at: "desc" },
            take: 25,
          },
        },
      },
    },
  },
  instagramProfile: {
    include: {
      accounts: true,
    },
  },
  stats: true,
  follows: true,
  editorProfile: true,
  brandProfile: true,
};

// ─── Primary Identity Resolver ────────────────────────────────────────────

export const resolvePrimaryIdentity = (user) => {
  const systemRole = user.role || "user";
  const cat = user.profile?.category;
  const categorySlug = cat?.slug || (systemRole !== "suvix_user" ? systemRole : "user");
  const appRole = cat?.maps_to_role || systemRole;

  return {
    category: cat?.name || (appRole.charAt(0).toUpperCase() + appRole.slice(1)),
    categorySlug: categorySlug,
    categoryId: cat?.id || user.profile?.categoryId || null,
    appRole,
    is_onboarded: !!user.is_onboarded,
  };
};

// ─── Token Generator ───────────────────────────────────────────────────────

export const generateUserTokens = (user, familyId, deviceId = null) => {
  const identity = resolvePrimaryIdentity(user);
  const payload = {
    id: user.id,
    role: user.role,
    categorySlug: identity.categorySlug,
    isOnboarded: !!user.is_onboarded,
    tokenVersion: user.token_version ?? 0,
    ...(deviceId && { deviceId }),
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({
      id: user.id,
      familyId,
      ...(deviceId && { deviceId }),
    }),
  };
};

// ─── Format Auth Response ─────────────────────────────────────────────────
//
// This function runs ONCE on raw Prisma data and produces a stable flat object.
// authMiddleware caches this result and serves it on all subsequent requests.
// ─────────────────────────────────────────────────────────────────────────────

export const formatAuthResponse = (user, subscription = null) => {
  const identity = resolvePrimaryIdentity(user);

  // Ensure name and username are always strings
  const name = user.profile?.name || user.displayName || "";
  const username = user.profile?.username || user.username || "";

  // YouTube channels data
  const rawChannels = user.youtubeProfile?.channels || [];

  const formattedChannels = rawChannels.map((ch) => ({
    ...ch,
    country: ch.country || user.profile?.location_country || "India",
    thumbnail_url: smartResolveMediaUrl(ch.thumbnail_url),
    banner_url: smartResolveMediaUrl(ch.banner_url),
  }));

  return {
    id: user.id,
    _id: user.id,
    name,
    displayName: user.profile?.display_name || name,
    username,
    email: user.email,
    is_email_verified: !!user.is_email_verified,

    // App-level role (creator | editor | brand | user | admin)
    role: identity.appRole,
    _systemRole: user.role || "user",

    primaryRole: {
      category: identity.category,
      categorySlug: identity.categorySlug,
      categoryId: identity.categoryId,
      appRole: identity.appRole,
      is_onboarded: !!user.is_onboarded,
    },

    profilePicture: smartResolveMediaUrl(user.profile?.profile_picture),
    coverBanner: smartResolveMediaUrl(user.profile?.cover_banner),
    location: user.profile?.location_country || null,
    location_city: user.profile?.location_city || null,
    location_state: user.profile?.location_state || null,
    bio: user.profile?.bio || null,
    phone: user.profile?.phone || null,
    website: user.profile?.website || null,

    // Guaranteed strict boolean
    isOnboarded: !!user.is_onboarded,
    preferencesCompleted: !!user.profile?.preferences_completed,

    isVerified: !!user.is_verified,
    is_verified: !!user.is_verified,
    isBanned: !!user.is_banned,
    createdAt: user.created_at,

    // Specialized role profiles
    creatorProfile: user.creatorProfile || null,
    channelLinkStatus: user.youtubeProfile?.status || (formattedChannels.length > 0 ? "LINKED" : "UNLINKED"),
    youtubeProfile: formattedChannels, // Backward compatibility for existing UI
    youtubeChannels: formattedChannels,
    instagramProfile: user.instagramProfile || null,
    editorProfile: user.editorProfile || null,
    brandProfile: user.brandProfile || null,

    followers: user.stats?.followers_count || 0,
    following: user.stats?.following_count || 0,
    followingIds: (user.follows || []).map((f) => f.followingId),
    subscription,
  };
};