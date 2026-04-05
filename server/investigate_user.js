import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portfolio } from './modules/profiles/models/Portfolio.js';

dotenv.config();

const prisma = new PrismaClient();

async function checkUser(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User UUID:', user.id);
    console.log('User Name:', user.name);
    console.log('User Profile Softwares:', user.profile?.softwares);
    
    await mongoose.connect(process.env.MONGODB_URI);
    const pCount = await Portfolio.countDocuments({ user: user.id });
    console.log('Portfolio Count for UUID:', pCount);
    
    const allPortfolios = await Portfolio.find({ user: user.id });
    console.log('Portfolios found:', allPortfolios.length);
    
    // Check if there are portfolios with different user IDs that might belong to this user
    // (Optional, but useful if they have old items)
    
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

// Replace with the user's likely email from previous logs if available, 
// or I'll just check the most recently updated user.
async function checkLastUpdated() {
    try {
      const user = await prisma.user.findFirst({
        orderBy: { updated_at: 'desc' },
        include: { profile: true }
      });
      if (user) await checkUser(user.email);
    } catch (err) { console.error(err); }
}

checkLastUpdated();
