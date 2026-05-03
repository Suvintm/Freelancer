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
          const { user, token, refreshToken, googleAccessToken } = response.data;
          
          // Check if we are in onboarding flow
          const authStore = useAuthStore.getState();
          const isYouTubeOnboarding = authStore.tempSignupData?.categorySlug === 'yt_influencer';

          if (isYouTubeOnboarding && googleAccessToken) {
            // Store the token temporarily or pass it back
            navigate('/youtube-connect', { state: { googleAccessToken } });
            return;
          }

          setAuth(user, token, refreshToken);
          
          if (!user.isOnboarded) {
            navigate('/role-selection');
          } else {
            navigate('/home');
          }
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
