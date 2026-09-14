import { consentService } from '../services/consent.service.js';
import { asyncHandler } from '../../../shared/middleware/error-handler.middleware.js';

export const consentController = {
  /**
   * Records user/visitor consent decision
   * POST /api/v1/consent/log
   */
  recordConsent: asyncHandler(async (req, res) => {
    const { visitorId, action, categories } = req.body;

    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing visitorId',
      });
    }

    const result = await consentService.processConsentLog(req, req.body);

    return res.status(200).json({
      success: true,
      message: 'Consent decision recorded successfully',
      data: result,
    });
  }),
};
