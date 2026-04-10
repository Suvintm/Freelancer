import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    const duplicates = await prisma.$queryRaw`
      SELECT channel_id, COUNT(*) 
      FROM youtube_profiles 
      GROUP BY channel_id 
      HAVING COUNT(*) > 1
    `;
    console.log('DUPLICATES_REPORT:', JSON.stringify(duplicates));
  } catch (error) {
    console.error('QUERY_FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
