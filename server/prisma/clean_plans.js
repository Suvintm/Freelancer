import prisma from '../src/infrastructure/database/postgres.js';

async function cleanPlans() {
  console.log('--- Cleaning all subscription plan data from database ---');

  try {
    // Run TRUNCATE CASCADE on all subscription plan tables
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        subscriptions, 
        subscription_plans,
        plan_prices, 
        plan_versions, 
        plan_features, 
        plan_limits, 
        plan_entitlements, 
        plans, 
        coupons
      CASCADE;
    `);
    console.log('✓ Successfully wiped all subscription plan tables via TRUNCATE CASCADE.');
  } catch (err) {
    console.warn('TRUNCATE error:', err.message, '- Falling back to Prisma deleteMany.');
    
    const delPrices = await prisma.planPrice.deleteMany({});
    const delVersions = await prisma.planVersion.deleteMany({});
    const delFeatures = await prisma.planFeatures.deleteMany({});
    const delLimits = await prisma.planLimits.deleteMany({});
    const delEntitlements = await prisma.planEntitlement.deleteMany({});
    const delSubscriptions = await prisma.subscription.deleteMany({});
    const delPlans = await prisma.plan.deleteMany({});
    const delLegacyPlans = await prisma.subscriptionPlan.deleteMany({});
    const delCoupons = await prisma.coupon.deleteMany({});

    console.log(`✓ Deleted:
      - ${delPrices.count} plan prices
      - ${delVersions.count} plan versions
      - ${delFeatures.count} plan features
      - ${delLimits.count} plan limits
      - ${delEntitlements.count} plan entitlements
      - ${delSubscriptions.count} subscriptions
      - ${delPlans.count} enterprise plans
      - ${delLegacyPlans.count} legacy plans
      - ${delCoupons.count} coupons`);
  } finally {
    // Verify count is 0
    const [pCount, vCount, lpCount] = await Promise.all([
      prisma.plan.count(),
      prisma.planVersion.count(),
      prisma.subscriptionPlan.count()
    ]);
    console.log(`--- Verification: Remaining plans=${pCount}, versions=${vCount}, legacyPlans=${lpCount} ---`);
    await prisma.$disconnect();
  }
}

cleanPlans().catch((e) => {
  console.error('Fatal error cleaning plans:', e);
  process.exit(1);
});
