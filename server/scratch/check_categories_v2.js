import prisma from '../config/prisma.js';

async function main() {
  try {
    const categories = await prisma.roleCategory.findMany();
    console.log('CATEGORIES:', JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
