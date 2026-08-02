import prisma from '../src/infrastructure/database/postgres.js';

// ── Production Role Categories ─────────────────────────────────────────────
// These are the 4 selectable roles shown on the onboarding UI.
// slug matches the UserRole enum directly → zero ambiguity in code.
const ROLE_CATEGORIES = {
  user: {
    name: 'Normal User',
    icon: 'user',
    maps_to_role: 'user',
    description: 'Discover content, follow creators, and explore the platform.',
    info: 'As a Normal User, you can explore professional content, discover elite creators and editors, and interact with the SuviX community.',
    subCategories: [], // No subcategories — preferences stored as content_interests on UserProfile
  },

  creator: {
    name: 'YouTube Creator',
    icon: 'youtube',
    maps_to_role: 'creator',
    description: 'Grow your YouTube channel and connect with top brands.',
    info: 'As a YouTube Creator on SuviX, you can connect your channels, get discovered by brands for sponsorships, and build a sustainable content career.',
    subCategories: [
      'Vlogs',
      'Technology',
      'Education',
      'Fitness',
      'Entertainment',
      'Gaming',
      'Food',
      'Travel',
      'Music',
      'Sports',
      'Movies',
      'News',
      'Livestreaming',
      'Podcasts',
      'Unboxing',
      'Lifestyle',
      'Finance',
      'Fashion',
      'Other',
    ],
  },

  editor: {
    name: 'Video Editor',
    icon: 'video',
    maps_to_role: 'editor',
    description: 'Offer professional post-production and editing services.',
    info: 'As a Video Editor on SuviX, you can build a professional portfolio, get discovered by brands and creators, earn through high-end projects, and withdraw your earnings.',
    subCategories: [
      'Short Films',
      'Reels / Shorts',
      'Commercials',
      'YouTube Edits',
      'Color Grading',
      'Sound Design',
      'Motion Graphics',
      'VFX',
      'Documentary',
      'Weddings',
      'Corporate',
      'Social Media',
      'Podcasts',
      'Cinematic',
      'Promo',
      'Trailer',
      'Intro / Outro',
      'Other',
    ],
  },

  brand: {
    name: 'Brand & Sponsor',
    icon: 'megaphone',
    maps_to_role: 'brand',
    description: 'Connect with top YouTube creators and run ad campaigns.',
    info: 'As a Brand on SuviX, you can discover elite YouTube creators, launch advertising campaigns, manage sponsorships, and track campaign performance.',
    subCategories: [
      'YouTube Sponsorship',
      'Product Placement',
      'Video Integration',
      'Dedicated Video',
      'Shoutouts',
      'Affiliate Marketing',
      'Unboxing & Review',
      'Shorts & Reels Integration',
      'Community Post Promotion',
      'Brand Ambassador',
      'Livestream Sponsorship',
      'Giveaway Collaboration',
    ],
  },
};

// ── Slug generator ────────────────────────────────────────────────────────
const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/ \/ /g, '-')
    .replace(/ & /g, '-and-')
    .replace(/ /g, '-')
    .replace(/[()]/g, '');

async function main() {
  console.log('🌱 Starting seed...\n');

  // Step 1: Delete ALL old categories (and their subcategories via cascade)
  // This clears the legacy 12-category mess cleanly.
  console.log('🗑️  Clearing old role categories...');
  await prisma.roleSubCategory.deleteMany({});
  await prisma.roleCategory.deleteMany({});
  console.log('✅ Old categories cleared.\n');

  // Step 2: Insert the 4 clean production categories
  for (const [slug, data] of Object.entries(ROLE_CATEGORIES)) {
    console.log(`📦 Creating category: [${slug}] → "${data.name}"`);

    const category = await prisma.roleCategory.create({
      data: {
        slug,
        name: data.name,
        icon: data.icon,
        maps_to_role: data.maps_to_role,
        description: data.description,
        info: data.info,
      },
    });

    // Step 3: Insert subcategories for this category
    if (data.subCategories.length > 0) {
      const subCategoryData = data.subCategories.map((subName) => ({
        name: subName,
        slug: toSlug(subName),
        roleCategoryId: category.id,
      }));

      await prisma.roleSubCategory.createMany({ data: subCategoryData });
      console.log(`   ↳ ${data.subCategories.length} subcategories created.`);
    } else {
      console.log(`   ↳ No subcategories (preferences handled via content_interests).`);
    }
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log('📋 Summary:');
  console.log('   • user   → Normal User        (0 subcategories)');
  console.log('   • creator → YouTube Creator   (19 niches)');
  console.log('   • editor  → Video Editor      (18 specializations)');
  console.log('   • brand   → Brand & Sponsor   (12 campaign types)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
