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

let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleProactiveTokenRefresh = (delayMs = 13 * 60 * 1000) => {
  if (proactiveRefreshTimer) clearTimeout(proactiveRefreshTimer);
  
  proactiveRefreshTimer = setTimeout(async () => {
    try {
      const { store } = await import('../store');
      const refreshToken = selectRefreshToken(store.getState() as RootState);
      if (!refreshToken) return;

      const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
      if (res.data.success) {
        const { setTokens } = await import('../store/slices/authSlice');
        store.dispatch(setTokens({
          token: res.data.token,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        }));
        scheduleProactiveTokenRefresh(13 * 60 * 1000);
      }
    } catch {
      // Proactive refresh failed silently; reactive 401 interceptor will catch when needed
    }
  }, delayMs);
};

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('suvix:gateway-up'));
    }
    return response;
  },
  async (error: AxiosError) => {
    // 🛰️ Detect API Gateway Offline / Network Error / Bad Gateway
    // Exclude domain microservice routes (subscriptions, invoices, payments, analytics) from taking down the whole app
    const reqUrl = (error.config?.url || '').toLowerCase();
    const isIsolatedMicroservice =
      reqUrl.includes('/subscriptions') ||
      reqUrl.includes('/invoices') ||
      reqUrl.includes('/payments') ||
      reqUrl.includes('/analytics') ||
      reqUrl.includes('/notifications') ||
      Boolean((error.config as unknown as { skipGatewayOfflineCheck?: boolean })?.skipGatewayOfflineCheck);

    // Also, if the user is on a public route or viewing subscription, never fire global gateway-down
    const isPublicPath =
      typeof window !== 'undefined' && (
        window.location.pathname === '/' ||
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup' ||
        window.location.pathname === '/verify-email' ||
        window.location.pathname === '/about' ||
        window.location.pathname === '/privacy' ||
        window.location.pathname === '/terms' ||
        window.location.pathname === '/subscription'
      );

    const isGatewayError =
      !isIsolatedMicroservice &&
      !isPublicPath && (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('Failed to fetch') ||
        (error.response && error.response.status >= 502 && error.response.status <= 504)
      );

    if (isGatewayError && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('suvix:gateway-down', {
          detail: {
            code: error.code || 'ERR_CONNECTION_REFUSED',
            status: error.response?.status || 503,
            message: error.message || 'API Gateway Unreachable',
            url: error.config?.url,
            timestamp: Date.now(),
          },
        })
      );
    }

    const { config, response } = error;
    const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean };

    const responseData = response?.data as { requiresVerification?: boolean; email?: string } | undefined;

    if (response?.status === 403 && responseData?.requiresVerification) {
      try {
        const { store } = await import('../store');
        const { clearAuth } = await import('../store/slices/authSlice');
        store.dispatch(clearAuth());
      } catch {
        // Fallback if import fails
      }
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(responseData.email || '')}`;
      }, 50);
      return Promise.reject(error);
    }

    if (response?.status === 401 && !originalRequest._retry) {
      // 🛡️ SKIP REFRESH only for non-authenticated auth endpoints
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
          
          // Reschedule next proactive refresh (13 mins from now)
          scheduleProactiveTokenRefresh(13 * 60 * 1000);
          
          isRefreshing = false;
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        isRefreshing = false;
        refreshSubscribers = [];
        
        // 🛡️ CRITICAL: Only clear session if server explicitly tells us the refresh token is revoked/invalid (401/403/400).
        // If the server is offline or experiencing temporary network errors, do NOT log the user out!
        const isExplicitAuthFailure = 
          refreshError?.response?.status === 401 ||
          refreshError?.response?.status === 403 ||
          refreshError?.response?.status === 400;

        if (!isExplicitAuthFailure) {
          console.warn('⚠️ [Auth] Background token refresh skipped due to temporary network/server error. Session preserved.');
          return Promise.reject(refreshError);
        }

        const { store } = await import('../store');
        const { clearAuth, selectAllSessions } = await import('../store/slices/authSlice');
        
        // Clear stale auth session
        store.dispatch(clearAuth());
        
        // 🛡️ CRITICAL: Never clear onboarding data or force-redirect if user is currently onboarding!
        const isOnboardingOrAuthRoute = 
          window.location.pathname.startsWith('/role-selection') ||
          window.location.pathname.startsWith('/connect-socials') ||
          window.location.pathname.startsWith('/complete-profile') ||
          window.location.pathname.startsWith('/onboarding') ||
          window.location.pathname.startsWith('/youtube-') ||
          window.location.pathname.startsWith('/signup') ||
          window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/oauth') ||
          window.location.pathname.startsWith('/editor-') ||
          window.location.pathname.startsWith('/brand-');

        if (!isOnboardingOrAuthRoute) {
          const { clearTempSignupData } = await import('../store/slices/onboardingSlice');
          store.dispatch(clearTempSignupData());
          
          const remainingSessions = selectAllSessions(store.getState() as RootState);
          if (remainingSessions.length === 0) {
            const { persistor } = await import('../store');
            await persistor.purge();
            window.dispatchEvent(new CustomEvent('suvix:logout'));
            window.location.href = '/'; 
          } else {
            window.location.reload(); 
          }
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
