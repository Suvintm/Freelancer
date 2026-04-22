import prisma from "../server/config/prisma.js";
import { formatAuthResponse } from "../server/modules/auth/utils/authHelpers.js";

async function verifyMultiChannelFeed() {
  try {
    // 1. Find a user with multiple YouTube profiles
    const users = await prisma.user.findMany({
      where: {
        youtubeProfiles: {
          some: {}
        }
      },
      include: {
        youtubeProfiles: {
          include: {
            videos: true
          }
        }
      }
    });

    const multiChannelUser = users.find(u => u.youtubeProfiles.length > 1);

    if (!multiChannelUser) {
      console.log("No user found with multiple YouTube channels. Please link a second channel first.");
      process.exit(0);
    }

    console.log(`✅ Found User: ${multiChannelUser.id} with ${multiChannelUser.youtubeProfiles.length} channels.`);

    // 2. Use the formatter (which uses the flatMap logic)
    const formatted = formatAuthResponse(multiChannelUser);

    console.log(`📊 Total Videos: ${formatted.youtubeVideos.length}`);
    
    // 3. Verify Sort Order
    const isSorted = formatted.youtubeVideos.every((v, i, arr) => {
      if (i === 0) return true;
      const prevDate = new Date(arr[i-1].publishedAt || arr[i-1].published_at);
      const currDate = new Date(v.publishedAt || v.published_at);
      return prevDate >= currDate;
    });

    if (isSorted) {
      console.log("🔥 SUCCESS: Feed is correctly merged and chronologically sorted (Newest First)!");
    } else {
      console.error("❌ ERROR: Feed is not correctly sorted.");
    }

    // 4. Print first 5 items to see channel names/IDs
    console.log("\n--- Top 5 Videos ---");
    formatted.youtubeVideos.slice(0, 5).forEach((v, idx) => {
      console.log(`${idx + 1}. [${v.publishedAt || v.published_at}] ID: ${v.id} (Channel: ${v.channelId})`);
    });

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMultiChannelFeed();
