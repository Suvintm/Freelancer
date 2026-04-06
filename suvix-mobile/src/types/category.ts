export type RoleGroupId = 'PROVIDER' | 'CLIENT';

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  roleGroupId: RoleGroupId;
  defaultModule: 'creators' | 'rentals' | 'promoters' | 'editors' | 'clients';
  description: string;
  color?: string;
  thumbnail: any; // Cinematic background image
  overlayIcon?: any; // Category-specific PNG icon overlay
  info: string; // Detailed professional path description
}

export type CategoryId = 
  | 'yt_influencer' 
  | 'reels_creator' 
  | 'social_promoter' 
  | 'rent_service' 
  | 'video_editor'
  | 'fitness_expert'
  | 'photographer'
  | 'videographer'
  | 'singer'
  | 'musician'
  | 'dancer'
  | 'actor'
  | 'agency_client'
  | 'direct_client';
