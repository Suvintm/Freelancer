import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number | string;
  videoCount: number | string;
  isClaimed?: boolean;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }>;
}

export interface TempSignupData {
  intent?: 'login' | 'register';
  onboardingStep?: 'role' | 'subcategory' | 'youtube' | 'details' | 'complete';
  authMethod?: 'email' | 'google';
  categoryId?: string;
  categorySlug?: string;
  roleName?: string;
  roleSubCategoryIds?: string[];
  isSocialSignup?: boolean;
  socialProfile?: {
    name: string;
    email: string;
    picture?: string;
    googleId: string;
  };
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
}

interface OnboardingState {
  tempSignupData: TempSignupData;
  youtubeDiscovery: {
    channels: YouTubeChannel[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
}

const initialState: OnboardingState = {
  tempSignupData: {},
  youtubeDiscovery: {
    channels: [],
    selectedChannelIds: [],
    categorizations: {},
  },
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setTempSignupData: (state, action: PayloadAction<Partial<TempSignupData>>) => {
      state.tempSignupData = { ...state.tempSignupData, ...action.payload };
    },
    clearTempSignupData: (state) => {
      state.tempSignupData = {};
      state.youtubeDiscovery = {
        channels: [],
        selectedChannelIds: [],
        categorizations: {},
      };
    },
    addDiscoveredChannels: (state, action: PayloadAction<YouTubeChannel[]>) => {
      state.youtubeDiscovery.channels = action.payload;
    },
    toggleYoutubeChannelSelection: (state, action: PayloadAction<string>) => {
      const channelId = action.payload;
      const { selectedChannelIds } = state.youtubeDiscovery;
      const index = selectedChannelIds.indexOf(channelId);
      if (index > -1) {
        state.youtubeDiscovery.selectedChannelIds = selectedChannelIds.filter((id) => id !== channelId);
      } else {
        state.youtubeDiscovery.selectedChannelIds.push(channelId);
      }
    },
    setYoutubeChannelCategory: (state, action: PayloadAction<{ channelId: string; subCategoryId: string }>) => {
      const { channelId, subCategoryId } = action.payload;
      state.youtubeDiscovery.categorizations[channelId] = subCategoryId;
    },
    resetYoutubeDiscovery: (state) => {
      state.youtubeDiscovery = {
        channels: [],
        selectedChannelIds: [],
        categorizations: {},
      };
    },
  },
});

export const {
  setTempSignupData,
  clearTempSignupData,
  addDiscoveredChannels,
  toggleYoutubeChannelSelection,
  setYoutubeChannelCategory,
  resetYoutubeDiscovery,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
