/**
 * 👤 PROFILE SERVICE
 * 
 * Logic for fetching user-scoped media, posts, and reels. 
 * Implements cursor-based pagination for high-performance scrolling.
 */
import prisma from "../../config/prisma.js";
import { paginate } from "../../utils/pagination.js";
import { resolveMediaForApi, resolveImageUrls, resolveVideoUrls } from "../../utils/mediaResolver.js";

const PAGE_SIZE = 12; // Instagram sweet spot for grid loading

/**
 * Get paginated POSTS for a user's profile grid
 * Only returns THUMBNAIL variants to save bandwidth
 */
export const getProfilePosts = async (targetUserId, cursor = null) => {
  const posts = await prisma.post.findMany({
    where: {
      userId: targetUserId,
      visibility: "PUBLIC",
      // Removed isReel filter to show both Posts and Reels in the unified grid
    },
    include: {
      media: {
        where: { status: "READY" },
        take: 1, // Only first media for the grid thumbnail
        orderBy: { created_at: "asc" },
      },
    },
    take: PAGE_SIZE + 1, // Fetch extra one to detect hasNextPage
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { created_at: "desc" },
  });

  const paginated = paginate(posts, PAGE_SIZE);

  // 🚀 PERFORMANCE HYDRATION: Map to Grid-Optimized objects
  paginated.items = paginated.items.map(post => {
    const firstMedia = post.media[0];
    return {
      id: post.id,
      type: post.type,
      caption: post.caption,
      createdAt: post.created_at,
      // 🛰️ Standardize media structure for ProfileContentTabs
      media: resolveMediaForApi(firstMedia),
      thumbnail: firstMedia ? {
        id: firstMedia.id,
        blurhash: firstMedia.blurhash,
        url: resolveMediaForApi(firstMedia).thumbnailUrl
      } : null
    };
  });

  return paginated;
};

/**
 * Get paginated REELS for a user's profile reels tab
 */
export const getProfileReels = async (targetUserId, cursor = null) => {
  const reels = await prisma.post.findMany({
    where: {
      userId: targetUserId,
      visibility: "PUBLIC",
      isReel: true,
    },
    include: {
      media: {
        where: { status: "READY" },
        take: 1,
        orderBy: { created_at: "asc" },
      },
    },
    take: PAGE_SIZE + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { created_at: "desc" },
  });

  const paginated = paginate(reels, PAGE_SIZE);

  paginated.items = paginated.items.map(reel => {
    const firstMedia = reel.media[0];
    return {
      id: reel.id,
      caption: reel.caption,
      createdAt: reel.created_at,
      // 🛰️ Standardize media structure for ProfileContentTabs
      media: resolveMediaForApi(firstMedia)
    };
  });

  return paginated;
};

export default { getProfilePosts, getProfileReels };
