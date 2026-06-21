import 'dotenv/config';
import client from "../config/redisClient.js";

const clearCache = async () => {
  try {
    console.log("🧹 Connecting to Redis...");
    
    // Wait a brief moment to let connection establish
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Get all keys matching "cache:*" using proxy call
    const keys = await client.call("keys", "cache:*");
    console.log(`🔍 Found ${keys ? keys.length : 0} cached keys:`, keys);
    
    if (keys && keys.length > 0) {
      await client.del(...keys);
      console.log("🗑️ Deleted all cache keys!");
    } else {
      console.log("No cache keys found.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to clear Redis cache:", error);
    process.exit(1);
  }
};

clearCache();
