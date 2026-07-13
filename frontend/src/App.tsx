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
import CommunicationHub from './pages/CommunicationHub';
import Profile from './pages/Profile';
import CreatorProfilePage from './pages/CreatorProfilePage';
import ChannelProfilePage from './pages/ChannelProfilePage';
import Settings from './pages/Settings';
import Nearby from './pages/Nearby';
import PlaceholderPage from './pages/PlaceholderPage';
import Maintenance from './pages/Maintenance';
import OAuthSuccess from './pages/OAuthSuccess';
import CompleteProfile from './pages/CompleteProfile';
import Preferences from './pages/onboarding/Preferences';
import Notifications from './pages/Notifications';
import TempUploadPortal from './pages/TempUploadPortal';
import CreateContent from './pages/CreateContent';
import YTDashboard from './pages/YTDashboard';
import Subscription from './pages/Subscription';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import CreatePoll from './pages/CreatePoll';
import CreatorTools from './pages/CreatorTools';
import { AppLayout } from './components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthInit } from './queries/useCurrentUser';
import { AuthGuard, PublicRoute, OnboardingGuard, RoleGuard } from './components/auth/AuthGuard';
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
        let baseUrl = apiUrl;
        if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
          try {
            baseUrl = new URL(apiUrl).origin;
          } catch {
            // fallback if URL parsing fails
          }
        } else {
          if (baseUrl.endsWith('/api/v1')) {
            baseUrl = baseUrl.slice(0, -7);
          } else if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4);
          }
        }
        
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

        {/* Preferences page — immediately after profile completion */}
        <Route
          path="/onboarding/preferences"
          element={
            <AuthGuard>
              <Preferences />
            </AuthGuard>
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
        
        {/* Public Informational / Legal Pages */}
        <Route path="/about" element={<AppLayout><About /></AppLayout>} />
        <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />
        <Route path="/terms" element={<AppLayout><TermsAndConditions /></AppLayout>} />
        
        {/* Authenticated Protected Routes */}
        <Route 
          path="/creator-tools" 
          element={
            <AuthGuard>
              <AppLayout>
                <CreatorTools />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/polls/create" 
          element={
            <AuthGuard>
              <AppLayout>
                <CreatePoll />
              </AppLayout>
            </AuthGuard>
          } 
        />
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
          path="/stories/:storyId" 
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
          path="/communication-hub" 
          element={
            <AuthGuard>
              <AppLayout>
                <CommunicationHub />
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
          path="/creator/:userId" 
          element={
            <AuthGuard>
              <AppLayout>
                <CreatorProfilePage />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/channel/:channelId" 
          element={
            <AuthGuard>
              <AppLayout>
                <ChannelProfilePage />
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
          path="/create" 
          element={
            <AuthGuard>
              <AppLayout>
                <CreateContent />
              </AppLayout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/upload-portal" 
          element={
            <AuthGuard>
              <RoleGuard allowedCategories={['yt_influencer', 'video_editor', 'singer', 'dancer', 'videographer', 'photographer', 'actor', 'musician', 'fitness_expert', 'rent_service']}>
                <AppLayout>
                  <TempUploadPortal />
                </AppLayout>
              </RoleGuard>
            </AuthGuard>
          } 
        />
        <Route 
          path="/youtube-dashboard" 
          element={
            <AuthGuard>
              <RoleGuard allowedCategories={['yt_influencer']}>
                <AppLayout>
                  <YTDashboard />
                </AppLayout>
              </RoleGuard>
            </AuthGuard>
          } 
        />
        <Route 
          path="/youtube-dashboard/:channelId" 
          element={
            <AuthGuard>
              <RoleGuard allowedCategories={['yt_influencer']}>
                <AppLayout>
                  <YTDashboard />
                </AppLayout>
              </RoleGuard>
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
