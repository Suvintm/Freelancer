import { consentRepository } from '../repositories/consent.repository.js';
import {
  hashString,
  hashClientIp,
  hashDevice,
  extractClientCountry,
  getYearMonth,
} from '../utils/consent-hash.utils.js';
import logger from '../../../infrastructure/monitoring/logger.js';

export const consentService = {
  /**
   * Processes and logs a user consent decision
   * @param {import('express').Request} req
   * @param {object} payload
   * @returns {Promise<object>}
   */
  async processConsentLog(req, payload) {
    const {
      visitorId,
      consentVersion = '1.0.0',
      userRole = 'guest',
      categories = {},
      action = 'custom_save',
      isMinor = false,
    } = payload;

    // DPDP Section 9 Child Protection: If user is under 18, no analytics or marketing permitted
    const underAge = Boolean(isMinor);
    const analytics = underAge ? false : Boolean(categories.analytics);
    const marketing = underAge ? false : Boolean(categories.marketing);
    const functional = Boolean(categories.functional);

    // Privacy hashing
    const visitorHash = hashString(visitorId || 'ANONYMOUS_' + Date.now());
    const ipHash = hashClientIp(req);
    const deviceHash = hashDevice(req);
    const countryCode = extractClientCountry(req);
    const yearMonth = getYearMonth();

    // Authenticated user check (if JWT auth middleware attached req.user)
    const userId = req.user?.id || req.user?.userId || payload.userId || null;

    const consentRecord = await consentRepository.createConsentLog({
      userId,
      visitorHash,
      consentVersion,
      userRole,
      necessary: true, // Always true
      analytics,
      functional,
      marketing,
      action,
      countryCode,
      deviceHash,
      ipHash,
      yearMonth,
    });

    logger.info('User consent log recorded successfully', {
      consentId: consentRecord.id,
      visitorHash,
      action,
      countryCode,
    });

    return {
      success: true,
      consentId: consentRecord.id,
      consentVersion: consentRecord.consentVersion,
      recordedAt: consentRecord.createdAt,
    };
  },

  /**
   * Links past anonymous visitor logs upon login
   * @param {string} visitorId
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async linkVisitorOnAuth(visitorId, userId) {
    if (!visitorId || !userId) return 0;
    const visitorHash = hashString(visitorId);
    return await consentRepository.linkVisitorLogsToUser(visitorHash, userId);
  },
};
