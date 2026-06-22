import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const seedPlans = async () => {
  try {
    console.log('🌱 Starting Subscription Plans Seed...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('🗑️  Cleared existing plans');

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

    await SubscriptionPlan.insertMany(plans);
    console.log(`✅ Successfully seeded ${plans.length} subscription plans!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
