import crypto from "crypto";

/**
 * 🛠️ S3 UTILITY HELPERS
 * 
 * Logic that doesn't belong in the service layer but is required for 
 * consistency across storage operations.
 */

/**
 * Build a professional, unique file path (Key) for S3
 * 
 * @param {string} name - The name of the file (e.g., 'original', 'feed', 'thumb')
 * @param {string} folder - Folder from STORAGE_FOLDERS constants
 * @param {string} userId - User ID for scoping
 * @param {string} mediaId - Media ID for grouping original + variants
 * @param {string} originalExt - Original extension for RAW files
 * @param {string} enforcedExt - Force a specific extension (e.g. 'webp')
 * @returns {string} - The sanitized, unique S3 Key
 */
export const buildS3Key = (name, folder, userId, mediaId, originalExt = null, enforcedExt = null) => {
  const cleanName = (name || "original")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .substring(0, 30);
  
  // RAW files keep original extension. Processed files use optimized (webp/mp4)
  let ext = enforcedExt || (originalExt ? originalExt.replace(".", "") : (folder.includes("video") ? "mp4" : "webp"));
  
  if (folder.includes("raw") && !originalExt && !enforcedExt) {
     // Safety fallback if no extension provided for raw
     ext = "bin"; 
  }

  return `${folder}/${userId}/${mediaId}/${cleanName}.${ext}`;
};

/**
 * Map common file extensions to human-readable Content-Types
 * useful for S3 Content-Type headers to ensure correct browser behavior.
 */
export const getContentType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "mp4": "video/mp4",
    "pdf": "application/pdf"
  };
  return map[ext] || "application/octet-stream";
};

export default {
  buildS3Key,
  getContentType
};
