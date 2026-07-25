import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";

async function checkLikeSync() {
  const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");
  
  try {
    const failedCount = await redis.zcard("bull:like-sync:failed"); 

    if (failedCount > 0) {
      const failedJobs = await redis.zrange("bull:like-sync:failed", -5, -1); // get last 5
      console.log("\n[Sample of Recent Failed Jobs Errors]");
      for (const jobId of failedJobs) {
        const jobData = await redis.hgetall(`bull:like-sync:${jobId}`);
        const date = new Date(parseInt(jobData.finishedOn)).toISOString();
        console.log(`Job ${jobId} failed at ${date}: ${jobData.failedReason}`);
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

checkLikeSync();
