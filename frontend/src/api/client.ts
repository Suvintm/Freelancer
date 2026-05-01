import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Use a dynamic import to avoid circular dependencies if useAuthStore is used later
  const { useAuthStore } = await import('../store/useAuthStore');
  const token = useAuthStore.getState().token;

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
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;
    const originalRequest = config as any;

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
        const { useAuthStore } = await import('../store/useAuthStore');
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { 
          refreshToken 
        });

        if (res.data.success) {
          const newToken = res.data.token;
          const newRefreshToken = res.data.refreshToken;
          const refreshedUser = res.data.user;

          await useAuthStore.getState().setTokens(newToken, newRefreshToken, refreshedUser);
          
          isRefreshing = false;
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        const { useAuthStore } = await import('../store/useAuthStore');
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
