import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthMethod, OnboardingRoleGroup, OnboardingRoleSlug, DiscoveredYouTubeChannel, SocialProfile } from '../../features/onboarding/types/onboarding.types';

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number | string;
  videoCount: number | string;
  channelHandle?: string;
  isClaimed?: boolean;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }>;
}

export interface CreatorData {
  channels: YouTubeChannel[];
  selectedChannelIds: string[];
  selectedNiches: string[];
  discoveryToken: string | null;
}

export interface EditorData {
  specializations: string[];
  softwareUsed: string[];
  portfolioUrl: string;
  experienceYears: number;
}

export interface BrandData {
  companyName: string;
  companyWebsite: string;
  designation: string;
  industry: string;
  companySize: string;
  approxBudget: string;
}

export interface GoogleIdentity {
  email: string;
  googleId: string;
  name: string;
  picture?: string;
}

export interface TempSignupData {
  intent?: 'login' | 'register';
  onboardingStep?: 'welcome' | 'role' | 'specialization' | 'brand' | 'subcategory' | 'youtube' | 'details' | 'complete';
  authMethod?: AuthMethod;
  categoryId?: string;
  categorySlug?: OnboardingRoleSlug;
  role?: string;
  roleGroup?: OnboardingRoleGroup;
  roleName?: string;
  roleSubCategoryIds?: string[];
  specializations?: string[];
  softwareUsed?: string[];
  skills?: string[];
  portfolioUrl?: string;
  experienceYears?: number;
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  designation?: string;
  approxBudget?: string | number;
  targetRegions?: string[];
  isSocialSignup?: boolean;
  socialProfile?: SocialProfile;
  youtubeChannels?: DiscoveredYouTubeChannel[];
  discoveryToken?: string | null;
}

