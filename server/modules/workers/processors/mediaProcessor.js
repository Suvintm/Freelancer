import prisma from "../../../config/prisma.js";
import storage from "../../storage/storage.service.js";
import { processImage } from "../../storage/processors/image.processor.js";
import { processVideo } from "../../storage/processors/video.processor.js";
import { hashFile, findDuplicate } from "../../storage/processors/dedup.processor.js";
import logger from "../../../utils/logger.js";

/**
 * 🎬 MEDIA PROCESSOR
 * Core logic for optimizing images and videos.
 * Decoupled from the BullMQ Worker logic for future-proofing (Kafka/RabbitMQ).
 */
const mediaProcessor = async (job) => {
  const { mediaId, userId, key, type } = job.data;
  logger.info(`👷 [WORKER] Processing Media: ${mediaId} (${type})`);

  try {
    // 1. Fetch RAW file from S3
    const rawBuffer = await storage.getObject(key);
    let results = {};

    // 2. DEDUPLICATION CHECK (Production Feature)
    const hash = hashFile(rawBuffer);
    const duplicate = await findDuplicate(hash);

    if (duplicate) {
      logger.info(`♻️ [WORKER] Duplicate found for ${mediaId}. Reusing existing data.`);
      results = {
        variants: duplicate.variants,
        blurhash: duplicate.blurhash,
        width: duplicate.width,
        height: duplicate.height,
        duration: duplicate.duration,
        size: duplicate.size,
        hash: hash
      };
    } else {
      // 3. Process fresh content (with Metadata Extraction)
      if (type === "VIDEO") {
        results = await processVideo(rawBuffer, userId, mediaId);
      } else {
        results = await processImage(rawBuffer, userId, mediaId);
      }
      results.hash = hash;
    }

    // 4. Update Database
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...results,
        status: "READY",
      },
    });

    logger.info(`✨ [WORKER] Media READY: ${mediaId}`);
    return results;

  } catch (error) {
    logger.error(`❌ [WORKER] Job ${job.id} FAILED: ${error.message}`);
    
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: "FAILED" },
    });

    throw error; 
  }
};

export default mediaProcessor;
