import bioAnalyticsService from '../services/bioAnalyticsService.js';

export class BioAnalyticsController {
  /**
   * POST /api/linkinbio/track/view
   * Non-blocking view impression tracking
   */
  async trackView(req, res, next) {
    try {
      const { pageId, visitorId, referrer } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

      // Return 202 Accepted immediately
      res.status(202).json({ success: true });

      // Ingest in background
      bioAnalyticsService.trackEvent({
        pageId,
        eventType: 'view',
        visitorId,
        referrer,
        userAgent,
        ip,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/track/click
   * Non-blocking link / product click tracking
   */
  async trackClick(req, res, next) {
    try {
      const { pageId, blockId, visitorId, referrer } = req.body;
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

      // Return 202 Accepted immediately
      res.status(202).json({ success: true });

      // Ingest in background
      bioAnalyticsService.trackEvent({
        pageId,
        eventType: 'click',
        blockId,
        visitorId,
        referrer,
        userAgent,
        ip,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/linkinbio/analytics/:pageId
   * Authenticated analytics dashboard breakdown
   */
  async getAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageId } = req.params;
      const days = parseInt(req.query.days || '30', 10);

      const summary = await bioAnalyticsService.getAnalytics(pageId, userId, days);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/linkinbio/subscribe/:pageId
   * Public email newsletter capture endpoint
   */
  async subscribe(req, res, next) {
    try {
      const { pageId } = req.params;
      const { email, source } = req.body;

      const subscriber = await bioAnalyticsService.addSubscriber(pageId, email, source);

      return res.status(201).json({
        success: true,
        message: 'Successfully subscribed!',
        data: { email: subscriber.email },
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioAnalyticsController();
