import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../api/client';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
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
        
        if (response.data.success) {
          if (response.data.isNewUser) {
            const { socialProfile } = response.data;
            const { setTempSignupData, tempSignupData } = useAuthStore.getState();
            
            // Buffer social profile + mark as social signup
            setTempSignupData({ 
              ...tempSignupData,
              isSocialSignup: true,
              socialProfile: {
                name: socialProfile.name,
                email: socialProfile.email,
                picture: socialProfile.picture,
                googleId: socialProfile.googleId,
              }
            });

            // ROLE-FIRST PATTERN (matches intended UX):
            // Step 1 — First Google auth (no role selected yet) → /role-selection
            //   User picks role → subcategory/YT-connect → lands on /signup form
            //   On /signup form, user clicks "Continue with Google" again
            // Step 2 — Second Google auth (role now in tempSignupData) → /complete-profile
            //   Only asks for username + phone (name/email already known from Google)
            const currentStore = useAuthStore.getState();
            if (currentStore.tempSignupData?.categoryId) {
              navigate('/complete-profile');
            } else {
              navigate('/role-selection');
            }
            return;
          }

          const { user, token, refreshToken, googleAccessToken } = response.data;
          
          setAuth(user, token, refreshToken);
          
          // 1. Detect if we were in the middle of YouTube discovery (Specific onboarding context)
          const authStore = useAuthStore.getState();
          const isYouTubeFlowExplicit = authStore.tempSignupData?.categoryId && 
                                       (authStore.tempSignupData?.categorySlug === 'yt_influencer' || 
                                        authStore.tempSignupData?.roleName?.toString().toLowerCase().includes('youtube'));

          if (isYouTubeFlowExplicit && googleAccessToken) {
            navigate('/youtube-connect', { state: { googleAccessToken } });
            return;
          }

          // 2. Existing users always go home
          navigate('/home');
          return;
        } else {
          navigate('/login?error=exchange_failed');
        }
      } catch (error) {
        console.error('OAuth exchange error:', error);
        navigate('/login?error=server_error');
      }
    };

    exchangeCode();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-display">Securing Session</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Finalizing your secure login...</p>
      </div>
    </div>
  );
}
