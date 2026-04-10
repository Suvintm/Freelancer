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

    console.log('\n--- DIAGNOSTIC: YOUTUBE DATA CHECK ---');
    if (users.length === 0) {
      console.log('❌ No users found with YouTube profiles in PostgreSQL.');
    } else {
      users.forEach(u => {
        console.log(`User: ${u.email}`);
        u.youtubeProfiles.forEach(p => {
          console.log(`  Profile: ${p.channel_name} (${p.channel_id})`);
          console.log(`  Videos count: ${p.videos.length}`);
          if (p.videos.length > 0) {
             console.log(`  Sample Video Title: ${p.videos[0].title}`);
          } else {
             console.log(`  ⚠️ No videos found for this profile.`);
          }
        });
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
