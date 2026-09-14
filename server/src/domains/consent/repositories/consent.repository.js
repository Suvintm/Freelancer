import prisma from '../../../infrastructure/database/postgres.js';
import logger from '../../../infrastructure/monitoring/logger.js';

export const consentRepository = {
  /**
   * Persists a consent record directly to PostgreSQL
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createConsentLog(data) {
    try {
      return await prisma.userConsentLog.create({
        data: {
          userId: data.userId || null,
          visitorHash: data.visitorHash,
          consentVersion: data.consentVersion || '1.0.0',
          userRole: data.userRole || 'guest',
          necessary: true, // Always true per compliance
          analytics: Boolean(data.analytics),
          functional: Boolean(data.functional),
          marketing: Boolean(data.marketing),
          action: data.action || 'custom_save',
          countryCode: data.countryCode || 'UNKNOWN',
          deviceHash: data.deviceHash || null,
          ipHash: data.ipHash || null,
          yearMonth: data.yearMonth,
        },
      });
    } catch (error) {
      logger.error('Failed to persist user consent log to PostgreSQL', {
        error: error.message,
        visitorHash: data.visitorHash,
      });
      throw error;
    }
  },

  /**
   * Finds latest consent record for a user or visitor
   * @param {string|null} userId
   * @param {string} visitorHash
   * @returns {Promise<object|null>}
   */
  async getLatestConsent(userId, visitorHash) {
    try {
      const whereClause = userId
        ? { OR: [{ userId }, { visitorHash }] }
        : { visitorHash };

      return await prisma.userConsentLog.findFirst({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to retrieve consent status', {
        error: error.message,
        userId,
        visitorHash,
      });
      return null;
    }
  },

  /**
   * Associates past visitor consent logs with a newly authenticated user
   * @param {string} visitorHash
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async linkVisitorLogsToUser(visitorHash, userId) {
    try {
      if (!visitorHash || !userId) return 0;
      const res = await prisma.userConsentLog.updateMany({
        where: {
          visitorHash,
          userId: null,
        },
        data: { userId },
      });
      return res.count;
    } catch (error) {
      logger.warn('Failed to link visitor consent logs to user', {
        error: error.message,
        visitorHash,
        userId,
      });
      return 0;
    }
  },
};