export interface OnboardingSliceState {
  tempSignupData: TempSignupData;
  selectedRole: {
    id: string;
    name: string;
    slug: OnboardingRoleSlug;
    roleGroup?: OnboardingRoleGroup;
  } | null;
  authMethod: AuthMethod | null;
  creatorData: CreatorData;
  editorData: EditorData;
  brandData: BrandData;
  googleIdentity: GoogleIdentity | null;
  youtubeDiscovery: {
    channels: YouTubeChannel[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
}

const initialState: OnboardingSliceState = {
  tempSignupData: {},
  selectedRole: null,
  authMethod: null,
  creatorData: {
    channels: [],
    selectedChannelIds: [],
    selectedNiches: [],
    discoveryToken: null,
  },
  editorData: {
    specializations: [],
    softwareUsed: [],
    portfolioUrl: '',
    experienceYears: 2,
  },
  brandData: {
    companyName: '',
    companyWebsite: '',
    designation: '',
    industry: 'Tech & SaaS',
    companySize: '11 - 50',
    approxBudget: '$1,000 - $5,000 / mo',
  },
  googleIdentity: null,
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
    // --- Enterprise State Machine Actions ---
    selectRoleAction: (
      state,
      action: PayloadAction<{ id: string; name: string; slug: OnboardingRoleSlug; roleGroup?: OnboardingRoleGroup }>
    ) => {
      state.selectedRole = action.payload;
      state.tempSignupData.categoryId = action.payload.id;
      state.tempSignupData.categorySlug = action.payload.slug;
      state.tempSignupData.role = action.payload.slug;
      state.tempSignupData.roleName = action.payload.name;
      state.tempSignupData.roleGroup = action.payload.roleGroup;
    },
    setAuthMethodAction: (state, action: PayloadAction<AuthMethod>) => {
      state.authMethod = action.payload;
      state.tempSignupData.authMethod = action.payload;
    },
    updateEditorData: (state, action: PayloadAction<Partial<EditorData>>) => {
      state.editorData = { ...state.editorData, ...action.payload };
      if (action.payload.specializations) state.tempSignupData.specializations = action.payload.specializations;
      if (action.payload.softwareUsed) {
        state.tempSignupData.softwareUsed = action.payload.softwareUsed;
        state.tempSignupData.skills = action.payload.softwareUsed;
      }
      if (action.payload.portfolioUrl !== undefined) state.tempSignupData.portfolioUrl = action.payload.portfolioUrl;
      if (action.payload.experienceYears !== undefined) state.tempSignupData.experienceYears = action.payload.experienceYears;
    },
    updateBrandData: (state, action: PayloadAction<Partial<BrandData>>) => {
      state.brandData = { ...state.brandData, ...action.payload };
      if (action.payload.companyName !== undefined) state.tempSignupData.companyName = action.payload.companyName;
      if (action.payload.companyWebsite !== undefined) state.tempSignupData.companyWebsite = action.payload.companyWebsite;
      if (action.payload.designation !== undefined) state.tempSignupData.designation = action.payload.designation;
      if (action.payload.industry !== undefined) state.tempSignupData.industry = action.payload.industry;
      if (action.payload.companySize !== undefined) state.tempSignupData.companySize = action.payload.companySize;
      if (action.payload.approxBudget !== undefined) state.tempSignupData.approxBudget = action.payload.approxBudget;
    },
    setGoogleIdentity: (state, action: PayloadAction<GoogleIdentity | null>) => {
      state.googleIdentity = action.payload;
      if (action.payload) {
        state.tempSignupData.isSocialSignup = true;
        state.tempSignupData.socialProfile = {
          email: action.payload.email,
          googleId: action.payload.googleId,
          name: action.payload.name,
          picture: action.payload.picture,
        };
      }
    },
    resetRoleSelection: (state) => {
      state.selectedRole = null;
      state.authMethod = null;
      state.tempSignupData = {};
      state.creatorData = initialState.creatorData;
      state.editorData = initialState.editorData;
      state.brandData = initialState.brandData;
      state.googleIdentity = null;
      state.youtubeDiscovery = initialState.youtubeDiscovery;
    },
    setTempSignupData: (state, action: PayloadAction<Partial<TempSignupData>>) => {
      state.tempSignupData = { ...state.tempSignupData, ...action.payload };
      if (action.payload.categorySlug && action.payload.categoryId) {
        state.selectedRole = {
          id: action.payload.categoryId,
          name: action.payload.roleName || action.payload.categorySlug,
          slug: action.payload.categorySlug,
          roleGroup: action.payload.roleGroup || 'PROVIDER',
        };
      }
      if (action.payload.authMethod) {
        state.authMethod = action.payload.authMethod;
      }
    },
    clearTempSignupData: (state) => {
      state.tempSignupData = {};
      state.selectedRole = null;
      state.authMethod = null;
      state.creatorData = initialState.creatorData;
      state.editorData = initialState.editorData;
      state.brandData = initialState.brandData;
      state.googleIdentity = null;
      state.youtubeDiscovery = initialState.youtubeDiscovery;
    },
    addDiscoveredChannels: (state, action: PayloadAction<YouTubeChannel[]>) => {
      state.youtubeDiscovery.channels = action.payload;
      state.creatorData.channels = action.payload;
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
      state.creatorData.selectedChannelIds = state.youtubeDiscovery.selectedChannelIds;
    },
    setYoutubeChannelCategory: (state, action: PayloadAction<{ channelId: string; subCategoryId: string }>) => {
      const { channelId, subCategoryId } = action.payload;
      state.youtubeDiscovery.categorizations[channelId] = subCategoryId;
    },
    resetYoutubeDiscovery: (state) => {
      state.youtubeDiscovery = initialState.youtubeDiscovery;
      state.creatorData = initialState.creatorData;
    },
  },
});

export const {
  selectRoleAction,
  setAuthMethodAction,
  updateEditorData,
  updateBrandData,
  setGoogleIdentity,
  resetRoleSelection,
  setTempSignupData,
  clearTempSignupData,
  addDiscoveredChannels,
  toggleYoutubeChannelSelection,
  setYoutubeChannelCategory,
  resetYoutubeDiscovery,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
