import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { RootState } from '../store';
import { selectToken, selectRefreshToken } from '../store/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60s for heavy onboarding operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Use a dynamic import to avoid circular dependencies
  const { store } = await import('../store');
  const token = selectToken(store.getState() as RootState);

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor for handling 401s and token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;
    const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (response?.status === 401 && !originalRequest._retry) {
      // 🛡️ SKIP REFRESH for auth endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh-token')
      ) {
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
        const { store } = await import('../store');
        const refreshToken = selectRefreshToken(store.getState() as RootState);

        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { 
          refreshToken 
        });

        if (res.data.success) {
          const newToken = res.data.token;
          const newRefreshToken = res.data.refreshToken;
          const refreshedUser = res.data.user;

          const { setTokens } = await import('../store/slices/authSlice');
          store.dispatch(setTokens({ token: newToken, refreshToken: newRefreshToken, user: refreshedUser }));
          
          isRefreshing = false;
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        
        const { store } = await import('../store');
        const { clearAuth, selectAllSessions } = await import('../store/slices/authSlice');
        const { clearTempSignupData } = await import('../store/slices/onboardingSlice');
        
        // Clear active session
        store.dispatch(clearAuth());
        store.dispatch(clearTempSignupData());
        
        // If it was the last session, purge entirely
        const remainingSessions = selectAllSessions(store.getState() as RootState);
        if (remainingSessions.length === 0) {
          const { persistor } = await import('../store');
          await persistor.purge();
          window.dispatchEvent(new CustomEvent('suvix:logout'));
          window.location.href = '/'; 
        } else {
          // If there are other sessions, we just gracefully switch to another one 
          // without full logout redirect
          window.location.reload(); 
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
