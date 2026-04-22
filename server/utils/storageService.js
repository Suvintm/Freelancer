import storage from "../modules/storage/storage.service.js";
import logger from "./logger.js";
import crypto from "crypto";
import axios from "axios";
import sharp from "sharp";

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
 * Download, Process (Optimize), and Mirror an image from a URL
 * 
 * @param {string} url - Source image URL
 * @param {string} folder - Destination folder
 * @param {Object} options - { width, height, quality }
 */
export const optimizeAndMirrorUrl = async (url, folder = "general", options = {}) => {
  try {
    if (!url) return DEFAULT_AVATAR;
    const { quality = 85, format = "webp" } = options;

    logger.info(`🛰️ [STORAGE] Optimizing & Mirroring: ${url}`);
    
    // 1. Download
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const inputBuffer = Buffer.from(response.data);

    // 2. Process with Sharp
    let pipeline = sharp(inputBuffer);
    
    if (format === "webp") {
      pipeline = pipeline.webp({ quality, lossless: false, smartSubsample: true });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const processedBuffer = await pipeline.toBuffer();
    const contentType = `image/${format}`;

    // 3. Upload Optimized Version
    const timestamp = Date.now();
    const hash = crypto.createHash("md5").update(url).digest("hex");
    const filename = `${hash}_opt.${format}`;
    const key = `${folder}/${filename}`;

    await storage.uploadObject(processedBuffer, key, { contentType });
    
    logger.info(`✅ [STORAGE] Optimization Complete: ${key} (${processedBuffer.length} bytes)`);
    return key;
  } catch (error) {
    logger.error(`❌ [STORAGE] Optimization failed: ${error.message}`);
    return uploadFromUrl(url, folder); // Fallback to raw mirror if sharp fails
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
export const deleteFile = async (keys) => {
  try {
    if (!keys) return false;
    
    // 🛡️ Robust normalization: Handle single string or array of strings
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.length === 0) return true;

    logger.info(`🗑️ [STORAGE] Deleting ${keyArray.length} asset(s) from S3...`);
    
    await storage.deleteObjects(keyArray);
    
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
  optimizeAndMirrorUrl,
  uploadBuffer,
  deleteFile,
  getSignedAccessUrl,
  generateUniqueId,
  DEFAULT_AVATAR,
};
