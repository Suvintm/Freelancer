import prisma from '../src/infrastructure/database/postgres.js';

async function main() {
  const plans = await prisma.$queryRawUnsafe('SELECT id, name, target_role, price_monthly, price_annual, is_active FROM subscription_plans WHERE target_role IN (\'creator\', \'all\') AND is_active = true ORDER BY tier_level ASC;');
  console.log('Creator plans from DB:', plans);
  await prisma.$disconnect();
}

main().catch(console.error);
