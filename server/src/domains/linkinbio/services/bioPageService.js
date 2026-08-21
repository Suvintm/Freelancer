import bioPageRepository from '../repositories/bioPageRepository.js';
import prisma from '../../../infrastructure/database/postgres.js';
import { redis, redisAvailable } from '../../../infrastructure/cache/redis.client.js';

const MAX_FREE_PAGES = 4;
const MAX_BLOCKS_PER_PAGE = 50;
const MAX_PAYLOAD_SIZE_BYTES = 500 * 1024; // 500 KB

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'dashboard', 'studio', 'settings', 'login', 'signup',
  'explore', 'u', 'app', 'auth', 'terms', 'privacy', 'help', 'status',
  'support', 'pricing', 'about', 'contact', 'legal', 'verify', 'notifications',
  'creator', 'creators', 'suvix', 'feed', 'chat', 'direct', 'billing'
]);

const ALLOWED_BLOCK_TYPES = new Set([
  'profile-header',
  'link-button',
  'social-bar',
  'product-card',
  'product-grid',
  'tip-jar',
  'music-embed',
  'video-embed',
  'email-capture',
  'faq-accordion',
  'countdown',
  'image-gallery',
  'text-block',
  'divider'
]);

/**
 * URL Sanitizer: Ensures only safe protocols are used. Rejects javascript: and data: schemes.
 */
