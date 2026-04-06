import { CategoryConfig, CategoryId } from '../types/category';

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  yt_influencer: {
    id: 'yt_influencer',
    label: 'YT Influencer',
    icon: 'youtube',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Create and collaborate on YouTube content.',
    color: '#FF0000',
  },
  reels_creator: {
    id: 'reels_creator',
    label: 'Reels Creator',
    icon: 'instagram',
    roleGroupId: 'PROVIDER',
    defaultModule: 'creators',
    description: 'Specialized in short-form vertical video.',
    color: '#E4405F',
  },
  social_promoter: {
    id: 'social_promoter',
    label: 'Ads Promoter',
    icon: 'megaphone',
    roleGroupId: 'PROVIDER',
    defaultModule: 'promoters',
    description: 'Promote products on social media platforms.',
    color: '#007AFF',
  },
  video_editor: {
    id: 'video_editor',
    label: 'Video Editor',
    icon: 'video',
    roleGroupId: 'PROVIDER',
    defaultModule: 'editors',
    description: 'Professional post-production and editing.',
    color: '#8E44AD',
  },
  rent_service: {
    id: 'rent_service',
    label: 'Rent Service',
    icon: 'truck',
    roleGroupId: 'PROVIDER',
    defaultModule: 'rentals',
    description: 'Provide equipment and services for rent.',
    color: '#27AE60',
  },
  agency_client: {
    id: 'agency_client',
    label: 'Agency/Brand',
    icon: 'building',
    roleGroupId: 'CLIENT',
    defaultModule: 'clients',
    description: 'Hire creators for high-scale campaigns.',
    color: '#34495E',
  },
  direct_client: {
    id: 'direct_client',
    label: 'Individual Client',
    icon: 'user',
    roleGroupId: 'CLIENT',
    defaultModule: 'clients',
    description: 'Hire creators for personal projects.',
    color: '#16A085',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
export const PROVIDER_CATEGORIES = CATEGORY_LIST.filter(c => c.roleGroupId === 'PROVIDER');
export const CLIENT_CATEGORIES = CATEGORY_LIST.filter(c => c.roleGroupId === 'CLIENT');
