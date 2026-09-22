import prisma from '../src/infrastructure/database/postgres.js';

async function main() {
  console.log('Adding credits column to users table...');
  await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 500;`);
  console.log('✅ Column added successfully!');

  const user = await prisma.user.findFirst({
    select: { id: true, email: true, credits: true },
  });
  console.log('✅ Sample user query verification:', user);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
