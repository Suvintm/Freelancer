/**
 * 🛡️ JOB VALIDATOR
 *
 * Validates job payloads BEFORE any DB writes or S3 operations.
 * "Fail fast" — reject invalid jobs at the gate, not mid-process.
 *
 * GOLDEN RULE: Redis stores JOB REFERENCES, not actual data.
 * - Target: < 1KB per job payload
 * - Maximum: < 10KB (only if absolutely necessary)
 * - NEVER: Buffers, large objects, full user documents
 */

const MAX_PAYLOAD_BYTES = 1024; // 1KB

/**
 * Check payload size
 */
function checkPayloadSize(data) {
  const size = Buffer.byteLength(JSON.stringify(data), "utf8");
  if (size > MAX_PAYLOAD_BYTES) {
    throw new Error(
      `Job payload too large: ${size} bytes (max ${MAX_PAYLOAD_BYTES}). Only store references (IDs, S3 keys), never file buffers.`
    );
  }
}

/**
 * Validate a media processing job payload
 * @param {object} data - job.data
 */
export function validateMediaPayload(data) {
  if (!data.mediaId || typeof data.mediaId !== "string") {
    throw new Error("Invalid job: missing or invalid mediaId");
  }
  if (!data.userId || typeof data.userId !== "string") {
    throw new Error("Invalid job: missing or invalid userId");
  }
  if (!data.key || typeof data.key !== "string") {
    throw new Error("Invalid job: missing or invalid S3 key");
  }
  if (!data.type || !["IMAGE", "VIDEO"].includes(data.type)) {
    throw new Error(`Invalid job: type must be IMAGE or VIDEO, got "${data.type}"`);
  }
  // Prevent S3 path traversal
  if (data.key.includes("..")) {
    throw new Error("Invalid job: S3 key contains path traversal attempt");
  }
  checkPayloadSize(data);
}

/**
 * Validate a YouTube sync job payload
 * @param {object} data - job.data
 */
export function validateYouTubePayload(data) {
  if (!data.userId || typeof data.userId !== "string") {
    throw new Error("Invalid job: missing or invalid userId");
  }
  const channelData = data.channelIds || data.channels;
  if (!channelData || !Array.isArray(channelData)) {
    throw new Error("Invalid job: channel data must be an array (channels or channelIds)");
  }
  if (channelData.length === 0) {
    throw new Error("Invalid job: channel data array is empty");
  }
  checkPayloadSize(data);
}

export default { validateMediaPayload, validateYouTubePayload };
