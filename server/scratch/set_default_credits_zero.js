import prisma from '../src/infrastructure/database/postgres.js';
import { deleteCache } from '../src/infrastructure/cache/cache.service.js';

async function main() {
  console.log('Setting default credits to 0 in PostgreSQL...');
  await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN credits SET DEFAULT 0;`);
  console.log('✅ Default set to 0');

  console.log('Resetting existing users credits to 0...');
  const result = await prisma.$executeRawUnsafe(`UPDATE users SET credits = 0;`);
  console.log(`✅ Updated ${result} users to 0 credits`);

  // Clear all user caches in Redis so they pick up 0 credits
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await deleteCache(`cache:user:${u.id}`);
  }
  console.log('✅ Cleared user Redis profile caches');

  const sample = await prisma.user.findFirst({ select: { id: true, email: true, credits: true } });
  console.log('✅ Sample user verification:', sample);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