function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  // Auto-prepend https:// if domain format without protocol
  if (/^[a-zA-Z0-9][-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}

/**
 * Text Sanitizer: Strips script, iframe, and dangerous event handlers from user text
 */
function sanitizeText(rawText, maxLength = 1500) {
  if (!rawText || typeof rawText !== 'string') return '';
  const stripped = rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
  return stripped.slice(0, maxLength);
}

/**
 * Deep block config sanitizer
 */
function sanitizeBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const type = block.type;
  if (!ALLOWED_BLOCK_TYPES.has(type)) return null;

  const cfg = block.config || {};
  const cleanConfig = {};

  switch (type) {
    case 'profile-header':
      cleanConfig.title = sanitizeText(cfg.title || cfg.displayName, 100);
      cleanConfig.displayName = cleanConfig.title;
      cleanConfig.subtitle = sanitizeText(cfg.subtitle || cfg.bio, 500);
      cleanConfig.bio = cleanConfig.subtitle;
      cleanConfig.badgeText = sanitizeText(cfg.badgeText, 50);
      cleanConfig.imageUrl = sanitizeUrl(cfg.imageUrl || cfg.avatarUrl);
      cleanConfig.avatarUrl = cleanConfig.imageUrl;
      cleanConfig.bannerUrl = sanitizeUrl(cfg.bannerUrl);
      cleanConfig.variant = ['centered', 'banner', 'split', 'compact', 'story'].includes(cfg.variant) ? cfg.variant : 'centered';
      cleanConfig.avatarShape = ['circle', 'squircle', 'square'].includes(cfg.avatarShape) ? cfg.avatarShape : 'circle';
      cleanConfig.avatarSize = ['small', 'medium', 'large'].includes(cfg.avatarSize) ? cfg.avatarSize : 'medium';
      cleanConfig.alignment = ['left', 'center', 'right'].includes(cfg.alignment) ? cfg.alignment : 'center';
      cleanConfig.showVerifiedBadge = cfg.showVerifiedBadge !== false;
      break;

    case 'link-button':
      cleanConfig.text = sanitizeText(cfg.text || cfg.title, 100);
      cleanConfig.subtitle = sanitizeText(cfg.subtitle, 150);
      cleanConfig.url = sanitizeUrl(cfg.url);
      cleanConfig.variant = cfg.variant || 'solid';
      cleanConfig.animation = cfg.animation || 'none';
      cleanConfig.icon = sanitizeText(cfg.icon, 50);
      cleanConfig.color = sanitizeText(cfg.color, 30);
      cleanConfig.textColor = sanitizeText(cfg.textColor, 30);
      break;

    case 'social-bar':
      cleanConfig.style = cfg.style || 'filled-circle';
      cleanConfig.platforms = Array.isArray(cfg.platforms)
        ? cfg.platforms.slice(0, 12).map((p) => ({
            platform: sanitizeText(p.platform, 30),
            url: sanitizeUrl(p.url),
          }))
        : [];
      break;

    case 'product-card':
      cleanConfig.title = sanitizeText(cfg.title, 100);
      cleanConfig.price = sanitizeText(cfg.price, 30);
      cleanConfig.imageUrl = sanitizeUrl(cfg.imageUrl);
      cleanConfig.url = sanitizeUrl(cfg.url);
      cleanConfig.badge = sanitizeText(cfg.badge, 30);
      break;

    case 'tip-jar':
      cleanConfig.title = sanitizeText(cfg.title, 100);
      cleanConfig.subtitle = sanitizeText(cfg.subtitle, 200);
      cleanConfig.suggestedAmounts = Array.isArray(cfg.suggestedAmounts)
        ? cfg.suggestedAmounts.slice(0, 5).map((n) => Math.max(1, Number(n) || 5))
        : [5, 10, 25];
      cleanConfig.currency = sanitizeText(cfg.currency, 10) || 'USD';
      cleanConfig.buttonText = sanitizeText(cfg.buttonText, 50) || 'Send Tip';
      break;

    case 'email-capture':
      cleanConfig.heading = sanitizeText(cfg.heading || cfg.title, 100);
      cleanConfig.subheading = sanitizeText(cfg.subheading || cfg.subtitle, 200);
      cleanConfig.buttonText = sanitizeText(cfg.buttonText, 50) || 'Subscribe';
      cleanConfig.placeholder = sanitizeText(cfg.placeholder, 50) || 'Enter your email';
      break;

    case 'faq-accordion':
      cleanConfig.heading = sanitizeText(cfg.heading, 100);
      cleanConfig.items = Array.isArray(cfg.items)
        ? cfg.items.slice(0, 15).map((item) => ({
            id: sanitizeText(item.id, 50) || `faq_${Date.now()}`,
            question: sanitizeText(item.question, 200),
            answer: sanitizeText(item.answer, 1000),
          }))
        : [];
      break;

    case 'countdown':
      cleanConfig.title = sanitizeText(cfg.title, 100);
      cleanConfig.targetDate = sanitizeText(cfg.targetDate, 50);
      cleanConfig.endMessage = sanitizeText(cfg.endMessage, 100);
      break;

    case 'text-block':
      cleanConfig.content = sanitizeText(cfg.content, 2000);
      cleanConfig.align = cfg.align || 'center';
      break;

    case 'divider':
      cleanConfig.style = cfg.style || 'line';
      break;

    case 'music-embed':
    case 'video-embed':
      cleanConfig.url = sanitizeUrl(cfg.url);
      cleanConfig.title = sanitizeText(cfg.title, 100);
      cleanConfig.autoplay = Boolean(cfg.autoplay);
      break;

    case 'image-gallery':
      cleanConfig.heading = sanitizeText(cfg.heading, 100);
      cleanConfig.layout = cfg.layout || 'grid';
      cleanConfig.images = Array.isArray(cfg.images)
        ? cfg.images.slice(0, 12).map((img) => ({
            id: sanitizeText(img.id, 50) || `img_${Date.now()}`,
            imageUrl: sanitizeUrl(img.imageUrl),
            caption: sanitizeText(img.caption, 100),
            url: sanitizeUrl(img.url),
          }))
        : [];
      break;

    default:
      Object.assign(cleanConfig, cfg);
      break;
  }

  return {
    id: sanitizeText(block.id, 64) || `block_${Date.now()}`,
    type,
    isVisible: block.isVisible !== false,
    order: typeof block.order === 'number' ? block.order : 0,
    config: cleanConfig,
  };
}

export class BioPageService {
  /**
   * Validate and sanitize an incoming block payload
   */
  validateAndSanitizeBlocks(blocks) {
    if (!Array.isArray(blocks)) {
      const err = new Error('Blocks payload must be an array');
      err.statusCode = 400;
      throw err;
    }

    const payloadString = JSON.stringify(blocks);
    if (Buffer.byteLength(payloadString, 'utf8') > MAX_PAYLOAD_SIZE_BYTES) {
      const err = new Error('Blocks payload exceeds maximum size limit (500 KB)');
      err.statusCode = 413;
      throw err;
    }

    if (blocks.length > MAX_BLOCKS_PER_PAGE) {
      const err = new Error(`Page exceeds maximum block limit of ${MAX_BLOCKS_PER_PAGE} blocks`);
      err.statusCode = 400;
      throw err;
    }

    return blocks.map(sanitizeBlock).filter(Boolean);
  }

