import prisma from './config/prisma.js';
import { hashPassword } from './modules/auth/utils/password.js';

// Indian Names and Usernames for Editors
const INDIAN_EDITORS = [
  { name: 'Arjun Mehta', username: 'arjun_edits', email: 'arjun.mehta@suvix.in' },
  { name: 'Priya Sharma', username: 'priya_vfx', email: 'priya.sharma@suvix.in' },
  { name: 'Rohan Verma', username: 'rohan_cutz', email: 'rohan.verma@suvix.in' },
  { name: 'Ananya Iyer', username: 'ananya_color', email: 'ananya.iyer@suvix.in' },
  { name: 'Kabir Singh', username: 'kabir_films', email: 'kabir.singh@suvix.in' },
  { name: 'Sneha Patel', username: 'sneha_motion', email: 'sneha.patel@suvix.in' },
  { name: 'Aarav Gupta', username: 'aarav_post', email: 'aarav.gupta@suvix.in' },
  { name: 'Divya Nair', username: 'divya_editor', email: 'divya.nair@suvix.in' },
  { name: 'Amit Joshi', username: 'amit_creative', email: 'amit.joshi@suvix.in' },
  { name: 'Ishita Roy', username: 'ishita_vfx', email: 'ishita.roy@suvix.in' }
];

const DEFAULT_PASSWORD = 'suvixuser@123A';

async function main() {
  try {
    console.log("Looking up 'video_editor' category and its subcategories...");
    const category = await prisma.roleCategory.findFirst({
      where: { slug: 'video_editor' },
      include: { subCategories: true }
    });

    if (!category) {
      console.error("❌ 'video_editor' category not found in DB! Please seed categories first.");
      return;
    }

    console.log(`Found category: ${category.name} (${category.id})`);
    const subCategories = category.subCategories;
    if (subCategories.length === 0) {
      console.error("❌ No subcategories found for 'video_editor'!");
      return;
    }

    const passwordHash = await hashPassword(DEFAULT_PASSWORD);
    console.log("Password hashed successfully.");

    for (const editor of INDIAN_EDITORS) {
      console.log(`Inserting/Syncing user: ${editor.name} (${editor.email})`);
      
      // Upsert User
      const user = await prisma.user.upsert({
        where: { email: editor.email },
        update: {
          password_hash: passwordHash,
          role: 'suvix_user',
          is_onboarded: true,
        },
        create: {
          email: editor.email,
          username: editor.username,
          password_hash: passwordHash,
          role: 'suvix_user',
          is_onboarded: true,
        }
      });

      // Upsert UserProfile
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          name: editor.name,
          username: editor.username,
          categoryId: category.id,
          location_country: 'India',
          location_city: 'Mumbai',
          location_state: 'Maharashtra',
        },
        create: {
          userId: user.id,
          username: editor.username,
          name: editor.name,
          categoryId: category.id,
          location_country: 'India',
          location_city: 'Mumbai',
          location_state: 'Maharashtra',
        }
      });

      // Clear existing role mappings for this profile and insert primary mappings
      await prisma.userRoleMapping.deleteMany({
        where: { profileId: profile.id }
      });

      // Assign 2 random subcategories
      const shuffledSubcats = [...subCategories].sort(() => Math.random() - 0.5);
      const chosenSubcats = shuffledSubcats.slice(0, 2);

      for (let i = 0; i < chosenSubcats.length; i++) {
        await prisma.userRoleMapping.create({
          data: {
            profileId: profile.id,
            roleSubCategoryId: chosenSubcats[i].id,
            isPrimary: i === 0
          }
        });
      }

      // Ensure userStats exist
      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id }
      });

      console.log(`✅ Completed setup for ${editor.name}`);
    }

    console.log("✨ All editors seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding editors:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
