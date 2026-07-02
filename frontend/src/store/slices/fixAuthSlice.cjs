const fs = require('fs');

const correctPrefix = `import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture?: string;
  coverBanner?: string | null;
  isOnboarded: boolean;
  primaryRole: {
    group: 'CLIENT' | 'PROVIDER';
    category: string;
    subCategory: string;
  };
  youtubeProfile?: Array<{
    id: string;
    channel_id: string;
    channelId?: string;
    channel_name: string;
    thumbnail_url: string;
    subscriber_count: number;
    video_count: number;
    view_count?: string | number;
    subCategoryName?: string;
    banner_url?: string | null;
    custom_url?: string;
    country?: string;
    description?: string;
    avg_views_per_video?: number;
    engagement_rate?: number;
  }>;
  bio?: string;
  website?: string;
  followers?: number;
  following?: number;
  followingIds?: string[];
  subscription?: {
    tier: 'free' | 'creator' | 'pro' | 'elite';
    features: string[];
    expiresAt?: string;
    isTrial?: boolean;
    daysRemaining?: number;
    planTier?: string;
  };
}

export interface SignupPayload {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  motherTongue?: string;
  categoryId?: string;
  roleSubCategoryIds?: string[];
  youtubeChannels?: Array<{
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    subscriberCount?: number | string;
    videoCount?: number | string;
    uploadsPlaylistId?: string | null;
    subCategoryId?: string;
    subCategorySlug?: string | null;
    isPrimary?: boolean;
    isVerified?: boolean;
    videos?: Array<{
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
    }>;
  }>;
  googleId?: string;
  authProvider?: string;
  profilePicture?: File | string | null;
  pushToken?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

`;

const filePath = 'c:/Users/suvin/Downloads/freelancer/frontend/src/store/slices/authSlice.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\\n');

// Find the line where 'export interface AuthState {' starts
const stateIdx = lines.findIndex(l => l.includes('export interface AuthState {'));
const remainder = lines.slice(stateIdx).join('\\n');

fs.writeFileSync(filePath, correctPrefix + remainder);
console.log('Fixed authSlice.ts');
