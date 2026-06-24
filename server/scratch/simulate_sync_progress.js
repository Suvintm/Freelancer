import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env dynamically from the server/ directory relative to this script
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Dynamically import modules to ensure they initialize AFTER dotenv has loaded environment variables
const { publish } = await import("../config/redisClient.js");
const { default: prisma } = await import("../config/prisma.js");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function simulateSync() {
  console.log("🎮 --- STARTING YOUTUBE SYNC PROGRESS SIMULATOR ---");
  
  try {
    const targetEmail = process.argv[2];
    let user = null;

    if (targetEmail) {
      console.log(`🔍 Looking for user with email: ${targetEmail}`);
      user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { youtubeProfiles: true }
      });
    } else {
      console.log("🔍 No email argument provided. Finding the first user in the database...");
      user = await prisma.user.findFirst({
        include: { youtubeProfiles: true }
      });
    }

    if (!user) {
      console.error("❌ No user found to simulate.");
      console.log("💡 Tip: Provide an email as an argument, e.g.: node server/scratch/simulate_sync_progress.js email@example.com");
      return;
    }

    const userId = user.id;
    const channelId = user.youtubeProfiles?.[0]?.channel_id || "UC-test-channel-id";
    const channelName = user.youtubeProfiles?.[0]?.channel_name || "Antigravity Creator";

    console.log(`👤 Found User: ${user.email} (${userId})`);
    console.log(`📺 Channel to simulate: ${channelName} (${channelId})`);

    const emitSyncProgress = async (progress, step, message) => {
      console.log(`📡 Emitting step "${step}" (${progress}%) - ${message}`);
      await publish("admin:events", {
        type: "notification:new",
        userId,
        data: {
          type: "SYNC_PROGRESS",
          metadata: {
            userId,
            progress,
            channelId,
            channelName,
            step,
            message
          }
        }
      });
    };

    // Begin Simulation
    await delay(1000);
    await emitSyncProgress(10, 'connection', 'Connecting to YouTube API...');
    
    await delay(2000);
    await emitSyncProgress(45, 'metadata', 'Fetching channel profile & stats...');
    
    await delay(2000);
    await emitSyncProgress(75, 'videos', 'Syncing video library (up to 50 videos)...');
    
    await delay(2000);
    await emitSyncProgress(95, 'finalize', 'Saving analytics & generating dashboard...');
    
    await delay(2000);
    console.log("📡 Emitting SYNC_COMPLETE...");
    await publish("admin:events", {
      type: "notification:new",
      userId,
      data: {
        type: "SYNC_COMPLETE",
        metadata: {
          type: 'youtube_sync_complete',
          sync_complete: true
        }
      }
    });

    const serializeBigInt = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (Array.isArray(obj)) return obj.map(serializeBigInt);
      if (typeof obj === "object") {
        const newObj = {};
        for (const key of Object.keys(obj)) {
          newObj[key] = serializeBigInt(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    // Also trigger user:profile_updated to trigger UI refresh simulation
    console.log("📡 Emitting user:profile_updated...");
    await publish("admin:events", {
      type: "user:profile_updated",
      userId,
      data: {
        youtubeProfile: serializeBigInt(user.youtubeProfiles || []),
        youtubeVideos: []
      }
    });

    console.log("✅ Simulation successfully executed.");

  } catch (error) {
    console.error("❌ Simulation failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🏁 --- SIMULATION COMPLETE ---");
    process.exit(0);
  }
}

simulateSync();
