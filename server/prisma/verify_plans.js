import prisma from '../src/infrastructure/database/postgres.js';

async function verify() {
  const subPlans = await prisma.$queryRawUnsafe('SELECT id, name, target_role, price_monthly, features, limits FROM subscription_plans ORDER BY target_role, tier_level ASC;');
  console.log('--- SUBSCRIPTION_PLANS TABLE (Total: ' + subPlans.length + ') ---');
  subPlans.forEach(p => {
    console.log(`\n📌 Plan: ${p.name} (${p.id}) [Role: ${p.target_role}] - ₹${p.price_monthly}/mo`);
    console.log(`   Features:`, p.features?.list || p.features);
    console.log(`   Quotas:`, p.limits?.quotas || p.limits);
  });

  const plans = await prisma.$queryRawUnsafe('SELECT id, name, target_role, is_public FROM plans ORDER BY target_role, sort_order ASC;');
  console.log('--- PLANS TABLE (Total: ' + plans.length + ') ---');
  console.table(plans);

  const coupons = await prisma.$queryRawUnsafe('SELECT code, discount_type, discount_value, max_redemptions, is_active FROM coupons;');
  console.log('--- COUPONS TABLE (Total: ' + coupons.length + ') ---');
  console.table(coupons);

  await prisma.$disconnect();
}

verify().catch(console.error);
