import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  AuthMethod,
  OnboardingRoleGroup,
  OnboardingRoleSlug,
  YouTubeChannel,
  InstagramAccount,
  CreatorData,
  EditorData,
  BrandData,
  GoogleIdentity,
  SelectedRole,
  TempSignupData,
  OnboardingSliceState,
} from '../../features/onboarding/types';

// Re-export types for backward compatibility
export type {
  AuthMethod,
  OnboardingRoleGroup,
  OnboardingRoleSlug,
  YouTubeChannel,
  InstagramAccount,
  CreatorData,
  EditorData,
  BrandData,
  GoogleIdentity,
  SelectedRole,
  TempSignupData,
  OnboardingSliceState,
};

const initialState: OnboardingSliceState = {
  tempSignupData: {},
  selectedRole: null,
  authMethod: null,
  creatorData: {
    channels: [],
    selectedChannelIds: [],
    instagramAccounts: [],
    selectedInstagramAccountIds: [],
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
      if (state.creatorData) {
        state.creatorData.selectedChannelIds = [];
      }
    },
    setInstagramAccounts: (state, action: PayloadAction<any[]>) => {
      if (state.creatorData) {
        state.creatorData.instagramAccounts = action.payload;
        state.creatorData.selectedInstagramAccountIds = action.payload.map(acc => acc.accountId);
      }
    },
    resetInstagramAccounts: (state) => {
      if (state.creatorData) {
        state.creatorData.instagramAccounts = [];
        state.creatorData.selectedInstagramAccountIds = [];
      }
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
  setInstagramAccounts,
  resetInstagramAccounts,
} = onboardingSlice.actions;

// --- Selectors ---
export const selectOnboarding = (state: RootState) => state.onboarding;
export const selectTempSignupData = (state: RootState) => state.onboarding?.tempSignupData;
export const selectSelectedRole = (state: RootState) => state.onboarding?.selectedRole;
export const selectAuthMethod = (state: RootState) => state.onboarding?.authMethod;
export const selectCreatorData = (state: RootState) => state.onboarding?.creatorData;
export const selectEditorData = (state: RootState) => state.onboarding?.editorData;
export const selectBrandData = (state: RootState) => state.onboarding?.brandData;
export const selectGoogleIdentity = (state: RootState) => state.onboarding?.googleIdentity;
export const selectYoutubeDiscovery = (state: RootState) => state.onboarding?.youtubeDiscovery;

export const onboardingReducer = onboardingSlice.reducer;
