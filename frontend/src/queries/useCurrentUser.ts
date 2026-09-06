import { useQuery } from '@tanstack/react-query';
import { authService } from '../api/services/auth.service';
import { useDispatch, useSelector } from 'react-redux';
import { selectToken, selectIsInitialized, setInitialized, clearAuth, updateUser } from '../store/slices/authSlice';
import { useEffect } from 'react';

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'];

export const useCurrentUser = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const data = await authService.fetchMe();
      if (data.success && data.user) {
        dispatch(updateUser(data.user));
        return data.user;
      }
      throw new Error(data.message || 'Failed to fetch user');
    },
    enabled: !!token,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAuthInit = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const isInitialized = useSelector(selectIsInitialized);

  const { data: user, isSuccess, isLoading, isError, error } = useCurrentUser();

  // Helper to detect if failure is caused by an unreachable API gateway
  const isNetworkOrGatewayError = (err: any) => {
    if (!err) return false;
    const isNetworkErr =
      err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.message?.includes('Network Error') ||
      err.message?.includes('Failed to fetch') ||
      !err.response;
    const isServerError = err.response?.status >= 500;
    return isNetworkErr || isServerError;
  };

  const isGatewayDown = isError && isNetworkOrGatewayError(error);

  useEffect(() => {
    if (!token) {
      dispatch(clearAuth()); // Sets isInitialized to true, isAuthenticated to false
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (isSuccess && user) {
      dispatch(setInitialized(true));
    }
  }, [isSuccess, user, dispatch]);

  useEffect(() => {
    if (isError) {
      // 🛡️ CRITICAL: If the backend container is offline, never trap the user in an infinite loading spinner!
      // Mark initialization complete so the UI can render the Gateway Offline screen gracefully.
      dispatch(setInitialized(true));
    }
  }, [isError, dispatch]);

  return {
    isInitialized: isInitialized || !token || isError,
    isLoading: isLoading && !!token && !isError,
    isError,
    isGatewayDown,
    error,
    user,
  };
};

