import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
// Import as type only to avoid require cycle if needed, 
// but we handle it dynamically in the interceptor below.
import { useAuthStore as AuthStoreType } from '../store/useAuthStore';

const API_URL = (process.env as any).EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// Configuration for retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds is safer for mobile roaming
  headers: {
    'Content-Type': 'application/json',
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
 * Handles global 401 logouts and implements a high-performance retry mechanism.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    // 1. Global 401 Handler: Auto-logout on unauthorized
    if (error.response?.status === 401) {
      console.warn('🗝️ [API] Session expired (401). Logging out...');
      const useAuthStore = require('../store/useAuthStore').useAuthStore;
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // 2. Automated Retry Logic: Handles Network glitches, Timeouts, and Server errors
    const shouldRetry = 
      !config._retry && 
      (error.code === 'ECONNABORTED' || // Timeout
       !error.response ||               // Network Error
       [408, 502, 503, 504].includes(error.response.status)); // Flaky Server

    if (shouldRetry) {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        console.log(`🔄 [API Retry] Attempt ${config._retryCount} for ${config.url}...`);
        
        // Wait for a short delay before retrying (Exponential backoff can be added later)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount));
        
        return api(config);
      }
    }

    if (__DEV__) {
      console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    }

    return Promise.reject(error);
  }
);
