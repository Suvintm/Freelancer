import { createSlice } from '@reduxjs/toolkit';
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
  preferencesCompleted?: boolean;
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

export interface AuthState {
  sessions: AuthSession[];
  activeUserId: string | null;
  isInitialized: boolean;
  isAddingAccount: boolean;
}

const initialState: AuthState = {
  sessions: [],
  activeUserId: null,
  isInitialized: false,
  isAddingAccount: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken: string }>) => {
      const { user, token, refreshToken } = action.payload;
      const existingSessionIndex = state.sessions.findIndex(s => s.user.id === user.id);
      
      if (existingSessionIndex !== -1) {
        state.sessions[existingSessionIndex] = { user, token, refreshToken };
      } else {
        state.sessions.push({ user, token, refreshToken });
      }
      
      state.activeUserId = user.id;
      state.isInitialized = true;
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string; user?: AuthUser }>) => {
      const activeSession = state.sessions.find(s => s.user.id === state.activeUserId);
      if (activeSession) {
        activeSession.token = action.payload.token;
        activeSession.refreshToken = action.payload.refreshToken;
        if (action.payload.user) {
          activeSession.user = action.payload.user;
        }
      } else if (action.payload.user) {
        // Fallback if no active session but user is provided
        state.sessions.push({
          user: action.payload.user,
          token: action.payload.token,
          refreshToken: action.payload.refreshToken,
        });
        state.activeUserId = action.payload.user.id;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      const activeSession = state.sessions.find(s => s.user.id === state.activeUserId);
      if (activeSession) {
        activeSession.user = { ...activeSession.user, ...action.payload };
      }
    },
    clearAuth: (state) => {
      // Clears the active session only
      if (state.activeUserId) {
        state.sessions = state.sessions.filter(s => s.user.id !== state.activeUserId);
        state.activeUserId = state.sessions.length > 0 ? state.sessions[0].user.id : null;
      }
      state.isInitialized = true;
    },
    clearAllAuth: (state) => {
      state.sessions = [];
      state.activeUserId = null;
      state.isInitialized = true;
    },
    switchSession: (state, action: PayloadAction<string>) => {
      if (state.sessions.some(s => s.user.id === action.payload)) {
        state.activeUserId = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.user.id !== action.payload);
      if (state.activeUserId === action.payload) {
        state.activeUserId = state.sessions.length > 0 ? state.sessions[0].user.id : null;
      }
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setIsAddingAccount: (state, action: PayloadAction<boolean>) => {
      state.isAddingAccount = action.payload;
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      // For backward compatibility: if false, log out active session
      if (!action.payload && state.activeUserId) {
        state.sessions = state.sessions.filter(s => s.user.id !== state.activeUserId);
        state.activeUserId = state.sessions.length > 0 ? state.sessions[0].user.id : null;
      }
    },
  },
});

export const { 
  setAuth, 
  setTokens, 
  updateUser, 
  clearAuth, 
  clearAllAuth,
  switchSession,
  removeSession,
  setInitialized,
  setIsAddingAccount,
  setAuthenticated 
} = authSlice.actions;

export const authReducer = authSlice.reducer;

// Selectors
export const selectActiveSession = (state: { auth: AuthState }) => 
  state.auth.sessions.find(s => s.user.id === state.auth.activeUserId) || null;

export const selectAllSessions = (state: { auth: AuthState }) => state.auth.sessions;

export const selectToken = (state: { auth: AuthState }) => {
  const session = selectActiveSession(state);
  return session ? session.token : null;
};

export const selectRefreshToken = (state: { auth: AuthState }) => {
  const session = selectActiveSession(state);
  return session ? session.refreshToken : null;
};

export const selectUser = (state: { auth: AuthState }) => {
  const session = selectActiveSession(state);
  return session ? session.user : null;
};

export const selectIsAuthenticated = (state: { auth: AuthState }) => {
  return selectActiveSession(state) !== null;
};

export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;

export const selectIsAddingAccount = (state: { auth: AuthState }) => state.auth.isAddingAccount;
