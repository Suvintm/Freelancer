import prisma from '../../../infrastructure/database/postgres.js';
import bioPageService from './bioPageService.js';
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
            name: true,
            profile_picture: true,
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
      bioPage = await bioPageService.provisionDefaultPage(user);
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
        name: user.profile?.name || user.username,
        avatarUrl: user.profile?.profile_picture || '',
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

  /**
   * Helper: Generate OpenGraph HTML for social media crawlers
   */
  generateOpenGraphHtml(publicPayload, fullUrl) {
    const creator = publicPayload?.creator || {};
    const page = publicPayload?.page || {};
    const settings = page.settings || {};

    const title = settings.seoTitle || page.title || `${creator.name || creator.username} • SuviX Bio`;
    const description = settings.seoDescription || page.description || creator.bio || 'Connect and explore my latest links and projects on SuviX.';
    const imageUrl = settings.ogImageUrl || creator.avatarUrl || 'https://suvix.in/assets/whitebglogo.png';
    const canonicalUrl = fullUrl || `https://suvix.in/u/${creator.username}${page.slug && page.slug !== 'main' ? `/${page.slug}` : ''}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- OpenGraph / Facebook / WhatsApp -->
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="SuviX Link in Bio">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #09090b; color: #fff;">
  <h1>${title}</h1>
  <p>${description}</p>
</body>
</html>`;
  }
}

export default new BioPublicService();
