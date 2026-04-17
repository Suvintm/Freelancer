import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

const LOCAL_URL = (process.env as any).EXPO_PUBLIC_LOCAL_API_URL as string | undefined;
const PROD_URL  = (process.env as any).EXPO_PUBLIC_PROD_API_URL  || 'https://api.suvix.in/api';

// ─── Smart API URL Resolver ────────────────────────────────────────────────────
// Pings the local dev server first (3s timeout).
// Falls back to production if unreachable.
// Result is cached so we only ping ONCE per app session.
// ──────────────────────────────────────────────────────────────────────────────
let resolvedUrl: string | null = null;

const API_BASE_URL = (process.env as any).EXPO_PUBLIC_API_URL || 'https://api.suvix.in/api';

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function getResolvedBaseUrl(): Promise<string> {
  // Strip trailing /api for Socket.io
  return API_BASE_URL.replace(/\/api$/, '') || API_BASE_URL;
}

// ─── Axios Instance ────────────────────────────────────────────────────────────
import * as Device from 'expo-device';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `${Device.deviceName || 'Unknown Device'} - SuviX Mobile (${Device.osName} ${Device.osVersion})`,
  },
});

/**
 * REQUEST INTERCEPTOR
 * 1. Attaches the Auth Token from the active account in the vault.
 * 2. Attaches the permanent Device ID for session binding.
 */
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // @ts-ignore
  const { useAuthStore } = require('../store/useAuthStore');
  const token = (useAuthStore.getState() as any).token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach permanent device fingerprint
  const { getDeviceIdSync } = require('../hooks/useDeviceId');
  const deviceId = getDeviceIdSync();
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }

  // Attach human-readable device name for session management
  config.headers['X-Device-Name'] = Device.deviceName || 'Unknown Device';

  if (__DEV__) {
    console.log(`📡 [API] ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);
  }

  return config;
});

/**
 * RESPONSE INTERCEPTOR
 * 🛡️ PRODUCTION HARDENED: Seamless Session Recovery
 * Handles 401s by attempting an automatic token refresh.
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRerfreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;
    const originalRequest = config as any;

    if (response?.status === 401 && !originalRequest._retry) {
      // 🛡️ INFINITE REFRESH LOOP GUARD: Never retry if this IS the refresh endpoint
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        isRefreshing = false;
        refreshSubscribers = [];
        const { useAuthStore } = require('../store/useAuthStore');
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // @ts-ignore
        const { useAuthStore } = require('../store/useAuthStore');
        const { refreshToken, isLoadingUser } = useAuthStore.getState();

        // 🛡️ IDENTITY SWITCH GUARD: If the app is currently loading a new user (switching),
        // do NOT attempt a silent refresh of the OLD session. Let the switch finish.
        if (isLoadingUser) {
          isRefreshing = false;
          console.warn('⚠️ [API] Session recovery suppressed during active switch.');
          return Promise.reject(error);
        }

        if (!refreshToken) throw new Error('No refresh token available');

        console.log('🔄 [API] Attempting seamless session recovery...');
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { 
          refreshToken 
        });

        if (res.data.success) {
          const { token, refreshToken: newRefreshToken } = res.data;
          
          // Update the store
          await useAuthStore.getState().setTokens(token, newRefreshToken);
          
          console.log('✅ [API] Session refreshed successfully.');
          isRefreshing = false;
          onRerfreshed(token);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ [API] Session recovery failed:', refreshError);
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Final logout
        const { useAuthStore } = require('../store/useAuthStore');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }


    const isBanned = response?.status === 403 && (response.data as any)?.isBanned;
    if (!isBanned) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'URL';
      const status = response?.status || 'NETWORK_ERROR';
      console.error(`❌ [API Error] ${method} ${url} (Status: ${status}):`, error.message);
      if (response?.data) {
        console.error('📦 [API Response Data]:', JSON.stringify(response.data));
      }
    }


    // 🚩 [SECURITY] Absolute Ban Redirect
    // If we get a 403 with isBanned flag, we MUST redirect to the banned page instantly.
    if (response?.status === 403 && (response.data as any)?.isBanned) {
        console.warn('🚫 [SECURITY] User is banned. Redirecting to restricted screen.');
        router.replace('/banned');
    }

    return Promise.reject(error);
  }
);

