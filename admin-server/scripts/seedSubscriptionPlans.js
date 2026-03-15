/**
 * Seed Default Subscription Plans
 * Run with: node scripts/seedSubscriptionPlans.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";

dotenv.config();

const defaultPlans = [
  {
    name: "Profile Insights Pro - Monthly",
    slug: "profile-insights-monthly",
    feature: "profile_insights",
    duration: "monthly",
    durationDays: 30,
    price: 149,
    originalPrice: 199,
    currency: "INR",
    discountPercent: 25,
    trialDays: 3,
    features: [
      "See who viewed your profile",
      "Visitor names & photos",
      "Client vs Editor breakdown",
      "Last 30 days history",
      "Real-time notifications",
    ],
    description: "Unlock profile visitor insights for 30 days",
    badge: "",
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Profile Insights Pro - Yearly",
    slug: "profile-insights-yearly",
    feature: "profile_insights",
    duration: "yearly",
    durationDays: 365,
    price: 999,
    originalPrice: 1788, // 149 * 12
    currency: "INR",
    discountPercent: 44,
    trialDays: 3,
    features: [
      "See who viewed your profile",
      "Visitor names & photos",
      "Client vs Editor breakdown",
      "Last 30 days history",
      "Real-time notifications",
      "Priority support",
      "44% savings vs monthly",
    ],
    description: "Best value! Full year of profile insights",
    badge: "BEST VALUE",
    isActive: true,
    sortOrder: 2,
  },
];

async function seedPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Upsert each plan (update if exists, create if not)
    for (const plan of defaultPlans) {
      const result = await SubscriptionPlan.findOneAndUpdate(
        { slug: plan.slug },
        plan,
        { upsert: true, new: true }
      );
      console.log(`✅ Plan "${result.name}" - ${result.isNew ? "Created" : "Updated"}`);
    }

    console.log("\n🎉 Subscription plans seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB");
    process.exit(0);
  }
}

seedPlans();
