import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ConnectSocials from './pages/ConnectSocials';
import OAuthSuccess from './pages/OAuthSuccess';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthInit } from './queries/useCurrentUser';
import { AuthGuard, PublicRoute, OnboardingGuard, RoleGuard } from './components/auth/AuthGuard';
import LottieComponent from 'lottie-react';
import loaderAnimation from './assets/lottie/loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

// ── Lazy-loaded Route Components for Code-Splitting ─────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const EditorSpecialization = lazy(() => import('./pages/EditorSpecialization'));
const BrandDetails = lazy(() => import('./pages/BrandDetails'));
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const CommunicationHub = lazy(() => import('./pages/CommunicationHub'));
const Profile = lazy(() => import('./pages/Profile'));
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage'));
const ChannelProfilePage = lazy(() => import('./pages/ChannelProfilePage'));
const Settings = lazy(() => import('./pages/Settings'));
const Nearby = lazy(() => import('./pages/Nearby'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Preferences = lazy(() => import('./pages/onboarding/Preferences'));
const Notifications = lazy(() => import('./pages/Notifications'));
const TempUploadPortal = lazy(() => import('./pages/TempUploadPortal'));
const CreateContent = lazy(() => import('./pages/CreateContent'));
const YTDashboard = lazy(() => import('./pages/YTDashboard'));
const Subscription = lazy(() => import('./pages/Subscription'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const CreatePoll = lazy(() => import('./pages/CreatePoll'));
const CreatorTools = lazy(() => import('./pages/CreatorTools'));
const Community = lazy(() => import('./pages/Community'));
const CommunityRoom = lazy(() => import('./pages/CommunityRoom'));

// Lightweight fallback for lazy-loaded route transitions
function PageFallback() {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-24 h-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    </div>
  );
}

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
        
        const response = await fetch(`${baseUrl}/api/health`, { 
          signal: AbortSignal.timeout(8000) 
        });
        
        if (response.status === 503) {
          navigate('/maintenance', { replace: true });
        }
      } catch {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
        if (!apiUrl.includes('localhost')) {
          navigate('/maintenance', { replace: true });
        }
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, navigate]);

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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
          <Route path="/maintenance" element={<Maintenance />} />
          
          {/* Auth pages — publicly accessible */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
          
          {/* Onboarding Routes — protected by OnboardingGuard for step sequencing */}
          <Route path="/role-selection" element={<PublicRoute><RoleSelection /></PublicRoute>} />

          {/* editor-specialization requires role to be selected first */}
          <Route
            path="/editor-specialization"
            element={
              <OnboardingGuard requiredStep="role">
                <EditorSpecialization />
              </OnboardingGuard>
            }
          />
          <Route
            path="/subcategory-selection"
            element={<Navigate to="/editor-specialization" replace />}
          />

          {/* brand-details requires role = brand to be selected */}
          <Route
            path="/brand-details"
            element={
              <OnboardingGuard requiredStep="role">
                <BrandDetails />
              </OnboardingGuard>
            }
          />

          {/* connect-socials replaces youtube-connect */}
          <Route
            path="/connect-socials"
            element={
              <OnboardingGuard requiredStep="role">
                <ConnectSocials />
              </OnboardingGuard>
            }
          />

          {/* complete-profile is for Google OAuth users only */}
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
          
          {/* Public Informational / Legal Pages — Standalone Full-Width Layouts */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          
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
            path="/community" 
            element={
              <AuthGuard>
                <AppLayout>
                  <Community />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/community/:communityId" 
            element={
              <AuthGuard>
                <AppLayout>
                  <CommunityRoom />
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
                <RoleGuard allowedCategories={['creator', 'editor', 'yt_influencer', 'video_editor', 'singer', 'dancer', 'videographer', 'photographer', 'actor', 'musician', 'fitness_expert', 'rent_service']}>
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
                <RoleGuard allowedCategories={['creator', 'yt_influencer']}>
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
                <RoleGuard allowedCategories={['creator', 'yt_influencer']}>
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
      </Suspense>
    </main>
  );
}

export default App;
