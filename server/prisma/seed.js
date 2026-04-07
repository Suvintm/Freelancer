import prisma from '../config/prisma.js';

const DUMMY_CATEGORIES = {
  direct_client: {
    label: 'Normal User / Client',
    icon: 'briefcase',
    roleGroup: 'CLIENT',
    description: 'Discover and hire elite talent for your projects.',
    info: 'As a Normal User/Client, you can explore professional content, discover elite talent, and hire the best editors, creators, and artists for your requirements.',
    subCategories: ['General Content', 'Business', 'Personal', 'E-commerce', 'Other'],
  },
  yt_influencer: {
    label: 'YouTube Creator',
    icon: 'youtube',
    roleGroup: 'PROVIDER',
    description: 'Scale your content and grow your audience presence.',
    info: 'Promote your channel with SuviX by making it visible, exploring more people to get more views, and building a sustainable career.',
    subCategories: ['Vlogs', 'Technology', 'Education', 'Fitness', 'Entertainment', 'Gaming', 'Food', 'Travel', 'Music', 'Sports', 'Movies', 'News', 'Livestreaming', 'Podcasts', 'Unboxing', 'Lifestyle', 'Other'],
  },
  fitness_expert: {
    label: 'Fitness Pro',
    icon: 'activity',
    roleGroup: 'PROVIDER',
    description: 'Professional fitness coaching and wellness content.',
    info: 'Join as a Fitness Pro to launch your wellness programs, connect with health-conscious users, and build a premium digital fitness brand.',
    subCategories: ['Gym Training', 'Yoga', 'Nutrition', 'Wellness', 'Crossfit', 'Bodybuilding', 'Zumba', 'Pilates', 'Meditation', 'HIIT', 'Other'],
  },
  singer: {
    label: 'Singer / Vocalist',
    icon: 'mic',
    roleGroup: 'PROVIDER',
    description: 'Pro vocalists for music and commercial output.',
    info: 'Connect with music producers, record for high-end campaigns, and grow your professional singing career through the SuviX talent network.',
    subCategories: ['Classical', 'Pop', 'Rock', 'Jazz', 'Folk', 'EDM', 'Hip Hop', 'R&B', 'Country', 'Vocal Coaching', 'Other'],
  },
  dancer: {
    label: 'Dancer',
    icon: 'move',
    roleGroup: 'PROVIDER',
    description: 'Choreographers and performers for all media.',
    info: 'Book commercial gigs, choreograph for music videos, and showcase your talent to global brands.',
    subCategories: ['Classical', 'Hip Hop', 'Contemporary', 'Bollywood', 'Salsa', 'Ballet', 'Street Dance', 'Choreography', 'Musical Theater', 'Other'],
  },
  social_promoter: {
    label: 'Ads & Promotions',
    icon: 'megaphone',
    roleGroup: 'PROVIDER',
    description: 'High-impact social media growth and advertising.',
    info: 'Scale your reach with multi-channel amplification. From digital influencer marketing to local rickshaw branding.',
    subCategories: ['Instagram Ads', 'YouTube Ads', 'SEO', 'Influencer Marketing', 'Rickshaw Branding', 'Wall Painting Ads', 'Bus Branding', 'Digital Billboards', 'Local Cable Ads', 'Radio Spots', 'Newspaper Classifieds', 'Pamphlet Distribution', 'Content Marketing', 'Brand Strategy', 'Affiliate', 'Other'],
  },
  video_editor: {
    label: 'Video Editor',
    icon: 'video',
    roleGroup: 'PROVIDER',
    description: 'Professional post-production and high-fidelity editing.',
    info: 'As a video editor on SuviX, you can earn by taking on high-end projects, get direct clients, and build a world-class professional profile.',
    subCategories: ['Short Films', 'Reels / Shorts', 'Commercials', 'YouTube Edits', 'Color Grading', 'Sound Design', 'Motion Graphics', 'VFX', 'Documentary', 'Weddings', 'Corporate', 'Social Media', 'Podcasts', 'Cinematic', 'Promo', 'Trailer', 'Intro / Outro', 'Other'],
  },
  rent_service: {
    label: 'Rental Services',
    icon: 'truck',
    roleGroup: 'PROVIDER',
    description: 'Rent top-tier professional gear and equipment.',
    info: 'List your professional gear, vehicles, or property for rent. From cameras to heavy village machinery like JCBs.',
    subCategories: ['Camera Gear', 'Lighting', 'Sound Systems', 'Photography Studios', 'Lenses', 'Drones', 'Grip Equipment', 'Livestream Gear', 'Luxury Cars', 'Tempo Travelers', 'Buses', 'Heavy Vehicles (JCB/Crane)', 'Generators', 'Pandal / Tents', 'Event Furniture', 'Agricultural Gear', 'Tractors', 'Function Halls', 'Catering Equipment', 'Laptops / IT Gear', 'Costumes / Wardrobe', 'DJs / Sound Sets', 'Other'],
  },
  photographer: {
    label: 'Photographer',
    icon: 'camera',
    roleGroup: 'PROVIDER',
    description: 'Cinematic photography for brands and events.',
    info: 'Showcase your photography portfolio, book high-value events, and collaborate with top brands.',
    subCategories: ['Wedding', 'Portrait', 'Product', 'Event', 'Fashion', 'Wildlife', 'Astro', 'Architecture', 'Food', 'Editorial', 'Other'],
  },
  videographer: {
    label: 'Videographer',
    icon: 'camera',
    roleGroup: 'PROVIDER',
    description: 'Professional cinematography and event filming.',
    info: 'Get hired for cinema-grade videography, commercial shoots, and digital content creation.',
    subCategories: ['Event Filming', 'Cinema', 'Interviews', 'Live Stream', 'Travel Filming', 'Music Videos', 'Industrial', 'Real Estate', 'Other'],
  },
  musician: {
    label: 'Musician',
    icon: 'music',
    roleGroup: 'PROVIDER',
    description: 'Elite instrumentalists and producers.',
    info: 'Collaborate with top artists, perform at elite events, and build your professional profile.',
    subCategories: ['Producer', 'Instrumentalist', 'Composer', 'DJ', 'Sound Engineering', 'Beat Making', 'Acoustic', 'Other'],
  },
  actor: {
    label: 'Actor / Performer',
    icon: 'users',
    roleGroup: 'PROVIDER',
    description: 'Talent for cinema, ads, and digital media.',
    info: 'Secure acting roles in cinema, TV commercials, and digital series.',
    subCategories: ['Film', 'Theater', 'Voice Over', 'Commercial', 'Street Play', 'Mimicry', 'Stunt Work', 'Other'],
  },
};

async function main() {
  console.log('🌱 Starting seed...');

  for (const [slug, categoryData] of Object.entries(DUMMY_CATEGORIES)) {
    console.log(`Creating category: ${categoryData.label}`);
    
    // Create Role Category
    const category = await prisma.roleCategory.upsert({
      where: { slug: slug },
      update: {},
      create: {
        slug: slug,
        name: categoryData.label,
        icon: categoryData.icon,
        roleGroup: categoryData.roleGroup,
        description: categoryData.description,
        info: categoryData.info,
      },
    });

    // Create Role Sub Categories
    for (const subName of categoryData.subCategories) {
      const subSlug = subName.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-').replace(/[()]/g, '');
      await prisma.roleSubCategory.upsert({
        where: {
          roleCategoryId_slug: {
            roleCategoryId: category.id,
            slug: subSlug,
          },
        },
        update: {},
        create: {
          name: subName,
          slug: subSlug,
          roleCategoryId: category.id,
        },
      });
    }
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
