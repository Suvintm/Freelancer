import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setAuth } from '../store/slices/authSlice';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import { store } from '../store';
import type { RootState } from '../store';
import { api } from '../api/client';
import { CURRENT_USER_QUERY_KEY } from '../queries/useCurrentUser';

/**
 * OAuthSuccess — The OAuth callback landing page.
 *
 * PRODUCTION FIX: Routing is now entirely driven by `tempSignupData.intent`
 * which is set BEFORE the OAuth redirect, NOT by stale localStorage data.
 *
 * Intent values and their behavior:
 *  - 'login'    → Existing user: go home. New user: error (no account found).
 *  - 'register' → New user: go through onboarding. Existing user: just log in.
 *  - undefined  → Fallback: treat as login attempt.
 */
export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const exchangeStarted = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      navigate('/login?error=no_code');
      return;
    }

    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const exchangeCode = async () => {
      try {
        const response = await api.post('/auth/exchange-code', { code });
        
        if (!response.data.success) {
          navigate('/login?error=exchange_failed');
          return;
        }

        // SECURITY RESTRICTION: Block unauthorized emails during DEV phase
        const emailToCheck = response.data.socialProfile?.email || response.data.user?.email;
        if (emailToCheck) {
          const allowedEmails = ['suvintm19@gmail.com', 'suvintm19@gamil.com', 'suvintm1515@gmail.com', 'uber@company.com'];
          if (!allowedEmails.includes(emailToCheck.toLowerCase().trim())) {
            navigate('/login?error=server_busy');
            return;
          }
        }

        // Read intent from tempSignupData (set before OAuth redirect)
        // This is the ONLY source of truth — we never read stale role data here.
        const onboardingStore = (store.getState() as RootState).onboarding;
        const intent = onboardingStore.tempSignupData?.intent ?? 'login';
        const categorySlug = onboardingStore.tempSignupData?.categorySlug;

        if (response.data.isNewUser) {
          // ── NEW USER ────────────────────────────────────────────────────────

          if (intent === 'login') {
            // User clicked Google on the Login page but has no account.
            // Do NOT create an account — send them to signup with an error.
            navigate('/login?error=no_account');
            return;
          }

          // intent === 'register': proceed with onboarding
          const { socialProfile, googleAccessToken } = response.data;
          const tempSignupData = (store.getState() as RootState).onboarding.tempSignupData;
          const isEmailFlow = tempSignupData?.authMethod === 'email';

          // Merge social profile into temp data (preserving role/intent already set)
          dispatch(setTempSignupData({ 
            isSocialSignup: !isEmailFlow,
            ...(!isEmailFlow ? {
              socialProfile: {
                name: socialProfile.name,
                email: socialProfile.email,
                picture: socialProfile.picture,
                googleId: socialProfile.googleId,
              }
            } : {})
          }));

          // YouTube flow: user selected yt_influencer role AND we have a Google token
          if (categorySlug === 'yt_influencer' && googleAccessToken) {
            navigate('/youtube-connect', { state: { googleAccessToken } });
            return;
          }

          // All other roles: if they need subcategory selection, go there first
          const currentOnboardingStore = (store.getState() as RootState).onboarding;
          if (currentOnboardingStore.tempSignupData?.categoryId) {
            // Check if this role requires subcategory
            const needsSubcategory = categorySlug && 
              !['direct_client', 'yt_influencer'].includes(categorySlug);
            
            if (needsSubcategory) {
              navigate('/subcategory-selection');
            } else {
              navigate('/complete-profile');
            }
          } else {
            // No role data — send back to role selection to start fresh
            navigate('/role-selection');
          }
          return;
        }

        // ── EXISTING USER ──────────────────────────────────────────────────

        const { user, token, refreshToken, googleAccessToken } = response.data;

        // Set auth state first so the user is authenticated in Redux
        dispatch(setAuth({ user, token, refreshToken }));
        sessionStorage.removeItem('isAddingAccount');
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);

        const oauthIntent = sessionStorage.getItem('oauth_intent');
        if (oauthIntent === 'connect_youtube' && googleAccessToken) {
          sessionStorage.removeItem('oauth_intent');
          navigate('/youtube-connect', { state: { googleAccessToken } });
          return;
        }

        if (intent === 'register' && categorySlug === 'yt_influencer' && googleAccessToken) {
          // Edge case: existing user who is trying to re-link YouTube during onboarding
          // Pass token to YouTubeConnect to show their claimed channels
          navigate('/youtube-connect', { state: { googleAccessToken } });
          return;
        }

        navigate('/home');

      } catch (error) {
        console.error('OAuth exchange error:', error);
        navigate('/login?error=server_error');
      }
    };

    exchangeCode();
  }, [searchParams, navigate, dispatch, queryClient]);

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-display">Securing Session</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Finalizing your secure login...</p>
      </div>
    </div>
  );
}
