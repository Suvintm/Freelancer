import prisma from '../../../infrastructure/database/postgres.js';

export class BioSubscriberRepository {
  /**
   * Upsert newsletter subscriber email
   */
  async upsertSubscriber(data) {
    const { pageId, email, source } = data;

    return prisma.bioSubscriber.upsert({
      where: {
        pageId_email: {
          pageId,
          email: email.toLowerCase().trim(),
        },
      },
      update: {
        source: source || 'email-capture',
      },
      create: {
        pageId,
        email: email.toLowerCase().trim(),
        source: source || 'email-capture',
      },
    });
  }

  /**
   * Find subscribers for a specific page with pagination
   */
  async findByPageId(pageId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      prisma.bioSubscriber.findMany({
        where: { pageId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bioSubscriber.count({
        where: { pageId },
      }),
    ]);

    return {
      subscribers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new BioSubscriberRepository();
