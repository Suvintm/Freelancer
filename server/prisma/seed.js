import prisma from '../src/infrastructure/database/postgres.js';

// ── Production Dynamic Role Categories ─────────────────────────────────────
// These are the dynamic top-level role categories for SuviX.
// slug matches the UserRole enum directly → zero ambiguity in code.
const ROLE_CATEGORIES = [
  {
    slug: 'user',
    name: 'Normal User',
    icon: 'user',
    maps_to_role: 'user',
    description: 'Discover content, follow creators, and explore the platform.',
    info: 'As a Normal User, you can explore professional content, discover elite creators and editors, and interact with the SuviX community.',
    display_order: 1,
    is_active: true,
  },
  {
    slug: 'creator',
    name: 'YouTube Creator',
    icon: 'youtube',
    maps_to_role: 'creator',
    description: 'Grow your YouTube channel and connect with top brands.',
    info: 'As a YouTube Creator on SuviX, you can connect your channels, get discovered by brands for sponsorships, and build a sustainable content career.',
    display_order: 2,
    is_active: true,
  },
  {
    slug: 'editor',
    name: 'Video Editor',
    icon: 'video',
    maps_to_role: 'editor',
    description: 'Offer professional post-production and editing services.',
    info: 'As a Video Editor on SuviX, you can build a professional portfolio, get discovered by brands and creators, earn through high-end projects, and withdraw your earnings.',
    display_order: 3,
    is_active: true,
  },
  {
    slug: 'brand',
    name: 'Brand & Sponsor',
    icon: 'megaphone',
    maps_to_role: 'brand',
    description: 'Connect with top YouTube creators and run ad campaigns.',
    info: 'As a Brand on SuviX, you can discover elite YouTube creators, launch advertising campaigns, manage sponsorships, and track campaign performance.',
    display_order: 4,
    is_active: true,
  },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('🗑️  Clearing existing role categories...');
  await prisma.roleCategory.deleteMany({});
  console.log('✅ Old categories cleared.\n');

  console.log('📦 Seeding dynamic role categories...');
  for (const cat of ROLE_CATEGORIES) {
    await prisma.roleCategory.create({
      data: cat,
    });
    console.log(`   ↳ Created [${cat.slug}] → "${cat.name}"`);
  }

  console.log('\n✅ Dynamic Role Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
