import prisma from "../../../database/postgres.js";
import { redis, redisAvailable } from "../../../cache/redis.client.js";
import logger from "../../../monitoring/logger.js";

const BATCH_SIZE = 500;

const publicProfileAnalyticsProcessor = async () => {
  if (!redisAvailable) return;

  try {
    // Pop up to BATCH_SIZE items from the queue
    const eventsToProcess = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const item = await redis.lpop('public_profile_analytics_queue');
      if (!item) break;
      eventsToProcess.push(JSON.parse(item));
    }

    if (eventsToProcess.length === 0) return;

    logger.info(`📊 [ANALYTICS-SYNC] Flushing ${eventsToProcess.length} PublicProfile events to Postgres...`);

    const data = eventsToProcess.map(event => ({
      publicProfileId: event.profileId,
      event_type: event.eventType,
      blockId: event.blockId,
      visitor_id: event.visitor_id,
      referrer: event.referrer,
      device_type: event.device_type,
      created_at: new Date(event.created_at)
    }));

    await prisma.publicProfileAnalytics.createMany({
      data,
      skipDuplicates: true
    });

    logger.info(`✅ [ANALYTICS-SYNC] Successfully flushed ${eventsToProcess.length} events.`);
  } catch (error) {
    logger.error(`❌ [ANALYTICS-SYNC] Failed to flush events: ${error.message}`);
    // Ideally we would push the failed events back to the queue or a dead-letter queue, but skipping for simplicity
  }
};

export default publicProfileAnalyticsProcessor;
