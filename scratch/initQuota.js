import quotaManager from "../server/modules/youtube-creator/services/youtubeQuotaManager.js";
import logger from "../server/utils/logger.js";

async function run() {
  try {
    await quotaManager.initializeQuota();
    const status = await quotaManager.getStatus();
    console.log("📊 [QUOTA STATUS]:", JSON.stringify(status, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("❌ Initialization failed:", err);
    process.exit(1);
  }
}

run();
