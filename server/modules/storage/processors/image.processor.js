import sharp from "sharp";
import { encode } from "blurhash";
import { buildS3Key } from "../providers/s3/s3.utils.js";
import { STORAGE_FOLDERS } from "../providers/s3/s3.constants.js";
import storage from "../storage.service.js";
import logger from "../../../utils/logger.js";

/**
 * 🖼️ IMAGE PROCESSOR (PRODUCTION READY)
 */

const VARIANT_SIZES = {
  THUMB: 480,
  FEED: 1024,
  FULL: 1080
};

/**
 * Generate a Blurhash from an image buffer
 */
const generateBlurhash = async (buffer) => {
  try {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch (err) {
    logger.error(`⚠️ [BLURHASH] Failed: ${err.message}`);
    return null;
  }
};

export const processImage = async (rawBuffer, userId, mediaId, folder = STORAGE_FOLDERS.IMAGES, options = {}) => {
  try {
    const { cacheControl } = options;
    logger.info(`🖼️ [PROCESSOR] Processing Image: ${mediaId} in folder: ${folder}`);
    
    // ... metadata and blurhash lines ...
    const metadata = await sharp(rawBuffer).metadata();
    const { width, height, size, format } = metadata;
    const blurhash = await generateBlurhash(rawBuffer);

    const variants = {};
    const pipeline = sharp(rawBuffer).rotate().webp({ quality: 90 });

    // 3. Generate Variants
    logger.info(`🎨 [VARIANTS] Generating 3 optimized versions (Instagram Style)...`);
    const variantPromises = Object.entries(VARIANT_SIZES).map(async ([name, width]) => {
      logger.info(`   🚜 Resizing -> ${name} (${width}px)...`);
      const resizedBuffer = await pipeline
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .toBuffer();

      const key = buildS3Key(name.toLowerCase(), folder, userId, mediaId);
      await storage.uploadObject(resizedBuffer, key, { 
        contentType: "image/webp",
        cacheControl: cacheControl 
      });
      variants[name.toLowerCase()] = key;
    });

    await Promise.all(variantPromises);
    logger.info(`✅ [PROCESSOR] Image processing complete for: ${mediaId}`);

    return { 
      variants, 
      blurhash,
      width,
      height,
      size
    };
  } catch (error) {
    logger.error(`❌ [PROCESSOR] Failure: ${error.message}`);
    throw error;
  }
};

export default { processImage };
