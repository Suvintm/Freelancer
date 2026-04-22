/**
 * authHelpers.js — The Single Source of Truth for User Identity
 *
 * ── Fixes Applied ─────────────────────────────────────────────────────────────
 * 1. formatAuthResponse now stores `_systemRole` on the returned object.
 *    This allows authMiddleware to correctly re-derive the app role when
 *    serving a cached formatted user (where user.role is already "editor"
 *    not "suvix_user"), preventing PROVIDER users from being demoted to "client".
 *
 * 2. isOnboarded is now a guaranteed boolean (!!user.is_onboarded).
 *    Previously could be undefined if the field was missing, causing the
 *    navigation guard's strict check (isOnboarded === true) to fail.
 *
 * 3. name and username are guaranteed strings (never undefined/null).
 *    The navigation guard checks !user.username || !user.name — if these
 *    are undefined the guard redirects to /complete-profile incorrectly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { generateAccessToken, generateRefreshToken } from "./jwt.js";
import { smartResolveMediaUrl } from "../../../utils/mediaResolver.js";

// ─── Role Mapping ──────────────────────────────────────────────────────────

export const mapGroupToAppRole = (group, systemRole) => {
  if (systemRole === "admin") return "admin";
  if (group === "CLIENT") return "client";
  if (group === "PROVIDER") return "editor";
  return "client";
};

// ─── Standard Prisma Include ───────────────────────────────────────────────

export const USER_INCLUDE = {
  profile: {
    include: {
      category: true,
      roles: {
        include: {
          subCategory: {
            include: { category: true },
          },
        },
      },
    },
  },
  youtubeProfiles: {
    include: {
      videos: {
        orderBy: { published_at: "desc" },
        take: 25,
      },
    },
  },
  stats: true,
};

// ─── Primary Identity Resolver ────────────────────────────────────────────

export const resolvePrimaryIdentity = (user) => {
  if (!user.profile) {
    return {
      group: "CLIENT",
      category: "General",
      subCategory: "Member",
      appRole: mapGroupToAppRole("CLIENT", user.role),
      is_onboarded: user.is_onboarded,
    };
  }

  const primaryMapping =
    user.profile.roles?.find((m) => m.isPrimary) ||
    user.profile.roles?.[0];
  const subCat = primaryMapping?.subCategory;
  const cat = user.profile.category || subCat?.category;

  if (!cat && !subCat) {
    return {
      group: "CLIENT",
      category: "General",
      subCategory: "Member",
      appRole: mapGroupToAppRole("CLIENT", user.role),
      is_onboarded: user.is_onboarded,
    };
  }

  const group = cat?.roleGroup || "CLIENT";

  return {
    group,
    category: cat?.name || "General",
    categorySlug: cat?.slug,
    subCategory: subCat?.name || "Member",
    categoryId: cat?.id || user.profile.categoryId,
    subCategoryId: subCat?.id,
    subCategorySlug: subCat?.slug,
    appRole: mapGroupToAppRole(group, user.role),
    is_onboarded: user.is_onboarded,
  };
};

// ─── Token Generator ───────────────────────────────────────────────────────

export const generateUserTokens = (user, familyId, deviceId = null) => {
  const identity = resolvePrimaryIdentity(user);
  const payload = {
    id: user.id,
    role: user.role,
    categorySlug: identity.categorySlug,
    isOnboarded: user.is_onboarded,
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
//
// ✅ CRITICAL: We store `_systemRole` (the raw DB role like "suvix_user")
//    so that when authMiddleware re-derives the app role from a cached user,
//    it has the original system role available.
//    Without this, PROVIDER users cached as { role: "editor" } would have their
//    system role treated as "editor" on re-derivation, causing incorrect behavior.
//
// ✅ name and username are always strings (never undefined).
//    Guards check !user.name || !user.username — falsy undefined would
//    incorrectly trigger the /complete-profile redirect.
//
// ✅ isOnboarded is always a strict boolean via !!(...)
// ─────────────────────────────────────────────────────────────────────────────

export const formatAuthResponse = (user) => {
  const identity = resolvePrimaryIdentity(user);

  // Ensure name and username are always strings
  const name = user.profile?.name || user.displayName || "";
  const username = user.profile?.username || user.username || "";

  // YouTube data — flatten across all linked profiles
  const youtubeProfiles = (user.youtubeProfiles || []).map((p) => ({
    ...p,
    thumbnail_url: smartResolveMediaUrl(p.thumbnail_url),
  }));

  const youtubeVideos = (user.youtubeProfiles || [])
    .flatMap((p) =>
      (p.videos || []).map((v) => {
        const resolvedUrl = smartResolveMediaUrl(v.thumbnail);
        return {
          ...v,
          thumbnail: resolvedUrl,
          media: {
            type: "IMAGE",
            status: "READY",
            urls: {
              thumb: resolvedUrl,
              feed: resolvedUrl,
              full: resolvedUrl,
            },
          },
        };
      })
    )
    .sort(
      (a, b) =>
        new Date(b.published_at || b.publishedAt || 0) -
        new Date(a.published_at || a.publishedAt || 0)
    );

  return {
    id: user.id,
    name,
    displayName: user.profile?.display_name || name,
    username,
    email: user.email,

    // ── App-level role (editor | client | admin) ────────────────────────────
    role: identity.appRole,

    // ── _systemRole: raw DB value — preserved for authMiddleware re-derivation
    // This field is prefixed with _ to signal it's internal infrastructure data.
    // authMiddleware reads this to correctly re-derive app role from cached users.
    _systemRole: user.role || "suvix_user",

    primaryRole: {
      group: identity.group,
      category: identity.category,
      categorySlug: identity.categorySlug,
      subCategory: identity.subCategory,
      categoryId: identity.categoryId,
      subCategoryId: identity.subCategoryId,
      subCategorySlug: identity.subCategorySlug,
      appRole: identity.appRole,
      // Guaranteed boolean — undefined here would break navigation guard
      is_onboarded: !!user.is_onboarded,
    },

    profilePicture: smartResolveMediaUrl(user.profile?.profile_picture),
    location: user.profile?.location_country || null,
    bio: user.profile?.bio || null,
    phone: user.profile?.phone || null,

    // ── Guaranteed strict boolean — the navigation guard uses === true ────────
    isOnboarded: !!user.is_onboarded,

    isVerified: !!user.is_verified,
    isBanned: !!user.is_banned,
    createdAt: user.created_at,

    youtubeProfile: youtubeProfiles,
    youtubeVideos,

    followers: user.stats?.followers_count || 0,
    following: user.stats?.following_count || 0,
  };
};