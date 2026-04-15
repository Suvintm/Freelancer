/**
 * ☁️ CLOUDFLARE R2 CONSTANTS
 *
 * R2 bucket names, CDN base URL, and folder paths.
 * Folder structure mirrors S3 exactly for seamless switching.
 */

export const R2_BUCKET_NAME = process.env.CF_R2_BUCKET;
export const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
export const R2_ENDPOINT = process.env.CF_R2_ENDPOINT;

// Public CDN base URL (Cloudflare serves this from R2 origin)
export const CDN_BASE_URL = process.env.CDN_BASE_URL || "https://cdn.suvix.in";

/**
 * 📂 FOLDER STRUCTURE (mirrors s3.constants.js)
 * Keep in sync with S3 paths for seamless provider switching.
 */
export const R2_FOLDERS = {
  RAW: "raw",
  IMAGES: "images",
  VIDEOS: "videos",
  STORIES: "stories",
  AVATARS: "avatars",
  PROTECTED: "protected/deliverables",
};

export default { R2_BUCKET_NAME, CDN_BASE_URL, R2_FOLDERS };
