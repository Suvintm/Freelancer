import logger from '../../../monitoring/logger.js';
import { scheduleQuotaMaintenance } from '../queues.js';

export function startQuotaResetScheduler() {
  try {
    scheduleQuotaMaintenance();
  } catch (err) {
    logger.error('Failed to schedule quota maintenance', err);
  }
}
