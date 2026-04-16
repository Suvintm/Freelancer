import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * 🧹 DB PURGE SCRIPT
 * Deletes all Posts and Media records from the database.
 */
async function purgeMediaData() {
  logger.info("🧹 [PURGE] Starting database cleanup...");

  try {
    // 1. Delete all Media
    const mediaCount = await prisma.media.deleteMany({});
    logger.info(`🗑️ [PURGE] Deleted ${mediaCount.count} media records.`);

    // 2. Delete all Posts
    const postCount = await prisma.post.deleteMany({});
    logger.info(`🗑️ [PURGE] Deleted ${postCount.count} post records.`);

    logger.info("✅ [PURGE] Database cleanup complete.");
  } catch (error) {
    logger.error(`❌ [PURGE] Failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

purgeMediaData();
