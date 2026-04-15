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
 * @param {string} filename - Original file name
 * @param {string} folder - Folder from STORAGE_FOLDERS constants
 * @param {string} userId - Optional: Scoping by user ID for security/organization
 * @returns {string} - The sanitized, unique S3 Key
 */
export const buildS3Key = (filename, folder, userId = null) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  
  // 🧼 [CLEANUP] Ensure filename is safe and standardized
  const extension = filename.split(".").pop().toLowerCase();
  const sanitizedName = filename
    .toLowerCase()
    .split(".")[0]
    .replace(/[^a-z0-9]/g, "_")
    .substring(0, 30); // Cap filename length
  
  const base = userId ? `${folder}/${userId}` : folder;
  return `${base}/${timestamp}_${random}_${sanitizedName}.${extension}`;
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
