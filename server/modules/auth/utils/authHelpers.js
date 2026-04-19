import { generateAccessToken, generateRefreshToken } from "./jwt.js";
import { smartResolveMediaUrl } from "../../../utils/mediaResolver.js";

/**
 * HELPER: Map Role Groups to Frontend Roles
 */
export const mapGroupToAppRole = (group, systemRole) => {
  if (systemRole === "admin") return "admin";
  if (group === "CLIENT") return "client";
  if (group === "PROVIDER") return "editor";
  return "client";
};

/**
 * PRODUCTION-GRADE USER INCLUDE PATTERN
 * Ensures all professional identity relations are consistently included.
 */
export const USER_INCLUDE = {
  profile: {
    include: {
      category: true,
      roles: {
        include: { subCategory: { include: { category: true } } }
      }
    }
  },
  youtubeProfiles: {
    include: {
      videos: {
        orderBy: { published_at: "desc" },
        take: 15
      }
    }
  },
  stats: true
};

/**
 * HELPER: Resolve Primary Professional Identity
 * Merges system roles with professional categories to provide a clear UI identity.
 */
export const resolvePrimaryIdentity = (user) => {
  if (!user.profile) {
    return {
      group: 'CLIENT',
      category: 'General',
      subCategory: 'Member',
      appRole: mapGroupToAppRole('CLIENT', user.role),
      is_onboarded: user.is_onboarded
    };
  }

  const primaryMapping =
    user.profile.roles?.find((mapping) => mapping.isPrimary) ||
    user.profile.roles?.[0];
  const subCat = primaryMapping?.subCategory;
  const cat = user.profile.category || subCat?.category;

  if (!cat && !subCat) {
    return {
      group: 'CLIENT',
      category: 'General',
      subCategory: 'Member',
      appRole: mapGroupToAppRole('CLIENT', user.role),
      is_onboarded: user.is_onboarded
    };
  }

  const group = cat?.roleGroup || 'CLIENT';

  return {
    group,
    category: cat?.name || 'General',
    categorySlug: cat?.slug,
    subCategory: subCat?.name || 'Member',
    categoryId: cat?.id || user.profile.categoryId,
    subCategoryId: subCat?.id,
    subCategorySlug: subCat?.slug,
    appRole: mapGroupToAppRole(group, user.role),
    is_onboarded: user.is_onboarded
  };
};

/**
 * HELPER: Generate Production Tokens with Identity Claims
 * @param {object} user - Full user object from DB (must include token_version)
 * @param {string} familyId - Unique ID for this token family (for rotation/reuse detection)
 * @param {string} [deviceId] - Optional device fingerprint for session binding
 */
export const generateUserTokens = (user, familyId, deviceId = null) => {
  const identity = resolvePrimaryIdentity(user);
  const payload = {
    id: user.id,
    role: user.role,
    categorySlug: identity.categorySlug,
    isOnboarded: user.is_onboarded,
    tokenVersion: user.token_version ?? 0, // For "logout all devices" invalidation
    ...(deviceId && { deviceId }),          // For session binding
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user.id, familyId, ...(deviceId && { deviceId }) })
  };
};

/**
 * HELPER: Format Standard Production User Response
 */
export const formatAuthResponse = (user) => {
  const identity = resolvePrimaryIdentity(user);
  return {
    id: user.id,
    name: user.profile?.name,
    displayName: user.profile?.display_name || user.profile?.name,
    username: user.profile?.username,
    email: user.email,
    role: identity.appRole,
    primaryRole: identity,
    profilePicture: smartResolveMediaUrl(user.profile?.profile_picture),
    location: user.profile?.location_country,
    bio: user.profile?.bio,
    isOnboarded: user.is_onboarded,
    isVerified: user.is_verified,
    createdAt: user.created_at,
    youtubeProfile: (user.youtubeProfiles || []).map(p => ({
      ...p,
      thumbnail_url: smartResolveMediaUrl(p.thumbnail_url)
    })),
    youtubeVideos: (user.youtubeProfiles || [])
      .flatMap(p => (p.videos || []).map(v => {
        const resolvedUrl = smartResolveMediaUrl(v.thumbnail);
        return {
          ...v,
          thumbnail: resolvedUrl, // 🚀 FIX: Resolved URL for legacy UI components
          // 🛰️ NORMALIZE FOR UNIFIED MEDIA ENGINE
          media: {
            type: 'IMAGE',
            status: 'READY',
            urls: {
              thumb: resolvedUrl,
              feed: resolvedUrl,
              full: resolvedUrl
            }
          }
        };
      }))
      .sort((a, b) => new Date(b.published_at || b.publishedAt) - new Date(a.published_at || a.publishedAt)),
    followers: user.stats?.followers_count || 0,
    following: user.stats?.following_count || 0
  };
};
