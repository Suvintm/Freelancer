import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storageModule from 'redux-persist/lib/storage';

const storage = (storageModule as any).default || storageModule;
import { authReducer } from './slices/authSlice';
import type { AuthUser } from './slices/authSlice';
import { onboardingReducer } from './slices/onboardingSlice';
import type { TempSignupData, YouTubeChannel } from './slices/onboardingSlice';
import { uiReducer } from './slices/uiSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'refreshToken', 'user', 'isAuthenticated'],
};

const onboardingPersistConfig = {
  key: 'onboarding',
  storage,
  whitelist: ['tempSignupData', 'youtubeDiscovery'],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer) as any,
    onboarding: persistReducer(onboardingPersistConfig, onboardingReducer) as any,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export interface RootState {
  auth: {
    token: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
  };
  onboarding: {
    tempSignupData: TempSignupData;
    youtubeDiscovery: {
      channels: YouTubeChannel[];
      selectedChannelIds: string[];
      categorizations: Record<string, string>;
    };
  };
  ui: {
    sidebarOpen: boolean;
  };
}

export type AppDispatch = typeof store.dispatch;
