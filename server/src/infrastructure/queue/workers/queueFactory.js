import { Queue } from "bullmq";
import { getRedisConnection } from "./connection.js";

/**
 * 🏭 QUEUE FACTORY
 *
 * All queues are created through this factory to guarantee
 * production-safe defaults. No one-off queue configurations.
 *
 * Production defaults:
 * - removeOnComplete: Keep jobs for 60s (traceability) then delete
 * - removeOnFail:     Keep failed jobs for 1 hour (debugging) then delete
 * - attempts: 3       (fail after 3 attempts, not infinite)
 * - backoff: exponential 2s → 4s → 8s
 */

// === PRODUCTION DEFAULT JOB OPTIONS ===
const PRODUCTION_DEFAULTS = {
  removeOnComplete: {
    age: 60,      // Delete completed jobs after 60 seconds
    count: 500,   // Keep max 500 completed (safety net for dashboard)
  },
  removeOnFail: {
    age: 3600,    // Keep failed jobs for 1 hour for debugging
    count: 100,   // Max 100 failed jobs retained
  },
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,  // 2s → 4s → 8s
  },
};

// Singleton registry — prevents multiple instances of the same queue
const _queueInstances = new Map();

/**
 * Create or retrieve a BullMQ queue with production-safe defaults
 * @param {string} name - Queue name
 * @param {object} customDefaults - Override default job options
 * @returns {Queue}
 */
export function createQueue(name, customDefaults = {}) {
  if (_queueInstances.has(name)) {
    return _queueInstances.get(name);
  }

  const connection = getRedisConnection();
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      ...PRODUCTION_DEFAULTS,
      ...customDefaults,
    },
  });

  // Mute queue-level errors to prevent process crash
  queue.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      console.error(`[Queue:${name}] Error: ${err.message}`);
    }
  });

  _queueInstances.set(name, queue);
  return queue;
}

export default { createQueue };
