import prisma from '../src/infrastructure/database/postgres.js';

async function check() {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%usage_tracking%' AND table_schema = 'public';");
  console.log('Existing usage_tracking tables:', tables);

  const count = await prisma.$queryRawUnsafe("SELECT COUNT(*) FROM usage_tracking;").catch(() => [{ count: 'table does not exist' }]);
  console.log('Rows in usage_tracking:', count);

  await prisma.$disconnect();
}

check().catch(console.error);
