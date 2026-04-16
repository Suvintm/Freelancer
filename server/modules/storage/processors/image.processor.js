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
  THUMB: 360,
  FEED: 720,
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

export const processImage = async (rawBuffer, userId, mediaId) => {
  try {
    logger.info(`🖼️ [PROCESSOR] Processing Image: ${mediaId}`);

    // 1. Extract Metadata (Dimensions and Size)
    const metadata = await sharp(rawBuffer).metadata();
    const { width, height, size, format } = metadata;
    logger.info(`📸 [SHARP] Format: ${format.toUpperCase()} | Dimensions: ${width}x${height} | Size: ${(size / 1024).toFixed(2)}KB`);
    if (format === 'heic') logger.info('💡 [SHARP] Converting HEIC to optimized webp format...');

    // 2. Generate Blurhash (Premium Feature)
    logger.info(`✨ [BLURHASH] Generating elite visual placeholder...`);
    const blurhash = await generateBlurhash(rawBuffer);

    const variants = {};
    const pipeline = sharp(rawBuffer).rotate().webp({ quality: 80 });

    // 3. Generate Variants
    logger.info(`🎨 [VARIANTS] Generating 3 optimized versions (Instagram Style)...`);
    const variantPromises = Object.entries(VARIANT_SIZES).map(async ([name, width]) => {
      logger.info(`   🚜 Resizing -> ${name} (${width}px)...`);
      const resizedBuffer = await pipeline
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .toBuffer();

      const key = buildS3Key(name.toLowerCase(), STORAGE_FOLDERS.IMAGES, userId, mediaId);
      await storage.uploadObject(resizedBuffer, key, { contentType: "image/webp" });
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
