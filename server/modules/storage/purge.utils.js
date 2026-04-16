import storage from "./storage.service.js";
import logger from "../../utils/logger.js";

/**
 * 🔥 DEEP PURGE MEDIA FILES
 * 
 * This is the "Clean-as-you-go" engine. 
 * It ensures that when a post is deleted, absolutely no data is left 
 * behind in S3 to bleed your wallet.
 */
export const purgeMediaFiles = async (media) => {
  try {
    const { id, userId, storageKey, type, variants } = media;
    const keysToDelete = [];

    // 1. Add Original RAW Key
    if (storageKey) keysToDelete.push(storageKey);

    // 2. Add Processed Variant Keys (thumb, feed, full)
    if (variants && typeof variants === "object") {
      Object.values(variants).forEach(val => {
        if (typeof val === "string") keysToDelete.push(val);
      });
    }

    // 3. Delete individual files
    if (keysToDelete.length > 0) {
      await storage.deleteObjects(keysToDelete);
    }

    // 4. DEEP HLS CLEANUP
    // If it's a video, we must delete the entire HLS directory
    if (type === "VIDEO") {
      const hlsPrefix = `uploads/processed/videos/${userId}/${id}/hls`;
      await storage.deleteFolder(hlsPrefix);
    }

    logger.info(`🔥 [PURGE] Successfully wiped all S3 data for Media: ${id}`);
    return true;
  } catch (error) {
    logger.error(`❌ [PURGE] Failure for Media ${media?.id}: ${error.message}`);
    return false;
  }
};

export default { purgeMediaFiles };
