import prisma from './config/prisma.js';

async function debugPrisma() {
  try {
    const keys = Object.keys(prisma);
    const modelKeys = keys.filter(k => !k.startsWith('_') && typeof prisma[k] === 'object');
    console.log('PRISMA_MODELS:', JSON.stringify(modelKeys));
  } catch (error) {
    console.error('DEBUG_FAILED:', error);
  } finally {
    process.exit(0);
  }
}

debugPrisma();
