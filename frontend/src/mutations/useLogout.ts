import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../api/services/auth.service';
import { clearAuth, selectRefreshToken, selectAllSessions } from '../store/slices/authSlice';
import { clearTempSignupData } from '../store/slices/onboardingSlice';
import { persistor } from '../store';
import type { RootState } from '../store';
import { store } from '../store'; // To directly read state inside async function

export const useLogout = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const refreshToken = useSelector(selectRefreshToken);

  return useMutation({
    mutationFn: async () => {
      // 1. Invalidate on backend first
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (e) {
          console.warn('[Logout] Server-side session kill failed:', e);
        }
      }

      // 2. Clear active session locally
      dispatch(clearAuth());
      dispatch(clearTempSignupData());

      // 3. Check remaining sessions
      const remainingSessions = selectAllSessions(store.getState() as RootState);

      if (remainingSessions.length === 0) {
        // 4a. If this was the last session, wipe everything
        await persistor.purge();
        queryClient.clear();
        return { isLastSession: true };
      } else {
        // 4b. Just clear the query cache to refresh for the next user
        queryClient.clear();
        return { isLastSession: false };
      }
    },
    onSettled: (data) => {
      if (data?.isLastSession) {
        // Dispatch custom event for listeners and hard redirect
        window.dispatchEvent(new CustomEvent('suvix:logout'));
        window.location.href = '/';
      } else {
        // Soft reload to apply the active session contexts
        window.location.reload();
      }
    },
  });
};
export default useLogout;
