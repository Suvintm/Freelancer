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

  if (LOCAL_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${LOCAL_URL}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        console.log('🏠 [API] Local server reachable → using local dev server.');
        resolvedUrl = LOCAL_URL;
        return resolvedUrl;
      }
    } catch (_e) {
      // Local unreachable — fall through to production
    }
  }

  console.log('🌐 [API] Local unreachable → falling back to production.');
  resolvedUrl = PROD_URL;
  return PROD_URL;
}

// Kick off the URL resolution immediately at startup (non-blocking)
resolveApiUrl();

// ─── Axios Instance ────────────────────────────────────────────────────────────
// baseURL starts as PROD_URL as a safe default.
// The request interceptor swaps it to the resolved URL before every request.
// ──────────────────────────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: PROD_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
 * 🛡️ PRODUCTION HARDENED: No retries. Each request fires exactly once.
 * Handles global 401 auto-logout only.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('🗝️ [API] Session expired (401). Logging out...');
      const { useAuthStore } = require('../store/useAuthStore');
      (useAuthStore.getState() as any).logout();
      return Promise.reject(error);
    }

    if (__DEV__) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'URL';
      console.error(`❌ [API Error] ${method} ${url}:`, error.message);
    }

    return Promise.reject(error);
  }
);
