export type RoleGroupId = 'PROVIDER' | 'CLIENT';

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  roleGroupId: RoleGroupId;
  defaultModule: 'creators' | 'rentals' | 'promoters' | 'editors' | 'clients';
  description: string;
  color?: string;
}

export type CategoryId = 
  | 'yt_influencer' 
  | 'reels_creator' 
  | 'social_promoter' 
  | 'rent_service' 
  | 'video_editor'
  | 'agency_client'
  | 'direct_client';
