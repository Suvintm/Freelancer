import prisma from '../src/infrastructure/database/postgres.js';
import { redis, redisAvailable } from '../src/infrastructure/cache/redis.client.js';

// ── Complete Production Dynamic Role Categories ──────────────────────────────
const ROLE_CATEGORIES = [
  // ── Core Creators & Editors ──
  {
    slug: 'creator',
    name: 'Content Creator',
    icon: 'video',
    maps_to_role: 'creator',
    description: 'Grow your channels, connect platforms, and secure sponsorships.',
    info: 'As a Content Creator on SuviX, you can connect multiple channels (YouTube, Instagram, etc.), get discovered by brands for sponsorships, and build a sustainable content career.',
    display_order: 1,
    is_active: true,
  },
  {
    slug: 'editor',
    name: 'Video Editor',
    icon: 'video',
    maps_to_role: 'editor',
    description: 'Offer professional post-production and editing services.',
    info: 'As a Video Editor on SuviX, you can build a professional portfolio, get discovered by brands and creators, earn through high-end projects, and withdraw your earnings.',
    display_order: 2,
    is_active: true,
  },
  {
    slug: 'brand',
    name: 'Brand & Sponsor',
    icon: 'megaphone',
    maps_to_role: 'brand',
    description: 'Connect with top creators and run ad campaigns.',
    info: 'As a Brand on SuviX, you can discover elite creators, launch advertising campaigns, manage sponsorships, and track campaign performance.',
    display_order: 3,
    is_active: true,
  },
  {
    slug: 'user',
    name: 'Normal User',
    icon: 'user',
    maps_to_role: 'user',
    description: 'Discover content, follow creators, and explore the platform.',
    info: 'As a Normal User, you can explore professional content, discover elite creators and editors, and interact with the SuviX community.',
    display_order: 4,
    is_active: true,
  },

  // ── Talent & Creative Services ──
  {
    slug: 'photographer',
    name: 'Photographer',
    icon: 'camera',
    maps_to_role: 'creator',
    description: 'Showcase photoshoots, license visual assets, and get booked.',
    info: 'As a Photographer on SuviX, you can build a high-resolution gallery, sell presets, and get hired by brands and creators for commercial shoots.',
    display_order: 5,
    is_active: true,
  },
  {
    slug: 'videographer',
    name: 'Videographer / DP',
    icon: 'film',
    maps_to_role: 'editor',
    description: 'Cinematography, camera operation, and commercial video shoots.',
    info: 'As a Videographer on SuviX, you can showcase showreels, book high-end client productions, and collaborate with top creators.',
    display_order: 6,
    is_active: true,
  },
  {
    slug: 'musician',
    name: 'Musician & Producer',
    icon: 'music',
    maps_to_role: 'creator',
    description: 'Release original beats, license audio, and produce soundtracks.',
    info: 'As a Musician or Producer on SuviX, you can monetize audio packs, license tracks for video creators, and collaborate with brands.',
    display_order: 7,
    is_active: true,
  },
  {
    slug: 'actor',
    name: 'Actor & Model',
    icon: 'star',
    maps_to_role: 'creator',
    description: 'Commercial casting, brand modeling, and on-screen acting.',
    info: 'As an Actor or Model on SuviX, you can showcase your headshots, reel, and audition for commercials, creator videos, and brand shoots.',
    display_order: 8,
    is_active: true,
  },
  {
    slug: 'singer',
    name: 'Singer & Vocalist',
    icon: 'mic',
    maps_to_role: 'creator',
    description: 'Vocal production, live gigs, and original music releases.',
    info: 'As a Singer on SuviX, you can showcase vocal samples, book live performances, and collaborate with music producers and creators.',
    display_order: 9,
    is_active: true,
  },
  {
    slug: 'dancer',
    name: 'Dancer & Choreographer',
    icon: 'activity',
    maps_to_role: 'creator',
    description: 'Dance choreography, viral trends, and stage performances.',
    info: 'As a Dancer or Choreographer on SuviX, you can build workshops, lead viral campaigns for brands, and choreograph music videos.',
    display_order: 10,
    is_active: true,
  },
  {
    slug: 'fitness_expert',
    name: 'Fitness Coach & Trainer',
    icon: 'activity',
    maps_to_role: 'creator',
    description: 'Workout programs, nutrition guides, and 1:1 fitness coaching.',
    info: 'As a Fitness Coach on SuviX, you can sell workout plans, host virtual training sessions, and partner with health & fitness brands.',
    display_order: 11,
    is_active: true,
  },
  {
    slug: 'rent_service',
    name: 'Rental Studio & Gear',
    icon: 'briefcase',
    maps_to_role: 'brand',
    description: 'Rent cinema cameras, studio spaces, and audio gear.',
    info: 'As a Gear & Studio Rental Provider on SuviX, you can list studio spaces, cameras, lenses, and lighting equipment for creators to rent.',
    display_order: 12,
    is_active: true,
  },
];

async function main() {
  console.log('🌱 Starting comprehensive role categories seed into Supabase...\n');

  for (const cat of ROLE_CATEGORIES) {
    await prisma.roleCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        maps_to_role: cat.maps_to_role,
        description: cat.description,
        info: cat.info,
        display_order: cat.display_order,
        is_active: cat.is_active,
      },
      create: cat,
    });
    console.log(`   ↳ Seeded [${cat.slug}] → "${cat.name}"`);
  }

  // Invalidate Redis Cache so mobile devices immediately get fresh categories
  try {
    if (redisAvailable) {
      await redis.del('cache:role_categories');
      console.log('\n🧹 Invalidated Redis cache key: cache:role_categories');
    }
  } catch (err) {
    console.warn('⚠️ Could not invalidate Redis cache:', err.message);
  }

  console.log('\n✅ All 12 Role Categories seeded successfully into PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
