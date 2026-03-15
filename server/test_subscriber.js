import "dotenv/config";
import { subscribe } from "./config/redisClient.js";

async function run() {
    console.log("👂 Listening for admin:events...");
    await subscribe("admin:events", (payload) => {
        console.log("📡 EVENT RECEIVED IN TEST SUBSCRIBER:", JSON.stringify(payload, null, 2));
        process.exit(0);
    });
}

run().catch(console.error);
setTimeout(() => {
    console.log("⏱️ Timeout: No event received after 20 seconds.");
    process.exit(1);
}, 20000);
