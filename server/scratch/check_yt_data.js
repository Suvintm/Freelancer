import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
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
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('--- USERS WITH YT PROFILES ---');
    users.forEach(u => {
      console.log(`User: ${u.email} (Role: ${u.primaryRole?.category})`);
      u.youtubeProfiles.forEach(p => {
        console.log(`  Profile: ${p.channel_name} (${p.channel_id})`);
        console.log(`  Videos Count: ${p.videos.length}`);
        if (p.videos.length > 0) {
           console.log(`  First Video: ${p.videos[0].title}`);
        }
      });
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
