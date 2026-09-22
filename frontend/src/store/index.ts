import { configureStore } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storageModule from 'redux-persist/lib/storage';

const storage = (storageModule as { default?: typeof storageModule }).default || storageModule;
import { authReducer } from './slices/authSlice';
import type { AuthState } from './slices/authSlice';
import { onboardingReducer } from './slices/onboardingSlice';
import type { OnboardingSliceState } from './slices/onboardingSlice';
import { uiReducer } from './slices/uiSlice';
import { uploadReducer } from './slices/uploadSlice';
import type { UploadState } from './slices/uploadSlice';
import { connectedAppsReducer } from './slices/connectedAppsSlice';
import type { ConnectedAppsState } from './slices/connectedAppsSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['sessions', 'activeUserId', 'isAddingAccount'],
};

const onboardingPersistConfig = {
  key: 'onboarding',
  storage,
  whitelist: ['tempSignupData', 'selectedRole', 'authMethod', 'youtubeDiscovery'],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer) as unknown as Reducer,
    onboarding: persistReducer(onboardingPersistConfig, onboardingReducer) as unknown as Reducer,
    ui: uiReducer,
    upload: uploadReducer,
    connectedApps: connectedAppsReducer,
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
  onboarding: OnboardingSliceState;
  ui: {
    sidebarOpen: boolean;
  };
  upload: UploadState;
  connectedApps: ConnectedAppsState;
}

export type AppDispatch = typeof store.dispatch;
