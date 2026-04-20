import "dotenv/config";
import { prisma, connectDB } from "./config/db.js";
import logger from "./utils/logger.js";

async function main() {
  try {
    await connectDB();
    const adminCount = await prisma.superAdmin.count();
    logger.info(`✅ Prisma Test: Connection successful. Found ${adminCount} SuperAdmins.`);
  } catch (error: any) {
    logger.error(`❌ Prisma Test Failed: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

main();
