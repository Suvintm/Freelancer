import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listChannels() {
  try {
    const profiles = await prisma.youTubeProfile.findMany({
      select: { channel_id: true, channel_name: true, userId: true }
    });
    console.log('CHANNELS_IN_DB:', JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listChannels();
