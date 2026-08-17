import bioPageRepository from '../repositories/bioPageRepository.js';
import { redis, redisAvailable } from '../../../infrastructure/cache/redis.client.js';

const MAX_FREE_PAGES = 4;

export class BioPageService {
  /**
   * Helper: Purge Redis public cache for a given username & slug
   */
  async purgePublicCache(username, slug) {
    if (!redisAvailable || !username) return;
    try {
      const keys = [
        `bio:public:${username.toLowerCase()}:main`,
        `bio:public:${username.toLowerCase()}:${(slug || '').toLowerCase()}`,
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
    return bioPageRepository.findByUserId(userId);
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

    // Sanitize and slugify
    let slug = (data.slug || data.title || 'bio')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 50);

    if (!slug) slug = `bio-${Date.now()}`;

    // Verify slug uniqueness for this user
    const existingWithSlug = await bioPageRepository.findByUserAndSlug(userId, slug);
    if (existingWithSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const isFirstPage = currentCount === 0;

    return bioPageRepository.create({
      userId,
      slug,
      title: data.title || 'My Bio Page',
      description: data.description || '',
      templateId: data.templateId || 'creator-basic',
      templateVersion: data.templateVersion || '1.0.0',
      status: 'draft',
      isPrimary: isFirstPage,
      draftBlocks: data.draftBlocks || [],
      draftTheme: data.draftTheme || {},
      settings: data.settings || {},
    });
  }

  /**
   * Auto-save draft changes
   */
  async saveDraft(id, userId, updates) {
    const page = await this.getPageById(id, userId);

    // If slug is changing, verify uniqueness
    if (updates.slug && updates.slug !== page.slug) {
      const sanitizedSlug = updates.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
      const existing = await bioPageRepository.findByUserAndSlug(userId, sanitizedSlug);
      if (existing && existing.id !== id) {
        const error = new Error('Slug is already in use by another of your bio pages');
        error.statusCode = 409;
        throw error;
      }
      updates.slug = sanitizedSlug;
    }

    return bioPageRepository.updateDraft(id, updates);
  }

  /**
   * Promote draft to live published snapshot
   */
  async publishPage(id, userId, username) {
    const page = await this.getPageById(id, userId);

    // Filter only visible blocks for the public snapshot
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
      publishedAt: new Date().toISOString(),
    };

    const publishedPage = await bioPageRepository.publish(id, snapshot);

    // Invalidate Redis public cache
    await this.purgePublicCache(username, page.slug);

    return publishedPage;
  }

  /**
   * Set a page as the primary active page
   */
  async setPrimaryPage(userId, pageId, username) {
    await this.getPageById(pageId, userId);
    await bioPageRepository.setPrimary(userId, pageId);

    // Purge public root cache
    await this.purgePublicCache(username, 'main');

    return { success: true, primaryPageId: pageId };
  }

  /**
   * Delete a page
   */
  async deletePage(id, userId, username) {
    const page = await this.getPageById(id, userId);
    await bioPageRepository.delete(id);

    // Purge cache
    await this.purgePublicCache(username, page.slug);

    return { success: true, deletedId: id };
  }
}

export default new BioPageService();
