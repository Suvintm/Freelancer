import prisma from '../../../infrastructure/database/postgres.js';

export class BioAnalyticsRepository {
  /**
   * Log an analytics event (view, click, subscribe) and update aggregate counters
   */
  async logEvent(data) {
    const { pageId, eventType, blockId, visitorId, referrer, device, country, ipHash } = data;

    const eventPromise = prisma.bioAnalyticsEvent.create({
      data: {
        pageId,
        eventType,
        blockId: blockId || null,
        visitorId: visitorId || null,
        referrer: referrer || null,
        device: device || 'mobile',
        country: country || null,
        ipHash: ipHash || null,
      },
    });

    // Increment aggregate counter on BioPage
    const counterUpdatePromise = prisma.bioPage.update({
      where: { id: pageId },
      data: {
        ...(eventType === 'view' && { viewCount: { increment: 1 } }),
        ...(eventType === 'click' && { clickCount: { increment: 1 } }),
      },
    });

    return prisma.$transaction([eventPromise, counterUpdatePromise]);
  }

  /**
   * Get aggregate metrics & time-series breakdown for a bio page
   */
  async getSummary(pageId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [events, page] = await Promise.all([
      prisma.bioAnalyticsEvent.findMany({
        where: {
          pageId,
          createdAt: { gte: startDate },
        },
        select: {
          eventType: true,
          blockId: true,
          referrer: true,
          device: true,
          country: true,
          createdAt: true,
        },
      }),
      prisma.bioPage.findUnique({
        where: { id: pageId },
        select: {
          viewCount: true,
          clickCount: true,
          title: true,
          slug: true,
        },
      }),
    ]);

    const views = events.filter((e) => e.eventType === 'view').length;
    const clicks = events.filter((e) => e.eventType === 'click').length;
    const ctr = views > 0 ? +((clicks / views) * 100).toFixed(1) : 0;

    // Device breakdown
    const devices = events.reduce((acc, curr) => {
      const dev = curr.device || 'mobile';
      acc[dev] = (acc[dev] || 0) + 1;
      return acc;
    }, {});

    // Top referrers
    const referrers = events.reduce((acc, curr) => {
      if (curr.referrer) {
        acc[curr.referrer] = (acc[curr.referrer] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalViews: page?.viewCount || views,
      totalClicks: page?.clickCount || clicks,
      ctr,
      recentViewsCount: views,
      recentClicksCount: clicks,
      devices,
      topReferrers: Object.entries(referrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count })),
    };
  }
}

export default new BioAnalyticsRepository();
