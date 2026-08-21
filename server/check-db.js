import prisma, { connectPostgres } from './src/infrastructure/database/postgres.js';

async function main() {
  await connectPostgres();
  const user = await prisma.user.findFirst({ select: { id: true, role: true } });
  console.log("Database user fetch successful:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
