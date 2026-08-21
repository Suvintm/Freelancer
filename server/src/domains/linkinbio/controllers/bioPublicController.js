import bioPublicService from '../services/bioPublicService.js';

const BOT_USER_AGENTS = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|Discordbot|LinkedInBot|Slackbot|Applebot|Googlebot|bingbot|SkypeUriPreview/i;

export class BioPublicController {
  /**
   * GET /api/linkinbio/public/:username/:slug?
   * Ultra-fast public visitor profile endpoint (with Redis caching & Crawler OpenGraph support)
   */
  async getPublicProfile(req, res, next) {
    try {
      const { username, slug } = req.params;
      const userAgent = req.headers['user-agent'] || '';
      const acceptsHtml = (req.headers.accept || '').includes('text/html');

      const data = await bioPublicService.getPublicProfile(username, slug);

      // 1. Social Crawler Detection: Serve OpenGraph HTML to WhatsApp/Instagram/Twitter crawlers
      if (BOT_USER_AGENTS.test(userAgent) || (acceptsHtml && req.query.format === 'html')) {
        const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const ogHtml = bioPublicService.generateOpenGraphHtml(data, fullUrl);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600');
        return res.status(200).send(ogHtml);
      }

      // 2. Standard JSON response for SPA visitors
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioPublicController();
