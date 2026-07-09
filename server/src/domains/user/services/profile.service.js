/**
 * 👤 PROFILE SERVICE
 * 
 * Logic for fetching user-scoped media, posts, and reels. 
 * Implements cursor-based pagination for high-performance scrolling.
 */
import prisma from "../../../infrastructure/database/postgres.js";
import { paginate } from "../../../shared/utils/pagination.js";
import { resolveMediaForApi, resolveImageUrls, resolveVideoUrls, smartResolveMediaUrl } from "../../../infrastructure/storage/media-resolver.js";

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
        take: 1, // Only first media for the grid thumbnail
        orderBy: { created_at: "asc" },
      },
      user: {
        include: {
          profile: {
            select: {
              name: true,
              username: true,
              profile_picture: true,
              category: {
                select: {
                  slug: true,
                  roleGroup: true
                }
              }
            }
          }
        }
      }
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
      type: "POST",
      caption: post.caption,
      createdAt: post.created_at,
      // 🛰️ Standardize author structure for Premium Overlay
      author: post.user?.profile ? {
        name: post.user.profile.name,
        username: post.user.profile.username,
        profilePicture: post.user.profile.profile_picture,
        category: post.user.profile.category?.slug,
        roleGroup: post.user.profile.category?.roleGroup || 'CLIENT'
      } : null,
      media: firstMedia ? resolveMediaForApi(firstMedia) : null,
      thumbnail: firstMedia ? resolveMediaForApi(firstMedia).thumbnail : null
    };
  });

  return paginated;
};

/**
 * Get paginated REELS for a user's profile reels tab
 */
export const getProfileReels = async (targetUserId, cursor = null) => {
  const reels = await prisma.reel.findMany({
    where: {
      userId: targetUserId,
      visibility: "PUBLIC",
    },
    include: {
      media: {
        take: 1,
        orderBy: { created_at: "asc" },
      },
      user: {
        include: {
          profile: {
            select: {
              name: true,
              username: true,
              profile_picture: true,
              category: {
                select: {
                  slug: true,
                  roleGroup: true
                }
              }
            }
          }
        }
      }
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
      media: resolveMediaForApi(firstMedia),
      author: reel.user?.profile ? {
        name: reel.user.profile.name,
        username: reel.user.profile.username,
        profilePicture: reel.user.profile.profile_picture,
        category: reel.user.profile.category?.slug,
        roleGroup: reel.user.profile.category?.roleGroup || 'CLIENT'
      } : null
    };
  });

  return paginated;
};

/**
 * Get paginated YOUTUBE POSTS for a user's profile grid
 */
export const getProfileYoutubePosts = async (targetUserId, cursor = null) => {
  const youtubePosts = await prisma.youtubePost.findMany({
    where: {
      userId: targetUserId,
      visibility: "PUBLIC",
    },
    include: {
      media: {
        take: 1,
        orderBy: { created_at: "asc" },
      },
      user: {
        include: {
          profile: {
            select: {
              name: true,
              username: true,
              profile_picture: true,
              category: {
                select: {
                  slug: true,
                  roleGroup: true
                }
              }
            }
          }
        }
      }
    },
    take: PAGE_SIZE + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { created_at: "desc" },
  });

  const paginated = paginate(youtubePosts, PAGE_SIZE);

  paginated.items = paginated.items.map(post => {
    const firstMedia = post.media[0];
    return {
      id: post.id,
      type: "YOUTUBE_POST",
      caption: post.caption,
      createdAt: post.created_at,
      media: firstMedia ? resolveMediaForApi(firstMedia) : null,
      author: post.user?.profile ? {
        name: post.user.profile.name,
        username: post.user.profile.username,
        profilePicture: post.user.profile.profile_picture,
        category: post.user.profile.category?.slug,
        roleGroup: post.user.profile.category?.roleGroup || 'CLIENT'
      } : null
    };
  });

  return paginated;
};

/**
 * Get paginated POLLS for a user's profile grid
 */
export const getProfilePolls = async (targetUserId, cursor = null) => {
  const polls = await prisma.poll.findMany({
    where: {
      userId: targetUserId,
      visibility: "PUBLIC",
    },
    include: {
      options: {
        include: {
          media: true
        }
      },
      user: {
        include: {
          profile: {
            select: {
              name: true,
              username: true,
              profile_picture: true,
              category: {
                select: {
                  slug: true,
                  roleGroup: true
                }
              }
            }
          }
        }
      }
    },
    take: PAGE_SIZE + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { created_at: "desc" },
  });

  const paginated = paginate(polls, PAGE_SIZE);

  paginated.items = paginated.items.map(poll => {
    // Attempt to extract the first media from any poll option
    const firstOptionWithMedia = poll.options?.find(opt => opt.media);
    const firstMedia = firstOptionWithMedia ? firstOptionWithMedia.media : null;
    
    return {
      id: poll.id,
      type: "POLL",
      caption: poll.caption || poll.question,
      createdAt: poll.created_at,
      media: firstMedia ? resolveMediaForApi(firstMedia) : null,
      author: poll.user?.profile ? {
        name: poll.user.profile.name,
        username: poll.user.profile.username,
        profilePicture: poll.user.profile.profile_picture,
        category: poll.user.profile.category?.slug,
        roleGroup: poll.user.profile.category?.roleGroup || 'CLIENT'
      } : null
    };
  });

  return paginated;
};

