import bioPublicService from '../services/bioPublicService.js';

export class BioPublicController {
  /**
   * GET /api/linkinbio/public/:username/:slug?
   * Ultra-fast public visitor profile endpoint (with Redis caching)
   */
  async getPublicProfile(req, res, next) {
    try {
      const { username, slug } = req.params;
      const data = await bioPublicService.getPublicProfile(username, slug);

      // Set public caching headers for CDNs / edge proxies (e.g. Vercel / Cloudflare)
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
