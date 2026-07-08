/**
 * ☁️ CLOUDFLARE R2 UTILITY HELPERS
 *
 * Re-exports from s3.utils.js — R2 uses identical key structures.
 * This file exists as a pass-through so r2/ is a self-contained module.
 */

export { buildS3Key as buildR2Key, getContentType } from "../s3/s3.utils.js";
