/**
 * 🏔️ AWS S3 CONSTANTS & FOLDER STRUCTURES
 * 
 * Centralized registry for all storage-related settings.
 * Defining standard folder names helps avoid "magic strings" and ensures
 * files are organized for easy lifecycle management (e.g., Auto-deletion for temp files).
 */

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET;
export const S3_REGION = process.env.AWS_REGION;

/**
 * 📂 PRODUCTION FOLDER STRUCTURE
 */
export const STORAGE_FOLDERS = {
  AVATARS: "profile-photos",           // User profile pictures
  THUMBNAILS: "creators/thumbnails",   // YouTube/Video thumbnails
  PORTFOLIO: "creators/portfolio",     // Creator asset uploads
  UPLOADS: "temp/uploads",             // Temporary landing for user uploads
  DRAFTS: "temp/drafts",               // Saved but unpublished content
  FINAL_OUTPUTS: "protected/deliverables" // Client-specific content (Requires Signed URLs)
};

/**
 * 🛠️ CACHE CONTROL POLICIES
 * Common settings for different file types
 */
export const CACHE_POLICIES = {
  IMMUTABLE: "public, max-age=31536000, immutable", // For versioned assets
  DEFAULT: "public, max-age=86400",                 // 24 hours
  PRIVATE: "private, no-cache, no-store, must-revalidate" // Sensitive data
};

export default {
  S3_BUCKET_NAME,
  S3_REGION,
  STORAGE_FOLDERS,
  CACHE_POLICIES
};