  /**
   * Helper: Generate default SuviX Signature Olive blocks for a creator
   */
  generateDefaultBlocks(user) {
    const displayName = user?.profile?.name || user?.name || user?.username || 'SuviX Creator';
    const avatarUrl = user?.profile?.profile_picture || user?.profilePicture || user?.avatarUrl || '';
    const username = user?.username || 'creator';
    const email = user?.email || 'contact@suvix.in';
    const userBio = user?.profile?.bio || 'Building digital products, sharing knowledge and exploring the world of tech.';

    let socials = {};
    if (user?.profile?.social_links) {
      if (typeof user.profile.social_links === 'string') {
        try { socials = JSON.parse(user.profile.social_links); } catch { socials = {}; }
      } else if (typeof user.profile.social_links === 'object') {
        socials = user.profile.social_links;
      }
    }

    const instagramUrl = socials.instagram || 'https://instagram.com';
    const youtubeUrl = socials.youtube || 'https://youtube.com';
    const twitterUrl = socials.twitter || socials.x || 'https://x.com';
    const linkedinUrl = socials.linkedin || 'https://linkedin.com';
    const githubUrl = socials.github || 'https://github.com';
    const whatsappUrl = socials.whatsapp 
      ? (socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/[^0-9]/g, '')}`)
      : (user?.profile?.phone ? `https://wa.me/${user.profile.phone.replace(/[^0-9]/g, '')}` : 'https://whatsapp.com');
    const emailUrl = `mailto:${email}`;

