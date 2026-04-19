import storage from "../modules/storage/storage.service.js";
import logger from "./logger.js";
import crypto from "crypto";

/**
 * PRODUCTION-GRADE UNIVERSAL STORAGE SERVICE
 * 
 * This service acts as the central hub for all file operations (Cloudinary, and potentially AWS S3/R2).
 * By centralizing these operations, we ensure consistency, better logging, and easy migration
 * between storage providers.
 */

const DEFAULT_AVATAR = "https://cdn.suvix.in/assets/default-avatar.png";

/**
 * Mirror an image from a URL to our storage provider (S3)
 * 
 * @param {string} url - The source image URL
 * @param {string} folder - Destination folder (e.g., 'youtube-thumbnails')
 * @returns {Promise<string>} - The mirrored secure URL
 */
export const uploadFromUrl = async (url, folder = "general") => {
  try {
    if (!url) return DEFAULT_AVATAR;
    
    logger.info(`💾 [STORAGE] Mirroring URL to S3 folder: ${folder}`);
    
    const mirroredUrl = await storage.mirrorRemoteUrl(url, folder);
    
    return mirroredUrl;
  } catch (error) {
    logger.error(`❌ [STORAGE] Mirroring failed: ${error.message}`);
    // Rollback to default avatar to prevent UI breakage
    return DEFAULT_AVATAR;
  }
};

/**
 * Upload a raw file buffer to our storage provider (S3)
 * 
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} folder - Destination folder (e.g., 'avatars', 'kyc')
 * @param {Object} options - Additional options (userId, filename, etc.)
 * @returns {Promise<Object>} - Standardized result object with secure_url (the key)
 */
export const uploadBuffer = async (fileBuffer, folder = "general", options = {}) => {
  try {
    const { userId = "system", filename: customFilename, contentType = "image/jpeg" } = options;
    
    // 🏷️ Standardized Key Strategy: uploads/{folder}/{timestamp}_{random}.{ext}
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    const filename = customFilename || `${timestamp}_${random}.${contentType.split("/")[1] || "jpg"}`;
    
    const key = `uploads/${folder}/${userId}/${filename}`;
    
    logger.info(`💾 [STORAGE] Uploading buffer to S3: ${key}`);
    
    await storage.uploadObject(fileBuffer, key, {
      contentType,
      isPublic: true // Avatars/General thumbails are public for CDN
    });
    
    return {
      secure_url: key, // We store the key, smartResolveMediaUrl handles the rest
      public_id: key,
      key
    };
  } catch (error) {
    logger.error(`❌ [STORAGE] Buffer upload failed: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a file from the storage provider (S3)
 * 
 * @param {string} key - The S3 Key
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (key) => {
  try {
    if (!key) return false;
    
    logger.info(`🗑️ [STORAGE] Deleting asset from S3: ${key}`);
    
    await storage.deleteObjects([key]);
    
    return true;
  } catch (error) {
    logger.error(`❌ [STORAGE] Deletion failed: ${error.message}`);
    return false;
  }
};

/**
 * Generate a secure, signed URL for temporary file access (S3)
 * 
 * @param {string} key - S3 Key
 * @param {Object} options - Validity options
 * @returns {Promise<string>} - The signed URL
 */
export const getSignedAccessUrl = async (key, options = {}) => {
  const { expiresIn = 86400 } = options;
  return await storage.getSignedUrl(key, expiresIn);
};

/**
 * Helper: Generate a unique, professional public ID for brand assets
 */
export const generateUniqueId = (prefix, folder) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `${folder}/${prefix}_${timestamp}_${random}`;
};

export default {
  uploadFromUrl,
  uploadBuffer,
  deleteFile,
  getSignedAccessUrl,
  generateUniqueId,
  DEFAULT_AVATAR,
};
