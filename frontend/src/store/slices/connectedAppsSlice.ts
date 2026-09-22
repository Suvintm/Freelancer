import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface DiscoveredVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt?: string;
  viewCount?: string | number;
  likeCount?: string | number;
  commentCount?: string | number;
  durationSecs?: number;
  duration?: string;
}

export interface DiscoveredChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount?: string;
  description?: string;
  customUrl?: string;
  isClaimed?: boolean;
  niche?: string;
  videos?: DiscoveredVideo[];
}

export type ConnectedAppsFlowStep =
  | 'idle'
  | 'authorizing'
  | 'discovering'
  | 'channel_select'
  | 'syncing'
  | 'success'
  | 'error';

export interface ConnectedAppsState {
  isModalOpen: boolean;
  activePlatformId: string | null;
  activePlatformName: string | null;
  step: ConnectedAppsFlowStep;
  accessToken: string | null;
  discoveryToken: string | null;
  discoveredChannels: DiscoveredChannel[];
  selectedChannelId: string | null;
  selectedNiche: string | null;
  syncProgress: number;
  syncStatusMessage: string | null;
  errorMessage: string | null;
}

const initialState: ConnectedAppsState = {
  isModalOpen: false,
  activePlatformId: null,
  activePlatformName: null,
  step: 'idle',
  accessToken: null,
  discoveryToken: null,
  discoveredChannels: [],
  selectedChannelId: null,
  selectedNiche: null,
  syncProgress: 0,
  syncStatusMessage: null,
  errorMessage: null,
};

export const connectedAppsSlice = createSlice({
  name: 'connectedApps',
  initialState,
  reducers: {
    openConnectModal: (
      state,
      action: PayloadAction<{ platformId: string; platformName?: string }>
    ) => {
      state.isModalOpen = true;
      state.activePlatformId = action.payload.platformId;
      state.activePlatformName = action.payload.platformName || action.payload.platformId;
      state.step = 'idle';
      state.accessToken = null;
      state.discoveryToken = null;
      state.discoveredChannels = [];
      state.selectedChannelId = null;
      state.selectedNiche = null;
      state.syncProgress = 0;
      state.syncStatusMessage = null;
      state.errorMessage = null;
    },
    closeConnectModal: () => {
      return initialState;
    },
    resetConnectedAppFlow: () => {
      return initialState;
    },
    setStep: (state, action: PayloadAction<ConnectedAppsFlowStep>) => {
      state.step = action.payload;
    },
    setAuthToken: (
      state,
      action: PayloadAction<{ token: string; discoveryToken?: string }>
    ) => {
      state.accessToken = action.payload.token;
      if (action.payload.discoveryToken) {
        state.discoveryToken = action.payload.discoveryToken;
      }
    },
    setDiscoveredChannels: (
      state,
      action: PayloadAction<DiscoveredChannel[]>
    ) => {
      state.discoveredChannels = action.payload;
      const firstAvailable = action.payload.find((c) => !c.isClaimed);
      state.selectedChannelId = firstAvailable ? firstAvailable.channelId : (action.payload[0]?.channelId || null);
      state.step = 'channel_select';
      state.errorMessage = null;
    },
    setSelectedChannelId: (state, action: PayloadAction<string>) => {
      state.selectedChannelId = action.payload;
    },
    setSelectedNiche: (state, action: PayloadAction<string>) => {
      state.selectedNiche = action.payload;
    },
    setSyncProgress: (
      state,
      action: PayloadAction<{ progress: number; message: string }>
    ) => {
      state.syncProgress = action.payload.progress;
      state.syncStatusMessage = action.payload.message;
      state.step = 'syncing';
    },
    setSyncSuccess: (state) => {
      state.step = 'success';
      state.syncProgress = 100;
      state.syncStatusMessage = 'Successfully linked and synced!';
    },
    setFlowError: (state, action: PayloadAction<string>) => {
      state.step = 'error';
      state.errorMessage = action.payload;
    },
  },
});

export const {
  openConnectModal,
  closeConnectModal,
  resetConnectedAppFlow,
  setStep,
  setAuthToken,
  setDiscoveredChannels,
  setSelectedChannelId,
  setSelectedNiche,
  setSyncProgress,
  setSyncSuccess,
  setFlowError,
} = connectedAppsSlice.actions;

export const selectConnectedApps = (state: { connectedApps: ConnectedAppsState }) =>
  state.connectedApps;

export const connectedAppsReducer = connectedAppsSlice.reducer;
