import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const LOCAL_URL = (process.env as any).EXPO_PUBLIC_LOCAL_API_URL as string | undefined;
const PROD_URL  = (process.env as any).EXPO_PUBLIC_PROD_API_URL  || 'https://api.suvix.in/api';

// ─── Smart API URL Resolver ────────────────────────────────────────────────────
// Pings the local dev server first (3s timeout).
// Falls back to production if unreachable.
// Result is cached so we only ping ONCE per app session.
// ──────────────────────────────────────────────────────────────────────────────
let resolvedUrl: string | null = null;

async function resolveApiUrl(): Promise<string> {
  if (resolvedUrl) return resolvedUrl;

  const MAX_RETRIES = 2; // Total 3 attempts
  let attempts = 0;

  while (attempts <= MAX_RETRIES) {
    if (LOCAL_URL) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000); // Shorter timeout for retries
        const res = await fetch(`${LOCAL_URL}/health`, { signal: controller.signal });
        clearTimeout(timer);
        
        if (res.ok) {
          console.log('🏠 [API] Local server reachable → using local dev server.');
          resolvedUrl = LOCAL_URL;
          return resolvedUrl;
        }
      } catch (err) {
        // Continue to retry or fallback
      }
    }
    
    attempts++;
    if (attempts <= MAX_RETRIES && LOCAL_URL) {
      // Delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`📡 [API] Local unreachable, retrying... (${attempts}/${MAX_RETRIES})`);
    }
  }

  console.log('🌐 [API] Local unreachable after retries → falling back to production.');
  resolvedUrl = PROD_URL;
  return PROD_URL;
}

// 🏠 [PRODUCTION-GRADE] Export current resolved URL for global use (e.g. WebSockets)
export async function getResolvedBaseUrl(): Promise<string> {
  const url = await resolveApiUrl();
  // Ensure we strip trailing /api for Socket.io usage
  return url.replace(/\/api$/, '') || url;
}

export function getApiBaseUrl(): string {
  // If we haven't resolved yet, use PROD as a safe fallback
  return resolvedUrl || PROD_URL;
}

// Kick off the URL resolution immediately at startup (non-blocking)
resolveApiUrl();

// ─── Axios Instance ────────────────────────────────────────────────────────────
// baseURL starts as PROD_URL as a safe default.
// The request interceptor swaps it to the resolved URL before every request.
// ──────────────────────────────────────────────────────────────────────────────
import * as Device from 'expo-device';

export const api: AxiosInstance = axios.create({
  baseURL: PROD_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `${Device.deviceName || 'Unknown Device'} - SuviX Mobile (${Device.osName} ${Device.osVersion})`,
  },
});

/**
 * REQUEST INTERCEPTOR
 * 1. Resolves the correct API URL (local or production) before each request.
 * 2. Attaches the Auth Token from Zustand store.
 */
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Set the resolved base URL dynamically
  config.baseURL = await resolveApiUrl();

  // @ts-ignore - Dynamic require to break circular dependency
  const { useAuthStore } = require('../store/useAuthStore');
  const token = (useAuthStore.getState() as any).token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

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
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) throw new Error('No refresh token available');

        console.log('🔄 [API] Attempting seamless session recovery...');
        const res = await axios.post(`${await resolveApiUrl()}/auth/refresh-token`, { 
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

    if (__DEV__) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'URL';
      console.error(`❌ [API Error] ${method} ${url}:`, error.message);
    }

    return Promise.reject(error);
  }
);
