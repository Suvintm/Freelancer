import bioQrService from '../services/bioQrService.js';

export class BioQrController {
  /**
   * POST /api/v1/linkinbio/qr/generate
   */
  async generateQr(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await bioQrService.generateQr(userId, req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/linkinbio/qr/status
   */
  async getQrStatus(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await bioQrService.getQrStatus(userId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new BioQrController();
