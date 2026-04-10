import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Use the simplest possible initialization for debugging
const prisma = new PrismaClient();

async function debugPrisma() {
  try {
    const keys = Object.keys(prisma);
    const modelKeys = keys.filter(k => !k.startsWith('_') && typeof prisma[k] === 'object');
    console.log('PRISMA_MODELS_FOUND:', JSON.stringify(modelKeys));
  } catch (error) {
    console.error('DEBUG_FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

debugPrisma();