    return [
      {
        id: `block_header_${Date.now()}`,
        type: 'profile-header',
        isVisible: true,
        order: 0,
        config: {
          title: displayName,
          displayName,
          imageUrl: avatarUrl,
          avatarUrl,
          handle: username,
          subtitle: userBio,
          bio: userBio,
          badgeText: 'Creator & Innovator',
          showVerifiedBadge: true,
          variant: 'centered',
          avatarShape: 'circle',
          avatarSize: 'medium',
          alignment: 'center',
        },
      },
      {
        id: `block_social_${Date.now() + 1}`,
        type: 'social-bar',
        isVisible: true,
        order: 1,
        config: {
          style: 'filled-circle',
          platforms: [
            { platform: 'instagram', url: instagramUrl },
            { platform: 'youtube', url: youtubeUrl },
            { platform: 'twitter', url: twitterUrl },
            { platform: 'linkedin', url: linkedinUrl },
            { platform: 'github', url: githubUrl },
            { platform: 'email', url: emailUrl },
          ],
        },
      },
      {
        id: `block_link_yt_${Date.now() + 2}`,
        type: 'link-button',
        isVisible: true,
        order: 2,
        config: {
          text: 'YouTube Channel',
          subtitle: 'Subscribe to my channel',
          url: youtubeUrl,
          icon: 'youtube',
          variant: 'card',
          animation: 'none',
        },
      },
      {
        id: `block_link_ig_${Date.now() + 3}`,
        type: 'link-button',
        isVisible: true,
        order: 3,
        config: {
          text: 'Instagram Profile',
          subtitle: 'Daily updates & stories',
          url: instagramUrl,
          icon: 'instagram',
          variant: 'card',
          animation: 'none',
        },
      },
      {
        id: `block_tip_${Date.now() + 4}`,
        type: 'tip-jar',
        isVisible: true,
        order: 4,
        config: {
          title: 'Support My Work ⚡',
          subtitle: 'Direct support helps me create more content',
          suggestedAmounts: [5, 10, 25],
          currency: 'USD',
          buttonText: 'Send Support ☕',
        },
      },
      {
        id: `block_faq_${Date.now() + 5}`,
        type: 'faq-accordion',
        isVisible: true,
        order: 5,
        config: {
          heading: 'Frequently Asked Questions',
          items: [
            {
              id: 'faq_1',
              question: 'How can we collaborate?',
              answer: 'Reach out via the email link above or DM me on Instagram for brand deals and sponsorships.',
            },
            {
              id: 'faq_2',
              question: 'What gear do you use?',
              answer: 'Sony A7IV, 24-70mm f/2.8 GM II, Shure SM7B, and MacBook Pro M3 Max.',
            },
          ],
        },
      },
    ];
  }

  /**
   * Helper: Generate default SuviX Signature Olive theme
   */
  generateDefaultTheme() {
    return {
      schemaVersion: 1,
      background: {
        type: 'solid',
        value: '#4D6234',
        color: '#4D6234',
        dominantColor: '#4D6234',
        blur: 0,
        overlay: { enabled: true, color: '#000000', opacity: 0.35 },
      },
      colors: {
        background: '#4D6234',
        primary: '#ffffff',
        text: '#ffffff',
        textMuted: '#e2e8f0',
        cardBackground: 'rgba(255, 255, 255, 0.12)',
        cardBorder: 'rgba(255, 255, 255, 0.2)',
      },
      typography: {
        fontFamily: 'Plus Jakarta Sans',
      },
      buttons: {
        borderRadius: 14,
        shadow: 'medium',
        animation: 'none',
      },
      cardVariant: 'solid',
    };
  }

  /**
   * Auto-provision primary bio page
   */
  async provisionDefaultPage(user) {
    const defaultBlocks = this.generateDefaultBlocks(user);
    const defaultTheme = this.generateDefaultTheme();
    const displayName = user?.profile?.name || user?.name || user?.username || 'SuviX Creator';

    const snapshot = {
      title: `${displayName} • Official Bio`,
      slug: 'main',
      description: 'Official bio link page created with SuviX.',
      blocks: defaultBlocks,
      theme: defaultTheme,
      settings: {
        seoTitle: `${displayName} | Official Bio Link`,
        seoDescription: `Official link-in-bio page for ${displayName}. Connect and explore my latest links and projects.`,
      },
      publishedAt: new Date().toISOString(),
    };

    return bioPageRepository.create({
      userId: user.id,
      slug: 'main',
      title: `${displayName} • Official Bio`,
      description: 'Official bio link page created with SuviX.',
      templateId: 'suvix-signature-olive',
      templateVersion: '1.0.0',
      status: 'published',
      isPrimary: true,
      draftBlocks: defaultBlocks,
      draftTheme: defaultTheme,
      settings: snapshot.settings,
      publishedSnapshot: snapshot,
      publishedAt: new Date(),
    });
  }

  /**
   * Helper: Purge Redis public cache
   */
  async purgePublicCache(userOrUsername, slug) {
    if (!redisAvailable || !userOrUsername) return;
    try {
      let username = typeof userOrUsername === 'string' ? userOrUsername : null;
      if (!username) {
        const u = await prisma.user.findUnique({
          where: { id: userOrUsername },
          select: { username: true },
        });
        username = u?.username;
      }
      if (!username) return;

      const keys = [
        `bio:public:${username.toLowerCase()}:main`,
        `bio:public:${username.toLowerCase()}:${(slug || '').toLowerCase()}`,
        `bio:public:${username.toLowerCase()}`,
      ];
      await redis.del(keys);
    } catch (err) {
      console.warn(`[BioPageService] Redis cache purge failed: ${err.message}`);
    }
  }

  /**
   * Get all bio pages for a user
   */
  async getUserPages(userId) {
    let pages = await bioPageRepository.findByUserId(userId);
    if (!pages || pages.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      if (user) {
        const defaultPage = await this.provisionDefaultPage(user);
        pages = [defaultPage];
      }
    }
    return pages;
  }

  /**
   * Get a single page by ID ensuring user ownership
   */
  async getPageById(id, userId) {
    const page = await bioPageRepository.findByIdAndUser(id, userId);
    if (!page) {
      const error = new Error('Bio page not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return page;
  }

  /**
   * Create a new bio page from template
   */
  async createPage(userId, data) {
    const currentCount = await bioPageRepository.countByUserId(userId);
    if (currentCount >= MAX_FREE_PAGES) {
      const error = new Error(`Page limit reached. Free accounts can have a maximum of ${MAX_FREE_PAGES} bio pages.`);
      error.statusCode = 403;
      throw error;
    }

    let slug = (data.slug || data.title || 'bio')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 50);

    if (!slug) slug = `bio-${Date.now()}`;

    // Reject reserved slugs for non-main pages
    if (slug !== 'main' && RESERVED_SLUGS.has(slug)) {
      const err = new Error(`Slug '${slug}' is a reserved system keyword. Please pick another slug.`);
      err.statusCode = 400;
      throw err;
    }

    // Verify slug uniqueness for this user
    const existingWithSlug = await bioPageRepository.findByUserAndSlug(userId, slug);
    if (existingWithSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const isFirstPage = currentCount === 0;
    const sanitizedBlocks = data.draftBlocks ? this.validateAndSanitizeBlocks(data.draftBlocks) : [];

    return bioPageRepository.create({
      userId,
      slug,
      title: sanitizeText(data.title, 100) || 'My Bio Page',
      description: sanitizeText(data.description, 300) || '',
      templateId: data.templateId || 'creator-basic',
      templateVersion: data.templateVersion || '1.0.0',
      status: 'draft',
      isPrimary: isFirstPage,
      draftBlocks: sanitizedBlocks,
      draftTheme: data.draftTheme || {},
      settings: data.settings || {},
    });
  }

  /**
   * Auto-save draft changes with full sanitization
   */
  async saveDraft(id, userId, updates) {
    const page = await this.getPageById(id, userId);

    // Optimistic Concurrency Check: Prevent silent overwrites from stale browser sessions
    if (updates.clientUpdatedAt && page.updatedAt) {
      const clientTime = new Date(updates.clientUpdatedAt).getTime();
      const serverTime = new Date(page.updatedAt).getTime();
      if (serverTime - clientTime > 3500) {
        const conflictErr = new Error('This page was modified in another session. Please reload to avoid overwriting changes.');
        conflictErr.statusCode = 409;
        conflictErr.code = 'CONCURRENCY_CONFLICT';
        throw conflictErr;
      }
    }

    const sanitizedUpdates = {};

    if (updates.title !== undefined) {
      sanitizedUpdates.title = sanitizeText(updates.title, 100);
    }
    if (updates.description !== undefined) {
      sanitizedUpdates.description = sanitizeText(updates.description, 300);
    }

    if (updates.slug && updates.slug !== page.slug) {
      const sanitizedSlug = updates.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      if (sanitizedSlug !== 'main' && RESERVED_SLUGS.has(sanitizedSlug)) {
        const err = new Error(`Slug '${sanitizedSlug}' is a reserved system keyword.`);
        err.statusCode = 400;
        throw err;
      }
      const existing = await bioPageRepository.findByUserAndSlug(userId, sanitizedSlug);
      if (existing && existing.id !== id) {
        const error = new Error('Slug is already in use by another of your bio pages');
        error.statusCode = 409;
        throw error;
      }
      sanitizedUpdates.slug = sanitizedSlug;
    }

    if (updates.customDomain !== undefined) {
      const domain = (updates.customDomain || '').toLowerCase().trim();
      if (domain) {
        // Validate domain format (e.g. links.mybrand.com)
        if (!/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(domain)) {
          const err = new Error('Invalid custom domain format. Example: links.mybrand.com');
          err.statusCode = 400;
          throw err;
        }
        const existing = await bioPageRepository.findByCustomDomain(domain);
        if (existing && existing.id !== id) {
          const err = new Error('Custom domain is already linked to another bio page');
          err.statusCode = 409;
          throw err;
        }
        sanitizedUpdates.customDomain = domain;
      } else {
        sanitizedUpdates.customDomain = null;
      }
    }

    if (updates.draftBlocks !== undefined) {
      sanitizedUpdates.draftBlocks = this.validateAndSanitizeBlocks(updates.draftBlocks);
    }
    if (updates.draftTheme !== undefined) {
      sanitizedUpdates.draftTheme = updates.draftTheme;
    }
    if (updates.settings !== undefined) {
      sanitizedUpdates.settings = updates.settings;
    }

    const updated = await bioPageRepository.updateDraft(id, sanitizedUpdates);
    console.log(`[BioPageService] 💾 Sanitized draft updated for page ${id} (User: ${userId})`);
    return updated;
  }

  /**
   * Promote draft to live published snapshot
   */
  async publishPage(id, userId, username) {
    const page = await this.getPageById(id, userId);

    const visibleBlocks = Array.isArray(page.draftBlocks)
      ? page.draftBlocks.filter((b) => b.isVisible !== false)
      : [];

    const snapshot = {
      title: page.title,
      slug: page.slug,
      description: page.description,
      blocks: visibleBlocks,
      theme: page.draftTheme,
      settings: page.settings,
      customDomain: page.customDomain,
      publishedAt: new Date().toISOString(),
    };

    const publishedPage = await bioPageRepository.publish(id, snapshot);
    await this.purgePublicCache(username || userId, page.slug);

    console.log(`[BioPageService] 🎉 Bio page ${id} published live for user @${username || userId}`);
    return publishedPage;
  }

  /**
   * Set a page as the primary active page (Atomic Transaction)
   */
  async setPrimaryPage(userId, pageId, username) {
    await this.getPageById(pageId, userId);
    await bioPageRepository.setPrimary(userId, pageId);
    await this.purgePublicCache(username, 'main');
    return { success: true, primaryPageId: pageId };
  }

  /**
   * Delete a page
   */
  async deletePage(id, userId, username) {
    const page = await this.getPageById(id, userId);
    await bioPageRepository.delete(id);
    await this.purgePublicCache(username, page.slug);
    return { success: true, deletedId: id };
  }

  /**
   * Migration Bridge: Convert legacy PublicProfile to modern BioPage v2
   */
  async migrateLegacyPublicProfile(userId) {
    const legacyProfile = await prisma.publicProfile.findUnique({
      where: { userId },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!legacyProfile) {
      const err = new Error('No legacy public profile found for this user');
      err.statusCode = 404;
      throw err;
    }

    const convertedBlocks = [];

    // Header block
    convertedBlocks.push({
      id: `migrated_header_${Date.now()}`,
      type: 'profile-header',
      isVisible: true,
      order: 0,
      config: {
        title: legacyProfile.display_name || 'My Profile',
        displayName: legacyProfile.display_name || 'My Profile',
        subtitle: legacyProfile.bio || '',
        bio: legacyProfile.bio || '',
        imageUrl: legacyProfile.avatar_url || '',
        avatarUrl: legacyProfile.avatar_url || '',
        variant: 'centered',
        avatarShape: 'circle',
        avatarSize: 'medium',
        showVerifiedBadge: Boolean(legacyProfile.verified_badge),
      },
    });

    // Converted sub-blocks
    legacyProfile.blocks.forEach((b, idx) => {
      const blockType = b.type === 'LINK' ? 'link-button' : b.type === 'HEADER' ? 'text-block' : 'link-button';
      convertedBlocks.push({
        id: `migrated_block_${idx}_${Date.now()}`,
        type: blockType,
        isVisible: b.is_active !== false,
        order: idx + 1,
        config: {
          text: b.title || 'Link',
          url: b.url || '',
          variant: 'card',
        },
      });
    });

    const defaultTheme = this.generateDefaultTheme();
    const newBioPage = await bioPageRepository.create({
      userId,
      slug: legacyProfile.handle || 'main',
      title: legacyProfile.display_name || 'My Bio Page',
      description: legacyProfile.bio || '',
      customDomain: legacyProfile.custom_domain || null,
      templateId: 'creator-basic',
      templateVersion: '1.0.0',
      status: 'published',
      isPrimary: true,
      draftBlocks: convertedBlocks,
      draftTheme: defaultTheme,
      settings: {
        seoTitle: legacyProfile.meta_title || `${legacyProfile.display_name} | Bio`,
        seoDescription: legacyProfile.meta_description || legacyProfile.bio,
      },
      publishedSnapshot: {
        title: legacyProfile.display_name || 'My Bio Page',
        slug: legacyProfile.handle || 'main',
        description: legacyProfile.bio || '',
        blocks: convertedBlocks,
        theme: defaultTheme,
        publishedAt: new Date().toISOString(),
      },
      publishedAt: new Date(),
    });

    console.log(`[BioPageService] 🔄 Legacy PublicProfile successfully migrated to BioPage v2 for user ${userId}`);
    return newBioPage;
  }
}

export default new BioPageService();
