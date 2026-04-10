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

    console.log(`🚀 Triggering sync for ${user.email} with MOCK VIDEOS...`);
    
    await syncQueue.add("manual-sync-with-videos", {
      userId: user.id,
      channels: [
        {
          channelId: user.youtubeProfiles.channel_id,
          channelName: user.youtubeProfiles.channel_name,
          thumbnailUrl: user.youtubeProfiles.thumbnail_url,
          uploadsPlaylistId: user.youtubeProfiles.uploads_playlist_id,
          videos: [
            {
              id: "vid_test_001",
              title: "Antigravity Dev Log #1",
              thumbnail: "https://picsum.photos/seed/v1/400/225",
              publishedAt: new Date().toISOString()
            },
            {
              id: "vid_test_002",
              title: "Antigravity Dev Log #2",
              thumbnail: "https://picsum.photos/seed/v2/400/225",
              publishedAt: new Date().toISOString()
            }
          ]
        }
      ]
    });

    console.log("✅ Mock Sync job added. Waiting for worker...");

  } catch (error) {
    console.error("❌ Failed to trigger sync:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

triggerSync();
