import mongoose from 'mongoose';
import prisma from './config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

const mapping = [
  {
    name: 'Suvin T M',
    email: 'suvintm1515@gmail.com',
    oldUserId: '69b8f1898690e31849924d3a',
    oldProfileId: '69b8f1a58690e31849924d3f'
  },
  {
    name: 'Client',
    email: 'client@gmail.com',
    oldUserId: '69b917d9260fe88042551af1',
    oldProfileId: '69b917d9260fe88042551af3'
  }
];

async function restoreProfiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log('--- Starting Legacy Profile Restoration ---');

    for (const item of mapping) {
      console.log(`\nProcessing: ${item.name} (${item.email})`);
      
      // 1. Get current PostgreSQL User
      const currentUser = await prisma.user.findUnique({
        where: { email: item.email }
      });

      if (!currentUser) {
        console.log(`❌ Error: Current user not found in PostgreSQL for email ${item.email}`);
        continue;
      }
      const userId = currentUser.id;
      console.log(`Target UUID: ${userId}`);

      // 2. Get legacy data from MongoDB backups
      const legacyUser = await db.collection('users_legacy_20260404').findOne({
        _id: new mongoose.Types.ObjectId(item.oldUserId)
      });
      const legacyProfile = await db.collection('profiles_legacy_20260404').findOne({
        user: new mongoose.Types.ObjectId(item.oldUserId)
      });

      if (!legacyUser || !legacyProfile) {
        console.log(`❌ Error: Legacy data not found in MongoDB backups for ${item.name}`);
        continue;
      }

      // 3. Update PostgreSQL User (profile_picture, name)
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: legacyUser.name || currentUser.name,
          profile_picture: legacyUser.profilePicture || currentUser.profile_picture,
          profile_completion_percent: 100 // We are restoring everything
        }
      });
      console.log(`✅ Updated User record (image: ${legacyUser.profilePicture ? 'Yes' : 'No'})`);

      // 4. Update PostgreSQL UserProfile
      // Map legacy fields to new schema
      await prisma.userProfile.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          about: legacyProfile.about || "",
          skills: legacyProfile.skills || [],
          languages: legacyProfile.languages || [],
          softwares: legacyProfile.softwares || [],
          experience: legacyProfile.experience || "",
          contact_email: legacyProfile.contactEmail || "",
          location_country: legacyProfile.location?.country || "",
          social_instagram: legacyProfile.socialLinks?.instagram || "",
          social_youtube: legacyProfile.socialLinks?.youtube || "",
          social_tiktok: legacyProfile.socialLinks?.tiktok || "",
          social_twitter: legacyProfile.socialLinks?.twitter || "",
          social_linkedin: legacyProfile.socialLinks?.linkedin || "",
          social_website: legacyProfile.socialLinks?.website || "",
        },
        update: {
          about: legacyProfile.about || undefined,
          skills: legacyProfile.skills || undefined,
          languages: legacyProfile.languages || undefined,
          softwares: legacyProfile.softwares || undefined,
          experience: legacyProfile.experience || undefined,
          contact_email: legacyProfile.contactEmail || undefined,
          location_country: legacyProfile.location?.country || undefined,
          social_instagram: legacyProfile.socialLinks?.instagram || undefined,
          social_youtube: legacyProfile.socialLinks?.youtube || undefined,
          social_tiktok: legacyProfile.socialLinks?.tiktok || undefined,
          social_twitter: legacyProfile.socialLinks?.twitter || undefined,
          social_linkedin: legacyProfile.socialLinks?.linkedin || undefined,
          social_website: legacyProfile.socialLinks?.website || undefined,
        }
      });
      console.log(`✅ Upserted UserProfile metadata`);
    }

    console.log('\n--- Restoration Finished ✅ ---');
    
  } catch (err) {
    console.error('Restoration failed:', err);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

restoreProfiles();
