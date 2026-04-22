import quotaManager from "../server/modules/youtube-creator/services/youtubeQuotaManager.js";
import prisma from "../server/config/prisma.js";
import logger from "../server/utils/logger.js";

async function run() {
  try {
    console.log("🚀 [TEST] Testing Quota Foundation...");
    
    // 1. Initial status
    let status = await quotaManager.getStatus();
    console.log(`📊 Initial Balance: ${status.remaining_units}`);

    // 2. Consume 100 units
    console.log("Spending 100 units...");
    await quotaManager.consume(100);
    status = await quotaManager.getStatus();
    console.log(`📊 Balance after -100: ${status.remaining_units}`);

    // 3. Try to consume 10,000 (should fail)
    console.log("Trying to spend 10,000 units (Exhaustion Test)...");
    try {
      await quotaManager.consume(10000);
    } catch (err) {
      console.log(`✅ Correctly caught exhaustion: ${err.message}`);
    }

    // 4. Verification in DB
    status = await quotaManager.getStatus();
    console.log(`📊 Final Balance in DB: ${status.remaining_units}`);
    
    if (status.remaining_units === 9900) {
      console.log("🎉 SUCCESS: Quota foundation is solid and accurate.");
    } else {
      console.log("❌ FAILURE: Units were not tracked correctly.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
}

run();
