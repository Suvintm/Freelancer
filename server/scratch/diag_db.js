import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [
    'b62497af-3882-4b89-ae1a-eea03cfa89d4', // Account B (Identity: normal2)
    '830a8987-0f3e-49f6-8b6f-203de3263c8e'  // Account A (Identity: suvin?)
  ];

  console.log('--- DATABASE DIAGNOSTIC ---');
  for (const id of ids) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true
      }
    });

    if (user) {
      console.log(`User ID: ${user.id}`);
      console.log(`Email:   ${user.email}`);
      console.log(`Username: ${user.profile?.username}`);
      console.log(`Name:     ${user.profile?.name}`);
      console.log(`Token Ver: ${user.token_version}`);
      console.log('---------------------------');
    } else {
      console.log(`User ID: ${id} NOT FOUND IN DB`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
