import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { authService } from '../api/services/auth.service';
import { setAuth } from '../store/slices/authSlice';
import type { SignupPayload } from '../store/slices/authSlice';
import { CURRENT_USER_QUERY_KEY } from '../queries/useCurrentUser';

export const useSignup = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupPayload) => authService.signup(data),
    onSuccess: (data) => {
      if (data.success && data.user) {
        dispatch(
          setAuth({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
          })
        );
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
        sessionStorage.removeItem('isAddingAccount');
      }
    },
  });
};
