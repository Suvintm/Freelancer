import sharp from "sharp";
import { buildS3Key, getContentType } from "../providers/s3/s3.utils.js";
import { STORAGE_FOLDERS } from "../providers/s3/s3.constants.js";
import storage from "../storage.service.js";
import logger from "../../../utils/logger.js";

/**
 * 🖼️ IMAGE PROCESSOR (PRODUCTION READY)
 * 
 * Handles compression, formatting, and variant generation.
 */

const VARIANT_SIZES = {
  THUMB: 360,
  FEED: 720,
  FULL: 1080
};

/**
 * Process an image and generate production-ready variants
 * 
 * @param {Buffer} rawBuffer - Original image bytes
 * @param {string} userId - Owner ID for path building
 * @param {string} postId - Media ID
 * @param {string} filename - Original filename for extension extraction
 * @returns {Promise<object>} - Mapping of variants to S3 keys/URLs
 */
export const processImage = async (rawBuffer, userId, postId, filename = "image.jpg") => {
  try {
    logger.info(`🖼️ [PROCESSOR] Starting image pipeline for: ${postId}`);

    const results = {};
    const pipeline = sharp(rawBuffer)
      .rotate() // Auto-rotate based on EXIF
      .webp({ quality: 80 }); // Convert all to WebP for massive savings

    // Generate variants in parallel
    const variantPromises = Object.entries(VARIANT_SIZES).map(async ([name, width]) => {
      const resizedBuffer = await pipeline
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .toBuffer();

      const key = buildS3Key(`${name.toLowerCase()}.webp`, STORAGE_FOLDERS.IMAGES, `${userId}/${postId}`);
      
      await storage.uploadObject(resizedBuffer, key, {
        contentType: "image/webp"
      });

      results[name.toLowerCase()] = key;
    });

    // Also store one "Original" archive as WebP but full size
    variantPromises.push((async () => {
      const originalBuffer = await pipeline.toBuffer();
      const key = buildS3Key("original.webp", STORAGE_FOLDERS.IMAGES, `${userId}/${postId}`);
      await storage.uploadObject(originalBuffer, key, { contentType: "image/webp" });
      results.original = key;
    })());

    await Promise.all(variantPromises);

    logger.info(`✅ [PROCESSOR] Image variants generated for: ${postId}`);
    return results;
  } catch (error) {
    logger.error(`❌ [PROCESSOR] Pipeline failed: ${error.message}`);
    throw error;
  }
};

export default { processImage };
