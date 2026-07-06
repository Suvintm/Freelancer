import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.profile.findFirst({ select: { profile_picture: true } });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
