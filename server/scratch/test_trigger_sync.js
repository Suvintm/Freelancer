import "dotenv/config";
import { Queue } from "bullmq";
import { connection } from "../../server/modules/workers/queues.js";
import prisma from "../../server/config/prisma.js";

async function triggerSync() {
  const syncQueue = new Queue("youtube-sync", { connection });
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: "suvintm19@gmail.com" },
      include: { youtubeProfiles: true }
    });

    if (!user || !user.youtubeProfiles) {
      console.log("❌ User or YouTube Profile not found.");
      return;
    }

    console.log(`🚀 Triggering sync for ${user.email} (Channel: ${user.youtubeProfiles.channel_id})`);
    
    // We need to pass the channels array as expected by the worker
    await syncQueue.add("manual-sync", {
      userId: user.id,
      channels: [
        {
          channelId: user.youtubeProfiles.channel_id,
          channelName: user.youtubeProfiles.channel_name,
          thumbnailUrl: user.youtubeProfiles.thumbnail_url,
          // We don't have the uploads playlist ID here, but persistYouTubeContent 
          // should handle it or we can mock it
          uploadsPlaylistId: user.youtubeProfiles.uploads_playlist_id
        }
      ]
    });

    console.log("✅ Sync job added to queue. Please check server logs for execution.");

  } catch (error) {
    console.error("❌ Failed to trigger sync:", error);
  } finally {
    await prisma.$disconnect();
    // connection is a shared object, we might not want to close it if server is running,
    // but this is a standalone script.
    process.exit(0);
  }
}

triggerSync();
