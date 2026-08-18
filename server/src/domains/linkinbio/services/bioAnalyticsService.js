import crypto from 'crypto';
import bioAnalyticsRepository from '../repositories/bioAnalyticsRepository.js';
import bioSubscriberRepository from '../repositories/bioSubscriberRepository.js';
import bioPageRepository from '../repositories/bioPageRepository.js';

export class BioAnalyticsService {
  /**
   * Helper: Parse device type from User-Agent string
   */
  parseDevice(userAgent = '') {
    const ua = userAgent.toLowerCase();
    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Helper: Hash IP for privacy & deduplication
   */
  hashIp(ip = '') {
    if (!ip) return null;
    return crypto.createHash('sha256').update(ip + 'suvix_salt').digest('hex').slice(0, 16);
  }

  /**
   * Track high-throughput visitor view or link/product click event
   */
  async trackEvent(data) {
    const { pageId, eventType, blockId, visitorId, referrer, userAgent, ip } = data;

    if (!pageId || !['view', 'click', 'subscribe'].includes(eventType)) {
      return { success: false, reason: 'Invalid parameters' };
    }

    const device = this.parseDevice(userAgent);
    const ipHash = this.hashIp(ip);

    // Asynchronously log to repository
    bioAnalyticsRepository.logEvent({
      pageId,
      eventType,
      blockId,
      visitorId,
      referrer,
      device,
      ipHash,
    }).catch((err) => {
      console.warn(`[BioAnalyticsService] Track event logging failed: ${err.message}`);
    });

    return { success: true };
  }

  /**
   * Get analytics dashboard metrics for a creator's page
   */
  async getAnalytics(pageId, userId, days = 30) {
    // Verify page ownership
    const page = await bioPageRepository.findByIdAndUser(pageId, userId);
    if (!page) {
      const error = new Error('Bio page not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    return bioAnalyticsRepository.getSummary(pageId, days);
  }

  /**
   * Add a new email newsletter subscriber
   */
  async addSubscriber(pageId, email, source) {
    if (!email || !email.includes('@')) {
      const error = new Error('Valid email address is required');
      error.statusCode = 400;
      throw error;
    }

    const subscriber = await bioSubscriberRepository.upsertSubscriber({
      pageId,
      email,
      source,
    });

    // Also record subscribe event
    this.trackEvent({
      pageId,
      eventType: 'subscribe',
      source,
    });

    return subscriber;
  }
}

export default new BioAnalyticsService();
