import "dotenv/config";
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Initialize Pool same as server/config/prisma.js
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const profiles = await prisma.youTubeProfile.findMany({
      include: {
        videos: true,
        user: {
           select: { email: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    console.log('\n--- DIAGNOSTIC: YOUTUBE DATA CHECK ---');
    if (profiles.length === 0) {
      console.log('❌ No YouTube profiles found in database.');
    } else {
      profiles.forEach(p => {
        console.log(`Channel: ${p.channel_name} (${p.channel_id})`);
        console.log(`  User: ${p.user.email}`);
        console.log(`  Videos count: ${p.videos.length}`);
        if (p.videos.length > 0) {
           console.log(`  Sample Video Title: ${p.videos[0].title}`);
           console.log(`  Video ID: ${p.videos[0].video_id}`);
        } else {
           console.log(`  ⚠️ No videos found for this profile.`);
        }
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkData();
