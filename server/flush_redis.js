import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";

async function wipeRedis() {
  const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
  
  try {
    console.log("Flushing all keys from local Redis...");
    await redis.flushdb();
    console.log("✅ Successfully wiped Redis DB0.");
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    process.exit(1);
  } finally {
    redis.quit();
  }
}

wipeRedis();
