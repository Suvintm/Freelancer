import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LottieComponent from 'lottie-react';
import securityLoaderAnimation from '../assets/lottie/security_loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setAuth, setIsAddingAccount } from '../store/slices/authSlice';
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
    // 🛡️ Support both URL fragment (#code=...) and query (?code=...)
    let code = searchParams.get('code');
    if (!code && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      code = hashParams.get('code');
    }
    
    // Clean URL fragment/query immediately so OTC never lingers in URL bar
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

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

        // Read intent and state from tempSignupData, with synchronous sessionStorage recovery
        let tempSignupData = (store.getState() as RootState).onboarding.tempSignupData;
        if (!tempSignupData?.categoryId) {
          try {
            const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
            if (rawBackup) {
              const parsed = JSON.parse(rawBackup);
              if (parsed?.categoryId) {
                dispatch(setTempSignupData(parsed));
                tempSignupData = parsed;
              }
            }
          } catch {
            // ignore
          }
        }

        const oauthIntent = sessionStorage.getItem('oauth_intent');
        const intent = tempSignupData?.intent ?? (oauthIntent === 'connect_youtube' ? 'register' : 'login');
        const categorySlug = tempSignupData?.categorySlug;
        const isCreator = categorySlug === 'creator' || categorySlug === 'yt_influencer' || oauthIntent === 'connect_youtube';

        // ── CHANNEL FETCH / YOUTUBE CONNECT FLOW ──────────────────────────────
        // Whenever the user is in YouTube onboarding OR explicitly connecting YouTube:
        if (oauthIntent === 'connect_youtube' || (intent === 'register' && isCreator)) {
          sessionStorage.removeItem('oauth_intent');
          const tokenToUse = response.data.googleAccessToken || response.data.socialProfile?.accessToken;
          
          if (tokenToUse) {
            try {
              sessionStorage.setItem('youtube_access_token', tokenToUse);
            } catch {
              // ignore
            }
          }

          const profileData = response.data.socialProfile || (response.data.user ? {
            name: response.data.user.name || response.data.user.fullName || '',
            email: response.data.user.email,
            picture: response.data.user.avatar || response.data.user.profile?.avatar || undefined,
            googleId: response.data.user.google_id || '',
          } : undefined);

          if (profileData?.email) {
            const profileUpdate = {
              socialProfile: {
                name: profileData.name || '',
                email: profileData.email,
                picture: profileData.picture || undefined,
                googleId: profileData.googleId || '',
              }
            };
            dispatch(setTempSignupData(profileUpdate));
            try {
              const raw = sessionStorage.getItem('suvix_temp_signup_data');
              const current = raw ? JSON.parse(raw) : {};
              sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...current, ...profileUpdate }));
            } catch {
              // ignore
            }
          }

          if (tokenToUse) {
            navigate('/youtube-connect', { state: { googleAccessToken: tokenToUse } });
          } else {
            navigate('/youtube-connect?error=no_token');
          }
          return; // Early return prevents unwanted redirect to /role-selection or /home!
        }

        if (response.data.isNewUser) {
          // ── NEW USER ────────────────────────────────────────────────────────

          if (intent === 'login') {
            // User clicked Google on the Login page but has no account.
            // Do NOT create an account — send them to signup with an error.
            navigate('/login?error=no_account');
            return;
          }

          // intent === 'register': proceed with onboarding
          const { socialProfile } = response.data;
          const currentData = (store.getState() as RootState).onboarding.tempSignupData;
          const isEmailFlow = currentData?.authMethod === 'email';

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

          const isEditor = categorySlug === 'editor' || categorySlug === 'video_editor';
          const isBrand = categorySlug === 'brand' || categorySlug === 'social_promoter';

          // Video Editor flow: select specializations & tools
          if (isEditor) {
            navigate('/editor-specialization');
            return;
          }

          // Brand / Sponsor flow: set up company profile & industry
          if (isBrand) {
            navigate('/brand-details');
            return;
          }

          // All other roles (Normal User): go straight to complete profile!
          const currentOnboardingStore = (store.getState() as RootState).onboarding;
          if (currentOnboardingStore.tempSignupData?.categoryId) {
            navigate('/complete-profile');
          } else {
            // No role data — send back to role selection to start fresh
            navigate('/role-selection');
          }
          return;
        }

        // ── EXISTING USER ──────────────────────────────────────────────────

        const { user, token, refreshToken } = response.data;

        // Set auth state first so the user is authenticated in Redux
        dispatch(setAuth({ user, token, refreshToken }));
        dispatch(setIsAddingAccount(false));
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);

        if (!user.isOnboarded) {
          navigate('/complete-profile');
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
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-48 h-48 flex items-center justify-center">
        <Lottie 
          animationData={securityLoaderAnimation} 
          loop={true} 
          style={{ width: '100%', height: '100%' }} 
        />
      </div>
      <div className="text-center space-y-2 -mt-4">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-display">Securing Session</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Finalizing your secure login...</p>
      </div>
    </div>
  );
}
