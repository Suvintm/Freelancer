import prisma from '../config/prisma.js';

async function main() {
  try {
    const creators = await prisma.userProfile.findMany({
      where: {
        mother_tongue: 'Kannada',
        category: {
          slug: 'yt_influencer'
        }
      },
      include: {
        user: {
          include: {
            youtubeProfiles: {
              include: {
                videos: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${creators.length} Kannada YouTube Creators in DB.`);
    
    for (const profile of creators) {
      console.log(`\n👤 Creator Name: ${profile.name} (${profile.username})`);
      console.log(`   Email: ${profile.user.email}`);
      console.log(`   Location: ${profile.location_city}, ${profile.location_state}, ${profile.location_country}`);
      console.log(`   Mother Tongue: ${profile.mother_tongue}`);
      
      const ytProfiles = profile.user.youtubeProfiles;
      console.log(`   YouTube Channels Linked: ${ytProfiles.length}`);
      
      for (const yt of ytProfiles) {
        console.log(`   📺 Channel Name: ${yt.channel_name}`);
        console.log(`      Subscribers: ${yt.subscriber_count}`);
        console.log(`      Videos Count: ${yt.video_count}`);
        console.log(`      Videos in cache: ${yt.videos.length}`);
        
        for (const vid of yt.videos) {
          console.log(`      - [${vid.video_id}] ${vid.title} (${vid.view_count} views)`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Verification failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
