import { CategoryConfig } from '../types/category';

export const DUMMY_CATEGORIES: Record<string, CategoryConfig> = {
  video_editor: {
    id: 'video_editor',
    label: 'Video Editor',
    icon: 'video',
    roleGroupId: 'PROVIDER',
    defaultModule: 'editors',
    description: 'Professional post-production and high-fidelity editing.',
    color: '#8E44AD',
    thumbnail: require('../../assets/images/categories/editor.png'),
    info: 'As a video editor on SuviX, you can earn by taking on high-end projects, get direct clients, and build a world-class professional profile that showcases your cinematic skills.'
  },
  yt_influencer: {
    id: 'yt_influencer',
    label: 'YouTube Creator',
    icon: 'youtube',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Scale your content and grow your audience presence.',
    color: '#FF0000',
    thumbnail: require('../../assets/images/categories/youtube.png'),
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
    thumbnail: require('../../assets/images/categories/fitness.png'),
    info: 'Join as a Fitness Pro to launch your wellness programs, connect with health-conscious users, and build a premium digital fitness brand with local and global reach.'
  },
  social_promoter: {
    id: 'social_promoter',
    label: 'Ads & Promotions',
    icon: 'megaphone',
    roleGroupId: 'PROVIDER',
    defaultModule: 'promoters',
    description: 'High-impact social media growth and advertising.',
    color: '#2980B9',
    thumbnail: require('../../assets/images/categories/promotions.png'),
    info: 'Help brands and creators scale their reach. As a promoter, you specialized in high-conversion ad campaigns and social media amplification.'
  },
  rent_service: {
    id: 'rent_service',
    label: 'Rental Services',
    icon: 'truck',
    roleGroupId: 'PROVIDER',
    defaultModule: 'rentals',
    description: 'Rent top-tier professional gear and equipment.',
    color: '#27AE60',
    thumbnail: require('../../assets/images/categories/rentals.png'),
    info: 'List your professional camera gear and equipment for rent. Manage bookings easily and earn from your idle high-end inventory.'
  },
  photographer: {
    id: 'photographer',
    label: 'Photographer',
    icon: 'camera',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Cinematic photography for brands and events.',
    color: '#E67E22',
    thumbnail: require('../../assets/images/categories/photographer.png'),
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
    thumbnail: require('../../assets/images/categories/videographer.png'),
    info: 'Get hired for cinema-grade videography, commercial shoots, and digital content creation for the elite SuviX creator network.'
  },
  singer: {
    id: 'singer',
    label: 'Singer / Vocalist',
    icon: 'mic',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Pro vocalists for music and commercial output.',
    color: '#F1C40F',
    thumbnail: require('../../assets/images/categories/singer.png'),
    info: 'Connect with music producers, record for high-end campaigns, and grow your professional singing career through the SuviX talent network.'
  },
  musician: {
    id: 'musician',
    label: 'Musician',
    icon: 'music',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Elite instrumentalists and producers.',
    color: '#BDC3C7',
    thumbnail: require('../../assets/images/categories/musician.png'),
    info: 'Collaborate with top artists, perform at elite events, and build your professional profile as a premier instrumentalist or producer.'
  },
  dancer: {
    id: 'dancer',
    label: 'Dancer',
    icon: 'zap',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Choreographers and performers for all media.',
    color: '#E91E63',
    thumbnail: require('../../assets/images/categories/dancer.png'),
    info: 'Join the premier network for professional dancers. Book commercial gigs, choreograph for music videos, and showcase your talent to global brands.'
  },
  actor: {
    id: 'actor',
    label: 'Actor / Performer',
    icon: 'users',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Talent for cinema, ads, and digital media.',
    color: '#34495E',
    thumbnail: require('../../assets/images/categories/actor.png'),
    info: 'Secure acting roles in cinema, TV commercials, and digital series. Build a verified portfolio that catches the eye of industry-leading directors.'
  },
  direct_client: {
    id: 'direct_client',
    label: 'Normal User / Client',
    icon: 'briefcase',
    roleGroupId: 'CLIENT',
    defaultModule: 'clients',
    description: 'Discover and hire elite talent for your projects.',
    color: '#FFFFFF',
    thumbnail: require('../../assets/images/categories/client.png'),
    info: 'As a Normal User/Client, you can explore professional content, discover elite talent, and hire the best editors, creators, and artists for your requirements.'
  },
};

export const DUMMY_CATEGORY_LIST = Object.values(DUMMY_CATEGORIES);
