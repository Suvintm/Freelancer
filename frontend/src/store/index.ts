import { configureStore } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storageModule from 'redux-persist/lib/storage';

const storage = (storageModule as { default?: typeof storageModule }).default || storageModule;
import { authReducer } from './slices/authSlice';
import type { AuthState } from './slices/authSlice';
import { onboardingReducer } from './slices/onboardingSlice';
import type { TempSignupData, YouTubeChannel } from './slices/onboardingSlice';
import { uiReducer } from './slices/uiSlice';
import { uploadReducer } from './slices/uploadSlice';
import type { UploadState } from './slices/uploadSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['sessions', 'activeUserId', 'isAddingAccount'],
};

const onboardingPersistConfig = {
  key: 'onboarding',
  storage,
  whitelist: ['tempSignupData', 'youtubeDiscovery'],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer) as unknown as Reducer,
    onboarding: persistReducer(onboardingPersistConfig, onboardingReducer) as unknown as Reducer,
    ui: uiReducer,
    upload: uploadReducer,
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
  auth: AuthState;
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
  upload: UploadState;
}

export type AppDispatch = typeof store.dispatch;
