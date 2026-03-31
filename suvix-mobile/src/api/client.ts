import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
// Import as type only to avoid require cycle if needed, 
// but we handle it dynamically in the interceptor below.
import { useAuthStore as AuthStoreType } from '../store/useAuthStore';

const API_URL = (process.env as any).EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// 🛡️ PRODUCTION MODE: No retries. Fail fast to protect server bandwidth.

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // 🌐 BROWSER SPOOFING: Identifying as a standard browser to bypass Cloudflare bot filters
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the Auth Token from the Zustand store (much faster than SecureStore).
 */
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Break circular dependency by using dynamic required access
  // @ts-ignore - Dynamic require is safe here for React Native/Bundler cycles
  const useAuthStore = require('../store/useAuthStore').useAuthStore;
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (__DEV__) {
    console.log(`📡 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
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
    // Global 401 Handler: Auto-logout on session expiry
    if (error.response?.status === 401) {
      console.warn('🗝️ [API] Session expired (401). Logging out...');
      const useAuthStore = require('../store/useAuthStore').useAuthStore;
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (__DEV__) {
      console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    }

    return Promise.reject(error);
  }
);
