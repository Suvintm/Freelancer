import prisma from '../../../config/prisma.js';

const seedPlans = async () => {
  try {
    console.log('🌱 Starting PostgreSQL Subscription Plans Seed...');

    // Clear existing plans
    await prisma.subscriptionPlan.deleteMany({});
    console.log('🗑️  Cleared existing subscription plans from public.subscription_plans');

    const plans = [
      {
        name: 'Creator',
        slug: 'creator-monthly',
        feature: 'creator',
        planTier: 'creator',
        duration: 'Monthly',
        durationDays: 30,
        price: 149,
        originalPrice: 199,
        currency: 'INR',
        discountPercent: 25,
        trialDays: 3,
        features: [
          'Full Nearby Search',
          'Basic YT Dashboard',
          'Portfolio Public Link',
          'Priority in Explore Feed'
        ],
        description: 'Core tools for growing creators.',
        badge: 'NEW',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Pro',
        slug: 'pro-monthly',
        feature: 'pro',
        planTier: 'pro',
        duration: 'Monthly',
        durationDays: 30,
        price: 349,
        originalPrice: 499,
        currency: 'INR',
        discountPercent: 30,
        trialDays: 3,
        features: [
          'Full Nearby Search',
          'Verified Badge 🔵',
          'YT Analytics Deep Dive',
          'Portfolio Public Link',
          'Priority in Explore Feed',
          'AI Content Suggestions'
        ],
        description: 'Advanced analytics and AI tools for professionals.',
        badge: 'POPULAR',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Elite',
        slug: 'elite-monthly',
        feature: 'elite',
        planTier: 'elite',
        duration: 'Monthly',
        durationDays: 30,
        price: 799,
        originalPrice: 999,
        currency: 'INR',
        discountPercent: 20,
        trialDays: 3,
        features: [
          'All Pro Features',
          'Team Collaboration Slots',
          'Remove SuviX Branding',
          'Priority Support'
        ],
        description: 'The ultimate package for top creators and teams.',
        badge: 'BEST VALUE',
        isActive: true,
        sortOrder: 3,
      }
    ];

    // Create plans one-by-one or createMany
    await prisma.subscriptionPlan.createMany({
      data: plans
    });

    console.log(`✅ Successfully seeded ${plans.length} subscription plans into PostgreSQL!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed subscription plans:', error);
    process.exit(1);
  }
};

seedPlans();
