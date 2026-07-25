import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
import { getRedisConnection } from "./src/infrastructure/queue/workers/connection.js";

async function checkRepeatable() {
  const connection = getRedisConnection();
  const queue = new Queue("like-sync", { connection });
  try {
    const repeatables = await queue.getRepeatableJobs();
    console.log("Repeatable Jobs for like-sync:", repeatables);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkRepeatable();
