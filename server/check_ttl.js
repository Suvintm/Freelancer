import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";

async function checkNoTtlKeys() {
  const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
  
  try {
    const keys = await redis.keys("*");
    let immortalCount = 0;
    const immortalPrefixes = {};

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        immortalCount++;
        const prefix = key.split(":")[0]; // Get top-level folder
        immortalPrefixes[prefix] = (immortalPrefixes[prefix] || 0) + 1;
      }
    }

    console.log(`\n=== IMMORTAL KEYS REPORT ===`);
    console.log(`Total Keys in Redis: ${keys.length}`);
    console.log(`Keys with NO Expiration (TTL = -1): ${immortalCount}`);
    
    if (immortalCount > 0) {
      console.log(`\nBreakdown by prefix:`);
      for (const [prefix, count] of Object.entries(immortalPrefixes)) {
        console.log(`- ${prefix}: ${count} keys`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    process.exit(1);
  } finally {
    redis.quit();
  }
}

checkNoTtlKeys();
