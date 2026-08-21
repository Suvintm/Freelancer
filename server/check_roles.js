import prisma from './src/infrastructure/database/postgres.js';

async function checkRoles() {
  try {
    const categories = await prisma.roleCategory.findMany();
    console.log(`Found ${categories.length} role categories in database:`);
    console.dir(categories, { depth: null });
  } catch (err) {
    console.error('Error querying roleCategory:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
