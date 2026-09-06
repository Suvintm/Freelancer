/**
 * Test script to verify getPlans query logic against live PostgreSQL
 */

import prisma from '../src/infrastructure/database/postgres.js';

async function testPlansQuery() {
  console.log('🧪 Testing Enterprise Plans DB Query...');

  const roles = ['creator', 'editor', 'brand', 'user'];

  for (const role of roles) {
    const plans = await prisma.plan.findMany({
      where: {
        isPublic: true,
        targetRole: { in: [role, 'all'] },
      },
      include: {
        versions: {
          where: { isLatest: true, effectiveTo: null },
          include: {
            features: true,
            limits: true,
            prices: {
              where: { isActive: true, currency: 'INR', effectiveTo: null },
            },
          },
        },
        entitlements: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    console.log(`\n================== ROLE: ${role.toUpperCase()} (${plans.length} Plans Found) ==================`);
    plans.forEach((p) => {
      const v = p.versions[0] || {};
      const mPrice = v.prices?.find((pr) => pr.billingInterval === 'month')?.amount || 0;
      const yPrice = v.prices?.find((pr) => pr.billingInterval === 'year')?.amount || 0;
      console.log(`- Plan [${p.id}]: "${p.name}" (Tier ${v.tierLevel}) | Monthly: ₹${mPrice}, Annual: ₹${yPrice}`);
      console.log(`  Features: ${JSON.stringify(v.features ? { badge: v.features.verifiedBadge, domain: v.features.customDomain } : {})}`);
      console.log(`  Limits: Storage: ${v.limits?.maxStorageGb}GB, AI: ${v.limits?.maxAiGenerations}, Team: ${v.limits?.maxTeamMembers}`);
    });
  }

  console.log('\n🎟️ Testing Active Coupons Query...');
  const coupons = await prisma.coupon.findMany({ where: { isActive: true } });
  coupons.forEach((c) => {
    console.log(`- Coupon [${c.code}]: ${c.discountValue}% OFF (${c.discountType})`);
  });

  console.log('\n✅ All Database Queries Executed Successfully!');
}

testPlansQuery()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
