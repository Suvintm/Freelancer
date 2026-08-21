import prisma from '../../../infrastructure/database/postgres.js';

export class BioTemplateRepository {
  /**
   * Fetch all active templates, optionally filtered by category
   */
  async findAllActive(category = null) {
    return prisma.bioTemplate.findMany({
      where: {
        isActive: true,
        ...(category && category !== 'all' && { category }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Fetch a single template by ID
   */
  async findById(id) {
    return prisma.bioTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * Create or update a template (Admin)
   */
  async upsert(data) {
    const { id, name, description, category, tier, thumbnail, themeJson, blocksJson, isActive, sortOrder } = data;
    return prisma.bioTemplate.upsert({
      where: { id },
      update: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(tier !== undefined && { tier }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(themeJson !== undefined && { themeJson }),
        ...(blocksJson !== undefined && { blocksJson }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
      },
      create: {
        id,
        name: name || 'Custom Template',
        description: description || '',
        category: category || 'creators',
        tier: tier || 'free',
        thumbnail: thumbnail || null,
        themeJson: themeJson || {},
        blocksJson: blocksJson || [],
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });
  }

  /**
   * Soft deactivate or hard delete template (Admin)
   */
  async delete(id) {
    return prisma.bioTemplate.delete({
      where: { id },
    });
  }

  /**
   * Count total active templates
   */
  async countActive() {
    return prisma.bioTemplate.count({
      where: { isActive: true },
    });
  }
}

export default new BioTemplateRepository();
