/**
 * 📋 MEDIA JOB HELPERS
 *
 * Defines job payload types and enqueue helper functions.
 * Use these helpers across the app to fire media processing jobs.
 *
 * TODO (Phase 2): Implement job enqueue logic.
 */

/**
 * Enqueue an image processing job
 * @param {object} payload - { userId, postId, rawS3Key, mediaType }
 */
export const enqueueImageJob = async (payload) => {
  // TODO: Add to mediaQueue
};

/**
 * Enqueue a video processing job
 * @param {object} payload - { userId, postId, rawS3Key }
 */
export const enqueueVideoJob = async (payload) => {
  // TODO: Add to mediaQueue
};

export default { enqueueImageJob, enqueueVideoJob };
