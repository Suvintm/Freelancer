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
      try {
        const data = await authService.fetchMe();
        if (data.success && data.user) {
          dispatch(updateUser(data.user));
          return data.user;
        }
        throw new Error(data.message || 'Failed to fetch user');
      } catch (error) {
        dispatch(clearAuth());
        throw error;
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAuthInit = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const isInitialized = useSelector(selectIsInitialized);

  const { data: user, isSuccess, isError, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!token) {
      dispatch(clearAuth()); // Sets isInitialized to true, isAuthenticated to false
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (isSuccess && user) {
      dispatch(setInitialized(true));
    } else if (isError) {
      dispatch(clearAuth());
    }
  }, [isSuccess, isError, user, dispatch]);

  return {
    isInitialized: isInitialized || !token,
    isLoading: isLoading && !!token,
    user,
  };
};
