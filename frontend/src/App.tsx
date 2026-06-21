import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import SubcategorySelection from './pages/SubcategorySelection';
import YouTubeConnect from './pages/YouTubeConnect';
import YouTubeNiche from './pages/YouTubeNiche';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Nearby from './pages/Nearby';
import PlaceholderPage from './pages/PlaceholderPage';
import Maintenance from './pages/Maintenance';
import OAuthSuccess from './pages/OAuthSuccess';
import CompleteProfile from './pages/CompleteProfile';
import Notifications from './pages/Notifications';
import TempUploadPortal from './pages/TempUploadPortal';
import YTDashboard from './pages/YTDashboard';
import Subscription from './pages/Subscription';
import { AppLayout } from './components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthInit } from './queries/useCurrentUser';
import { AuthGuard, PublicRoute, OnboardingGuard } from './components/auth/AuthGuard';
import LottieComponent from 'lottie-react';
import loaderAnimation from './assets/lottie/loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;


function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInitialized } = useAuthInit();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;

    // 🛰️ SERVER HEALTH CHECK (Only after auth is initialized)
    const checkServer = async () => {
      if (location.pathname === '/maintenance') {
        setIsCheckingServer(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        
        console.log(`🌐 [HEALTH] Checking connectivity: ${baseUrl}/api/health`);
        
        const response = await fetch(`${baseUrl}/api/health`, { 
          signal: AbortSignal.timeout(10000) 
        });
        
        if (response.status === 503) {
          navigate('/maintenance', { replace: true });
        }
      } catch (error) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
        console.error(`❌ [HEALTH] Nexus unreachable at ${apiUrl}:`, error);
        
        if (!apiUrl.includes('localhost')) {
          navigate('/maintenance', { replace: true });
        }
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServer();
  }, [isInitialized, navigate, location.pathname]);

  if ((!isInitialized || isCheckingServer) && location.pathname !== '/maintenance') {
    return (
      <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-32 h-32">
          <Lottie 
            animationData={loaderAnimation} 
            loop={true} 
            style={{ width: '100%', height: '100%' }} 
          />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black font-sans antialiased text-white">
      <Routes>
        <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
        <Route path="/maintenance" element={<Maintenance />} />
        
        {/* Auth pages — publicly accessible */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        
        {/* Onboarding Routes — protected by OnboardingGuard for step sequencing */}
        {/* role-selection is always accessible (it clears state on mount) */}
        <Route path="/role-selection" element={<PublicRoute><RoleSelection /></PublicRoute>} />

        {/* subcategory-selection requires role to be selected first */}
        <Route
          path="/subcategory-selection"
          element={
            <OnboardingGuard requiredStep="role">
              <SubcategorySelection />
            </OnboardingGuard>
          }
        />

        {/* youtube-connect requires role = yt_influencer to be selected */}
        <Route
          path="/youtube-connect"
          element={
            <OnboardingGuard requiredStep="role">
              <YouTubeConnect />
            </OnboardingGuard>
          }
        />

        {/* youtube-niche: niche selection after channel is fetched */}
        <Route
          path="/youtube-niche"
          element={
            <OnboardingGuard requiredStep="youtube">
              <YouTubeNiche />
            </OnboardingGuard>
          }
        />

        {/* complete-profile is for Google OAuth users only — requires youtube or subcategory step */}
        <Route
          path="/complete-profile"
          element={
            <OnboardingGuard requiredStep="role">
              <CompleteProfile />
            </OnboardingGuard>
          }
        />

        {/* signup is for email users — requires role to be selected */}
        <Route
          path="/signup"
          element={
            <OnboardingGuard requiredStep="role">
              <Signup />
            </OnboardingGuard>
          }
        />

        <Route path="/oauth-success" element={<OAuthSuccess />} />
        
        {/* Authenticated Protected Routes */}
        <Route 
          path="/home" 
          element={
            <AuthGuard>
              <AppLayout>
                <Home />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/explore" 
          element={
            <AuthGuard>
              <AppLayout>
                <Explore />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/nearby" 
          element={
            <AuthGuard>
              <AppLayout>
                <Nearby />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/reels" 
          element={
            <AuthGuard>
              <AppLayout>
                <PlaceholderPage title="Reels" />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <AuthGuard>
              <AppLayout>
                <PlaceholderPage title="Jobs" />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/chats" 
          element={
            <AuthGuard>
              <AppLayout>
                <PlaceholderPage title="Chats" />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <AuthGuard>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <AuthGuard>
              <AppLayout>
                <Profile />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/subscription" 
          element={
            <AuthGuard>
              <AppLayout>
                <Subscription />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <AuthGuard>
              <AppLayout>
                <Settings />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/upload-portal" 
          element={
            <AuthGuard>
              <AppLayout>
                <TempUploadPortal />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/youtube-dashboard" 
          element={
            <AuthGuard>
              <AppLayout>
                <YTDashboard />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/youtube-dashboard/:channelId" 
          element={
            <AuthGuard>
              <AppLayout>
                <YTDashboard />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/channel/:channelId" 
          element={
            <AuthGuard>
              <AppLayout>
                <YTDashboard />
              </AppLayout>
            </AuthGuard>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
