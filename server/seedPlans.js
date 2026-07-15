import * as dotenv from 'dotenv';
dotenv.config();
import prisma from "./src/infrastructure/database/postgres.js";
async function seedPlans() {
  const plans = [
    {
      name: "Free",
      slug: "free-plan",
      feature: "all",
      planTier: "free",
      duration: "monthly",
      durationDays: 30,
      price: 0,
      originalPrice: 0,
      currency: "INR",
      discountPercent: 0,
      trialDays: 0,
      features: ["Home Feed & Custom Profile", "Limited Nearby Search"],
      description: "Basic features for everyone.",
      badge: null,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Creator",
      slug: "creator-monthly",
      feature: "all",
      planTier: "creator",
      duration: "monthly",
      durationDays: 30,
      price: 499,
      originalPrice: 499,
      currency: "INR",
      discountPercent: 0,
      trialDays: 3,
      features: ["Unlimited Nearby Search", "Portfolio Public Link", "Full YT Sync"],
      description: "For aspiring creators.",
      badge: "POPULAR",
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Pro",
      slug: "pro-monthly",
      feature: "all",
      planTier: "pro",
      duration: "monthly",
      durationDays: 30,
      price: 999,
      originalPrice: 999,
      currency: "INR",
      discountPercent: 0,
      trialDays: 3,
      features: ["AI Content Suggestions", "Boosted Explore Priority"],
      description: "For professionals.",
      badge: "RECOMMENDED",
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Elite",
      slug: "elite-monthly",
      feature: "all",
      planTier: "elite",
      duration: "monthly",
      durationDays: 30,
      price: 1999,
      originalPrice: 1999,
      currency: "INR",
      discountPercent: 0,
      trialDays: 3,
      features: ["Maximum Priority", "Priority Support"],
      description: "For elite creators and agencies.",
      badge: "VIP",
      isActive: true,
      sortOrder: 4,
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log("Successfully seeded 4 monthly plans.");

  const annualPlans = plans.map(p => {
    if (p.planTier === "free") return null;
    return {
      ...p,
      slug: p.slug.replace("monthly", "annually"),
      name: p.name + " (Annual)",
      duration: "annually",
      durationDays: 365,
      price: p.price * 12 * 0.8, // 20% off
      originalPrice: p.price * 12,
      discountPercent: 20,
    };
  }).filter(Boolean);

  for (const plan of annualPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log("Successfully seeded 3 annual plans.");
}

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
