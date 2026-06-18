import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../api/services/auth.service';
import { clearAuth, selectRefreshToken } from '../store/slices/authSlice';
import { clearTempSignupData } from '../store/slices/onboardingSlice';
import { persistor } from '../store';

export const useLogout = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const refreshToken = useSelector(selectRefreshToken);

  return useMutation({
    mutationFn: async () => {
      // 1. Immediate local state wipe (optimistic logout)
      dispatch(clearAuth());
      dispatch(clearTempSignupData());

      // 2. Clear Redux persisted states
      await persistor.purge();

      // 3. Clear TanStack Query Cache
      queryClient.clear();

      // 4. Call api to invalidate on backend
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (e) {
          console.warn('[Logout] Server-side session kill failed:', e);
        }
      }
    },
    onSettled: () => {
      // 5. Dispatch custom event for listeners
      window.dispatchEvent(new CustomEvent('suvix:logout'));
      
      // 6. Hard redirect to refresh React state
      window.location.href = '/';
    },
  });
};
export default useLogout;
