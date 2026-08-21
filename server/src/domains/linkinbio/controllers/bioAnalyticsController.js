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
   * GET /api/linkinbio/analytics/overview
   * Authenticated user overview analytics across all bio pages
   */
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id;
      const overview = await bioAnalyticsService.getUserOverview(userId);
      return res.status(200).json({
        success: true,
        data: overview,
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

  /**
   * GET /api/linkinbio/subscribers/:pageId
   * Authenticated creator subscriber list
   */
  async getSubscribers(req, res, next) {
    try {
      const { pageId } = req.params;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);

      const result = await bioAnalyticsRepository.getSubscribers(pageId, page, limit);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/linkinbio/subscribers/:pageId/export-csv
   * Authenticated CSV download stream
   */
  async exportSubscribersCsv(req, res, next) {
    try {
      const { pageId } = req.params;
      const subscribers = await bioAnalyticsRepository.getAllSubscribersForExport(pageId);

      let csv = 'Email,Source Block,Subscribed Date\r\n';
      subscribers.forEach((sub) => {
        const date = new Date(sub.createdAt).toISOString().split('T')[0];
        csv += `"${sub.email}","${sub.source || 'email-capture'}","${date}"\r\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="subscribers-${pageId}.csv"`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export default new BioAnalyticsController();
