import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { authService } from '../api/services/auth.service';
import { setAuth } from '../store/slices/authSlice';
import { CURRENT_USER_QUERY_KEY } from '../queries/useCurrentUser';

export const useLogin = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      if (data.success && data.user) {
        dispatch(
          setAuth({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
          })
        );
        // Set the cache query data for current user to avoid an extra API call on redirect
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
        
        // Clear the adding account flag if it was set
        sessionStorage.removeItem('isAddingAccount');
      }
    },
  });
};
