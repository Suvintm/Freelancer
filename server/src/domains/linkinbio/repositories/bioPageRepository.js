import prisma from '../../../infrastructure/database/postgres.js';

export class BioPageRepository {
  /**
   * Find all bio pages belonging to a specific user
   */
  async findByUserId(userId) {
    return prisma.bioPage.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        userId: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        isPrimary: true,
        templateId: true,
        templateVersion: true,
        draftBlocks: true,
        draftTheme: true,
        publishedSnapshot: true,
        viewCount: true,
        clickCount: true,
        uniqueVisitors: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find a single bio page by ID
   */
  async findById(id) {
    return prisma.bioPage.findUnique({
      where: { id },
    });
  }

  /**
   * Find a single bio page ensuring user ownership
   */
  async findByIdAndUser(id, userId) {
    return prisma.bioPage.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Find bio page by User ID and Slug
   */
  async findByUserAndSlug(userId, slug) {
    return prisma.bioPage.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
    });
  }

  /**
   * Find the active primary bio page for a user
   */
  async findPrimaryByUser(userId) {
    return prisma.bioPage.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
    });
  }

  /**
   * Count total bio pages created by user (for tier restriction checking)
   */
  async countByUserId(userId) {
    return prisma.bioPage.count({
      where: { userId },
    });
  }

  /**
   * Find a bio page by custom domain
   */
  async findByCustomDomain(domain) {
    return prisma.bioPage.findUnique({
      where: { customDomain: domain.toLowerCase().trim() },
    });
  }

  /**
   * Create a new Bio Page
   */
  async create(data) {
    return prisma.bioPage.create({
      data: {
        userId: data.userId,
        slug: data.slug,
        title: data.title || 'My Bio Page',
        description: data.description || '',
        status: data.status || 'draft',
        isPrimary: data.isPrimary ?? false,
        customDomain: data.customDomain ? data.customDomain.toLowerCase().trim() : null,
        templateId: data.templateId || 'creator-basic',
        templateVersion: data.templateVersion || '1.0.0',
        draftBlocks: data.draftBlocks || [],
        draftTheme: data.draftTheme || {},
        settings: data.settings || {},
        publishedSnapshot: data.publishedSnapshot || null,
        publishedAt: data.publishedAt || null,
      },
    });
  }

  /**
   * Update draft state (debounced auto-save)
   */
  async updateDraft(id, updates) {
    return prisma.bioPage.update({
      where: { id },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.slug !== undefined && { slug: updates.slug }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.customDomain !== undefined && { 
          customDomain: updates.customDomain ? updates.customDomain.toLowerCase().trim() : null 
        }),
        ...(updates.draftBlocks !== undefined && { draftBlocks: updates.draftBlocks }),
        ...(updates.draftTheme !== undefined && { draftTheme: updates.draftTheme }),
        ...(updates.settings !== undefined && { settings: updates.settings }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Publish draft to live snapshot (Atomic promotion)
   */
  async publish(id, snapshotData) {
    return prisma.bioPage.update({
      where: { id },
      data: {
        status: 'published',
        publishedSnapshot: snapshotData,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Set a page as primary (Atomic switch)
   */
  async setPrimary(userId, targetPageId) {
    return prisma.$transaction([
      // 1. Reset all pages for user to non-primary
      prisma.bioPage.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      }),
      // 2. Set target page as primary
      prisma.bioPage.update({
        where: { id: targetPageId },
        data: { isPrimary: true },
      }),
    ]);
  }

  /**
   * Delete a bio page
   */
  async delete(id) {
    return prisma.bioPage.delete({
      where: { id },
    });
  }
}

export default new BioPageRepository();
