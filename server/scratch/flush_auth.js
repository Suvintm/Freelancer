import { redis } from "../config/redisClient.js";
import logger from "../utils/logger.js";

async function flushAuthCache() {
  try {
    console.log('--- REDIS AUTH CACHING PURGE ---');
    const keys = await redis.keys("cache:user:*");
    
    if (keys.length === 0) {
      console.log('✅ No user profile cache keys found. Cache is already clean.');
      process.exit(0);
    }

    console.log(`⚠️  Found ${keys.length} stale user profile keys. Purging...`);
    
    // Batch delete to avoid blocking Redis if there are many keys
    const pipe = redis.pipeline();
    keys.forEach(key => pipe.del(key));
    await pipe.exec();

    console.log('✅ Success! Authentication cache has been flushed.');
    console.log('🚀 Next request for any profile will hit the Database fresh.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to flush Redis cache:', error);
    process.exit(1);
  }
}

flushAuthCache();
