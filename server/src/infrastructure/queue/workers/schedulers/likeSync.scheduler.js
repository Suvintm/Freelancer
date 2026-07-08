import logger from '../../../monitoring/logger.js';
import { likeSyncQueue } from '../queues.js';

export function startLikeSyncScheduler() {
  // Run every 60 seconds
  setInterval(async () => {
    try {
      await likeSyncQueue.add('sync-likes-to-postgres', {}, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
      logger.info('Enqueued like sync job');
    } catch (err) {
      logger.error('Failed to enqueue like sync', err);
    }
  }, 60000);
}
