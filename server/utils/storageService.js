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

const DEFAULT_AVATAR = "https://suvix-media-storage.s3.ap-south-1.amazonaws.com/assets/default-avatar.png";

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
 * Upload a raw file buffer to our storage provider (e.g., from Multer)
 * 
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} folder - Destination folder
 * @param {Object} options - Additional Cloudinary options (transformations, etc.)
 * @returns {Promise<Object>} - The full Cloudinary upload result
 */
export const uploadBuffer = async (fileBuffer, folder = "general", options = {}) => {
  return new Promise((resolve, reject) => {
    logger.info(`💾 [STORAGE] Uploading buffer to folder: ${folder}`);
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `suvix/${folder}`,
        resource_type: "auto",
        access_mode: "public",
        ...options
      },
      (error, result) => {
        if (error) {
          logger.error(`❌ [STORAGE] Buffer upload failed: ${error.message}`);
          return reject(new Error(`Upload failed: ${error.message}`));
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Delete a file from the storage provider
 * 
 * @param {string} publicId - The Cloudinary public ID or R2 Key
 * @param {string} resourceType - 'image', 'video', or 'raw'
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (publicId, resourceType = "auto") => {
  try {
    if (!publicId) return false;
    
    logger.info(`🗑️ [STORAGE] Deleting asset: ${publicId}`);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true, // Clear CDN cache
    });
    
    return result.result === "ok";
  } catch (error) {
    logger.error(`❌ [STORAGE] Deletion failed: ${error.message}`);
    return false;
  }
};

/**
 * Generate a secure, signed URL for temporary file access
 * Used for Final Output Delivery where files are not public.
 * 
 * @param {string} publicId - Asset ID
 * @param {Object} options - Validity and format options
 * @returns {string} - The signed URL
 */
export const getSignedAccessUrl = (publicId, options = {}) => {
  const { expiresIn = 86400, resourceType = "video", format } = options;
  const expiresAt = Math.round(Date.now() / 1000) + expiresIn;

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    format: format,
    sign_url: true,
    type: "authenticated",
    expires_at: expiresAt,
    secure: true,
    flags: "attachment", // Force download for final outputs
  });
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
