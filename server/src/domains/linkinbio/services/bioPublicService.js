import prisma from '../../../infrastructure/database/postgres.js';
import { redis, redisAvailable } from '../../../infrastructure/cache/redis.client.js';

const CACHE_TTL_SECONDS = 600; // 10 minutes

export class BioPublicService {
  /**
   * Resolve public bio page payload with Redis caching
   */
  async getPublicProfile(username, slug) {
    const normalizedUsername = (username || '').toLowerCase().trim();
    const targetSlug = (slug || 'main').toLowerCase().trim();
    const cacheKey = `bio:public:${normalizedUsername}:${targetSlug}`;

    // 1. Try Cache First (Sub-5ms response)
    if (redisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        console.warn(`[BioPublicService] Cache read error: ${err.message}`);
      }
    }

    // 2. Query User by username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          { profile: { username: normalizedUsername } },
        ],
      },
      select: {
        id: true,
        username: true,
        is_verified: true,
        profile: {
          select: {
            display_name: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('Creator profile not found');
      error.statusCode = 404;
      throw error;
    }

    // 3. Query Bio Page (Target slug or active Primary page)
    let bioPage = null;
    if (targetSlug !== 'main') {
      bioPage = await prisma.bioPage.findUnique({
        where: {
          userId_slug: {
            userId: user.id,
            slug: targetSlug,
          },
        },
      });
    }

    if (!bioPage) {
      bioPage = await prisma.bioPage.findFirst({
        where: {
          userId: user.id,
          isPrimary: true,
        },
      });
    }

    // If still no page found, fallback to most recently updated page
    if (!bioPage) {
      bioPage = await prisma.bioPage.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!bioPage) {
      const error = new Error('No public bio page configured for this creator');
      error.statusCode = 404;
      throw error;
    }

    // 4. Construct Public Output Payload
    // Use publishedSnapshot if published; otherwise fallback to visible draftBlocks for testing
    const snapshot = bioPage.publishedSnapshot || {
      title: bioPage.title,
      slug: bioPage.slug,
      description: bioPage.description,
      blocks: Array.isArray(bioPage.draftBlocks)
        ? bioPage.draftBlocks.filter((b) => b.isVisible !== false)
        : [],
      theme: bioPage.draftTheme,
      settings: bioPage.settings,
    };

    const publicPayload = {
      pageId: bioPage.id,
      creator: {
        username: user.username,
        name: user.profile?.display_name || user.username,
        avatarUrl: user.profile?.avatar_url || '',
        bio: user.profile?.bio || '',
        isVerified: user.is_verified,
      },
      page: {
        title: snapshot.title || bioPage.title,
        slug: bioPage.slug,
        description: snapshot.description || bioPage.description,
        blocks: snapshot.blocks || [],
        theme: snapshot.theme || bioPage.draftTheme || {},
        settings: snapshot.settings || bioPage.settings || {},
      },
    };

    // 5. Populate Redis Cache
    if (redisAvailable) {
      try {
        await redis.set(cacheKey, JSON.stringify(publicPayload), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn(`[BioPublicService] Cache write error: ${err.message}`);
      }
    }

    return publicPayload;
  }
}

export default new BioPublicService();