/**
 * Get profiles belonging to a specific category slug
 */
export const getProfilesByCategory = async (categorySlug) => {
  const profiles = await prisma.userProfile.findMany({
    where: {
      category: {
        slug: categorySlug
      }
    },
    include: {
      category: true,
      roles: {
        include: {
          subCategory: true
        }
      },
      user: {
        include: {
          youtubeProfiles: {
            include: {
              videos: {
                orderBy: { published_at: 'desc' },
                take: 3
              }
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  return profiles.map(profile => {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      username: profile.username,
      profilePicture: smartResolveMediaUrl(profile.profile_picture),
      coverBanner: smartResolveMediaUrl(profile.cover_banner),
      bio: profile.bio,
      location: `${profile.location_city || ''}, ${profile.location_country || ''}`.replace(/^,\s*/, ''),
      category: profile.category?.name,
      roles: profile.roles.map(r => r.subCategory.name),
      youtubeProfiles: (profile.user?.youtubeProfiles || []).map(ytProfile => ({
        channelId: ytProfile.channel_id,
        channelName: ytProfile.channel_name,
        thumbnailUrl: smartResolveMediaUrl(ytProfile.thumbnail_url),
        bannerUrl: smartResolveMediaUrl(ytProfile.banner_url),
        subscriberCount: ytProfile.subscriber_count,
        videoCount: ytProfile.video_count,
        viewCount: ytProfile.view_count,
        averageViews: ytProfile.average_views,
        engagementRate: ytProfile.engagement_rate,
        videos: (ytProfile.videos || []).map(v => {
          const rawThumb = v.thumbnail || v.thumbnail_url || v.thumbnailUrl;
          return {
            id: v.id,
            title: v.title,
            thumbnail: smartResolveMediaUrl(rawThumb),
            viewCount: v.view_count
          };
        })
      }))
    };
  });
};

export const getChannelDetails = async (channelId) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(channelId);

  const channel = await prisma.youTubeProfile.findFirst({
    where: isUuid 
      ? { OR: [{ channel_id: channelId }, { id: channelId }] }
      : { channel_id: channelId },
    include: {
      videos: {
        orderBy: { published_at: 'desc' },
      },
      user: {
        include: {
          profile: {
            include: {
              roles: {
                include: {
                  subCategory: true
                }
              }
            }
          },
          youtubeProfiles: {
            include: {
              videos: {
                orderBy: { published_at: 'desc' },
                take: 3
              }
            }
          }
        }
      }
    }
  });

  if (!channel) return null;

  return {
    id: channel.id,
    channelId: channel.channel_id,
    channelName: channel.channel_name,
    thumbnailUrl: smartResolveMediaUrl(channel.thumbnail_url),
    bannerUrl: smartResolveMediaUrl(channel.banner_url),
    subscriberCount: channel.subscriber_count || 0,
    videoCount: channel.video_count || 0,
    viewCount: channel.view_count != null ? String(channel.view_count) : "0",
    averageViews: channel.average_views || 0,
    engagementRate: channel.engagement_rate || 0,
    videos: (channel.videos || []).map(v => {
      const rawThumb = v.thumbnail || v.thumbnail_url || v.thumbnailUrl;
      return {
        id: v.id,
        title: v.title,
        thumbnail: smartResolveMediaUrl(rawThumb),
        viewCount: v.view_count != null ? String(v.view_count) : "0",
        likeCount: v.like_count != null ? String(v.like_count) : "0",
        commentCount: v.comment_count != null ? String(v.comment_count) : "0",
      };
    }),
    creator: {
      userId: channel.user.id,
      name: channel.user.profile?.name || channel.user.displayName || "",
      username: channel.user.profile?.username || channel.user.username || "",
      profilePicture: smartResolveMediaUrl(channel.user.profile?.profile_picture),
      coverBanner: smartResolveMediaUrl(channel.user.profile?.cover_banner),
      bio: channel.user.profile?.bio || "",
      location: `${channel.user.profile?.location_city || ''}, ${channel.user.profile?.location_country || ''}`.replace(/^,\s*/, '') || "India",
      roles: (channel.user.profile?.roles || []).map(r => r.subCategory.name),
      otherChannels: (channel.user.youtubeProfiles || [])
        .filter(p => p.channel_id !== channel.channel_id)
        .map(p => ({
          channelId: p.channel_id,
          channelName: p.channel_name,
          thumbnailUrl: smartResolveMediaUrl(p.thumbnail_url),
          subscriberCount: p.subscriber_count || 0,
        }))
    }
  };
};

export default { getProfilePosts, getProfileReels, getProfileYoutubePosts, getProfilePolls, getProfilesByCategory, getChannelDetails };
