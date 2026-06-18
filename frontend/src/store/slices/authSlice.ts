import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture?: string;
  isOnboarded: boolean;
  primaryRole: {
    group: 'CLIENT' | 'PROVIDER';
    category: string;
    subCategory: string;
  };
  youtubeProfile?: Array<{
    id: string;
    channel_id: string;
    channel_name: string;
    thumbnail_url: string;
    subscriber_count: number;
    video_count: number;
    view_count?: string | number;
    subCategoryName?: string;
  }>;
  bio?: string;
  followers?: number;
  following?: number;
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

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string; user?: AuthUser }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearAuth: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setAuth, setTokens, updateUser, clearAuth, setInitialized, setAuthenticated } = authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
