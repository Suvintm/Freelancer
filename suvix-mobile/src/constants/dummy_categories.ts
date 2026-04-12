import { CategoryConfig } from '../types/category';

const COMMON_SUB_CATEGORIES = [
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
  'Other'
];

export const DUMMY_CATEGORIES: Record<string, CategoryConfig> = {
  direct_client: {
    id: 'direct_client',
    label: 'Normal User / Client',
    icon: 'briefcase',
    roleGroupId: 'CLIENT',
    defaultModule: 'clients',
    description: 'Discover and hire elite talent for your projects.',
    color: '#FFFFFF',
    thumbnail: require('../../assets/images/categories/client.jpg'),
    overlayIcon: require('../../assets/images/categories/normaluser.png'),
    subCategories: ['General Content', 'Business', 'Personal', 'E-commerce', 'Other'],
    info: 'As a Normal User/Client, you can explore professional content, discover elite talent, and hire the best editors, creators, and artists for your requirements.'
  },
  yt_influencer: {
    id: 'yt_influencer',
    label: 'YouTube Creator',
    icon: 'youtube',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Scale your content and grow your audience presence.',
    color: '#FF0000',
    thumbnail: require('../../assets/images/categories/youtube.jpg'),
    overlayIcon: require('../../assets/images/categories/youtubeicon.png'),
    subCategories: [
      'Vlogs', 'Technology', 'Education', 'Fitness', 'Entertainment', 
      'Gaming', 'Food', 'Travel', 'Music', 'Sports', 'Movies', 'News', 
      'Livestreaming', 'Podcasts', 'Unboxing', 'Lifestyle', 'Other'
    ],
    info: 'Promote your Instagram account with SuviX by making your channel visible, exploring more people to get more views, and building a sustainable career directly on YouTube.'
  },
  fitness_expert: {
    id: 'fitness_expert',
    label: 'Fitness Pro',
    icon: 'activity',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Professional fitness coaching and wellness content.',
    color: '#2ECC71',
    thumbnail: require('../../assets/images/categories/fitness.jpg'),
    overlayIcon: require('../../assets/images/categories/fitnessicon.png'),
    subCategories: [
      'Gym Training', 'Yoga', 'Nutrition', 'Wellness', 'Crossfit', 
      'Bodybuilding', 'Zumba', 'Pilates', 'Meditation', 'HIIT', 'Other'
    ],
    info: 'Join as a Fitness Pro to launch your wellness programs, connect with health-conscious users, and build a premium digital fitness brand with local and global reach.'
  },
  singer: {
    id: 'singer',
    label: 'Singer / Vocalist',
    icon: 'mic',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Pro vocalists for music and commercial output.',
    color: '#F1C40F',
    thumbnail: require('../../assets/images/categories/singer.jpg'),
    overlayIcon: require('../../assets/images/categories/singericon.png'),
    subCategories: [
      'Classical', 'Pop', 'Rock', 'Jazz', 'Folk', 'EDM', 
      'Hip Hop', 'R&B', 'Country', 'Vocal Coaching', 'Other'
    ],
    info: 'Connect with music producers, record for high-end campaigns, and grow your professional singing career through the SuviX talent network.'
  },
  dancer: {
    id: 'dancer',
    label: 'Dancer',
    icon: 'move',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Choreographers and performers for all media.',
    color: '#E91E63',
    thumbnail: require('../../assets/images/categories/dancer.jpg'),
    overlayIcon: require('../../assets/images/categories/danceicon.png'),
    subCategories: [
      'Classical', 'Hip Hop', 'Contemporary', 'Bollywood', 'Salsa', 
      'Ballet', 'Street Dance', 'Choreography', 'Musical Theater', 'Other'
    ],
    info: 'Join the premier network for professional dancers. Book commercial gigs, choreograph for music videos, and showcase your talent to global brands.'
  },
  social_promoter: {
    id: 'social_promoter',
    label: 'Ads & Promotions',
    icon: 'megaphone',
    roleGroupId: 'PROVIDER',
    defaultModule: 'promoters',
    description: 'High-impact social media growth and advertising.',
    color: '#2980B9',
    thumbnail: require('../../assets/images/categories/promotions.jpg'),
    overlayIcon: require('../../assets/images/categories/ads.png'),
    subCategories: [
      'Instagram Ads', 'YouTube Ads', 'SEO', 'Influencer Marketing', 
      'Rickshaw Branding', 'Wall Painting Ads', 'Bus Branding', 'Digital Billboards',
      'Local Cable Ads', 'Radio Spots', 'Newspaper Classifieds', 'Pamphlet Distribution',
      'Content Marketing', 'Brand Strategy', 'Affiliate', 'Other'
    ],
    info: 'Scale your reach with multi-channel amplification. From digital influencer marketing to local rickshaw branding, help brands dominate their specific city or village markets.'
  },
  video_editor: {
    id: 'video_editor',
    label: 'Video Editor',
    icon: 'video',
    roleGroupId: 'PROVIDER',
    defaultModule: 'editors',
    description: 'Professional post-production and high-fidelity editing.',
    color: '#8E44AD',
    thumbnail: require('../../assets/images/categories/editor.jpg'),
    overlayIcon: require('../../assets/images/categories/editing.png'),
    subCategories: [
      'Short Films', 'Reels / Shorts', 'Commercials', 'YouTube Edits', 
      'Color Grading', 'Sound Design', 'Motion Graphics', 'VFX', 
      'Documentary', 'Weddings', 'Corporate', 'Social Media', 
      'Podcasts', 'Cinematic', 'Promo', 'Trailer', 'Intro / Outro', 'Other'
    ],
    info: 'As a video editor on SuviX, you can earn by taking on high-end projects, get direct clients, and build a world-class professional profile that showcases your cinematic skills.'
  },
  rent_service: {
    id: 'rent_service',
    label: 'Rental Services',
    icon: 'truck',
    roleGroupId: 'PROVIDER',
    defaultModule: 'rentals',
    description: 'Rent top-tier professional gear and equipment.',
    color: '#27AE60',
    thumbnail: require('../../assets/images/categories/rentals.jpg'),
    overlayIcon: require('../../assets/images/categories/rental.png'),
    subCategories: [
      'Camera Gear', 'Lighting', 'Sound Systems', 'Photography Studios', 'Lenses', 
      'Drones', 'Grip Equipment', 'Livestream Gear', 'Luxury Cars', 'Tempo Travelers', 
      'Buses', 'Heavy Vehicles (JCB/Crane)', 'Generators', 'Pandal / Tents', 'Event Furniture', 
      'Agricultural Gear', 'Tractors', 'Function Halls', 'Catering Equipment', 
      'Laptops / IT Gear', 'Costumes / Wardrobe', 'DJs / Sound Sets', 'Other'
    ],
    info: 'List your professional gear, vehicles, or property for rent. From high-end cinema cameras to heavy village machinery like JCBs and Tractors, manage your inventory and earn passive income.'
  },
  photographer: {
    id: 'photographer',
    label: 'Photographer',
    icon: 'camera',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Cinematic photography for brands and events.',
    color: '#E67E22',
    thumbnail: require('../../assets/images/categories/photographer.jpg'),
    overlayIcon: require('../../assets/images/categories/photographer copy.png'),
    subCategories: [
      'Wedding', 'Portrait', 'Product', 'Event', 'Fashion', 
      'Wildlife', 'Astro', 'Architecture', 'Food', 'Editorial', 'Other'
    ],
    info: 'Showcase your photography portfolio, book high-value events, and collaborate with top brands looking for professional visual storytelling.'
  },
  videographer: {
    id: 'videographer',
    label: 'Videographer',
    icon: 'camera',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Professional cinematography and event filming.',
    color: '#D35400',
    thumbnail: require('../../assets/images/categories/videographer.jpg'),
    subCategories: [
      'Event Filming', 'Cinema', 'Interviews', 'Live Stream', 
      'Travel Filming', 'Music Videos', 'Industrial', 'Real Estate', 'Other'
    ],
    info: 'Get hired for cinema-grade videography, commercial shoots, and digital content creation for the elite SuviX creator network.'
  },
  musician: {
    id: 'musician',
    label: 'Musician',
    icon: 'music',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Elite instrumentalists and producers.',
    color: '#BDC3C7',
    thumbnail: require('../../assets/images/categories/musician.jpg'),
    subCategories: [
      'Producer', 'Instrumentalist', 'Composer', 'DJ', 
      'Sound Engineering', 'Beat Making', 'Acoustic', 'Other'
    ],
    info: 'Collaborate with top artists, perform at elite events, and build your professional profile as a premier instrumentalist or producer.'
  },
  actor: {
    id: 'actor',
    label: 'Actor / Performer',
    icon: 'users',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Talent for cinema, ads, and digital media.',
    color: '#34495E',
    thumbnail: require('../../assets/images/categories/actor.jpg'),
    overlayIcon: require('../../assets/images/categories/actors.png'),
    subCategories: [
      'Film', 'Theater', 'Voice Over', 'Commercial', 
      'Street Play', 'Mimicry', 'Stunt Work', 'Other'
    ],
    info: 'Secure acting roles in cinema, TV commercials, and digital series. Build a verified portfolio that catches the eye of industry-leading directors.'
  },
};

export const DUMMY_CATEGORY_LIST = Object.values(DUMMY_CATEGORIES);
