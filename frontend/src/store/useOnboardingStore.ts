import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  // ── Onboarding flow control ──────────────────────────────────────────────
  /** 'login' = Google on Login page (no signup). 'register' = new user onboarding. */
  intent?: 'login' | 'register';
  /** Current step in the onboarding sequence — used by OnboardingGuard for route enforcement. */
  onboardingStep?: 'role' | 'subcategory' | 'youtube' | 'details' | 'complete';
  /** How the user chose to authenticate — set before navigating away from RoleSelection. */
  authMethod?: 'email' | 'google';

  // ── Role & Niche ─────────────────────────────────────────────────────────
  categoryId?: string;
  categorySlug?: string;
  roleName?: string;
  roleSubCategoryIds?: string[];

  // ── Social / OAuth ───────────────────────────────────────────────────────
  isSocialSignup?: boolean;
  socialProfile?: {
    name: string;
    email: string;
    picture?: string;
    googleId: string;
  };

  // ── YouTube ──────────────────────────────────────────────────────────────
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
  setTempSignupData: (data: Partial<TempSignupData>) => void;
  clearTempSignupData: () => void;
  
  youtubeDiscovery: {
    channels: YouTubeChannel[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
  addDiscoveredChannels: (channels: YouTubeChannel[]) => void;
  toggleYoutubeChannelSelection: (channelId: string) => void;
  setYoutubeChannelCategory: (channelId: string, subCategoryId: string) => void;
  resetYoutubeDiscovery: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      tempSignupData: {},
      youtubeDiscovery: {
        channels: [],
        selectedChannelIds: [],
        categorizations: {},
      },

      setTempSignupData: (data) => {
        set((state) => ({
          tempSignupData: { ...state.tempSignupData, ...data },
        }));
      },

      clearTempSignupData: () => {
        set({
          tempSignupData: {},
          youtubeDiscovery: {
            channels: [],
            selectedChannelIds: [],
            categorizations: {},
          },
        });
      },

      addDiscoveredChannels: (channels) => {
        set((state) => ({
          youtubeDiscovery: {
            ...state.youtubeDiscovery,
            channels,
          },
        }));
      },

      toggleYoutubeChannelSelection: (channelId) => {
        set((state) => {
          const { selectedChannelIds } = state.youtubeDiscovery;
          const isSelected = selectedChannelIds.includes(channelId);
          const newSelection = isSelected
            ? selectedChannelIds.filter((id) => id !== channelId)
            : [...selectedChannelIds, channelId];
          
          return {
            youtubeDiscovery: {
              ...state.youtubeDiscovery,
              selectedChannelIds: newSelection,
            },
          };
        });
      },

      setYoutubeChannelCategory: (channelId, subCategoryId) => {
        set((state) => ({
          youtubeDiscovery: {
            ...state.youtubeDiscovery,
            categorizations: {
              ...state.youtubeDiscovery.categorizations,
              [channelId]: subCategoryId,
            },
          },
        }));
      },
      
      resetYoutubeDiscovery: () => {
        set({
          youtubeDiscovery: {
            channels: [],
            selectedChannelIds: [],
            categorizations: {},
          }
        });
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
