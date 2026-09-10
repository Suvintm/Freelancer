import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ConnectSocials from './pages/onboarding/ConnectSocials';
import OAuthSuccess from './pages/OAuthSuccess';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthInit } from './queries/useCurrentUser';
import { AuthGuard, PublicRoute, OnboardingGuard, RoleGuard } from './components/auth/AuthGuard';
import LottieComponent from 'lottie-react';
import loaderAnimation from './assets/lottie/loader.json';

import { useSelector } from 'react-redux';
import { selectToken } from './store/slices/authSlice';
import { scheduleProactiveTokenRefresh } from './api/client';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

// ── Lazy-loaded Route Components for Code-Splitting ─────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const RoleSelection = lazy(() => import('./pages/onboarding/RoleSelection'));
const EditorSpecialization = lazy(() => import('./pages/onboarding/EditorSpecialization'));
const BrandDetails = lazy(() => import('./pages/onboarding/BrandDetails'));
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
const CompleteProfile = lazy(() => import('./pages/onboarding/CompleteProfile'));
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
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const LinkInBioPage = lazy(() => import('./linkinbio-v2/pages/BioDashboardPage'));
const LinkInBioDesigner = lazy(() => import('./linkinbio-v2/pages/BioStudioPage'));
const LinkInBioAnalytics = lazy(() => import('./linkinbio-v2/pages/BioAnalyticsPage'));
const PublicBioVisitorPage = lazy(() => import('./linkinbio-v2/pages/PublicBioVisitorPage'));

import { GatewayOfflineScreen } from './components/common/GatewayOfflineScreen';

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
  const [isGatewayOffline, setIsGatewayOffline] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const token = useSelector(selectToken);

  useEffect(() => {
    if (token) {
      scheduleProactiveTokenRefresh(13 * 60 * 1000);
    }
  }, [token]);

  // Define routes that are always rendered client-side without being blocked by gateway outages
  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname === '/welcome' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/verify-email' ||
    location.pathname === '/about' ||
    location.pathname === '/privacy' ||
    location.pathname === '/privacy-policy' ||
    location.pathname === '/terms' ||
    location.pathname === '/terms-and-conditions' ||
    location.pathname === '/subscription' ||
    location.pathname === '/creator-tools' ||
    location.pathname.startsWith('/p/') ||
    location.pathname.startsWith('/bio/');

  // Listen for global gateway health events
  useEffect(() => {
    const handleGatewayDown = () => {
      // Never hijack public routes with a full offline screen
      if (!isPublicRoute) {
        setIsGatewayOffline(true);
      }
    };
    const handleGatewayUp = () => setIsGatewayOffline(false);

    window.addEventListener('suvix:gateway-down', handleGatewayDown);
    window.addEventListener('suvix:gateway-up', handleGatewayUp);

    return () => {
      window.removeEventListener('suvix:gateway-down', handleGatewayDown);
      window.removeEventListener('suvix:gateway-up', handleGatewayUp);
    };
  }, [isPublicRoute]);

  // 🛰️ SMART MULTI-STEP SERVER HEALTH CHECK (Cold-start resilient)
  useEffect(() => {
    let isMounted = true;

    const checkServerWithRetry = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
      let baseUrl = apiUrl;
      if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
        try {
          baseUrl = new URL(apiUrl).origin;
        } catch {
          // fallback
        }
      } else {
        if (baseUrl.endsWith('/api/v1')) baseUrl = baseUrl.slice(0, -7);
        else if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
      }

      // Probing helper with timeout
      const singleProbe = async (timeoutMs: number): Promise<boolean> => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const response = await fetch(`${baseUrl}/api/health`, {
            signal: controller.signal,
            cache: 'no-cache',
          }).catch(async () => {
            return await fetch(`${baseUrl}/health`, {
              signal: controller.signal,
              cache: 'no-cache',
            });
          });

          clearTimeout(timeoutId);
          return Boolean(response && response.ok);
        } catch {
          return false;
        }
      };

      // Attempt 1: Fast probe (2500ms)
      let isHealthy = await singleProbe(2500);

      // Attempt 2: Cold-start buffer probe if attempt 1 failed (3500ms)
      if (!isHealthy && isMounted) {
        await new Promise((r) => setTimeout(r, 1200));
        if (isMounted) {
          isHealthy = await singleProbe(3500);
        }
      }

      // Attempt 3: Final confirmation probe if still failing (4000ms)
      if (!isHealthy && isMounted) {
        await new Promise((r) => setTimeout(r, 1500));
        if (isMounted) {
          isHealthy = await singleProbe(4000);
        }
      }

      if (isMounted) {
        if (isHealthy) {
          setIsGatewayOffline(false);
          if (location.pathname === '/maintenance') {
            navigate('/', { replace: true });
          }
        } else {
          // Only show full maintenance screen if NOT a public marketing/welcome page
          if (!isPublicRoute) {
            setIsGatewayOffline(true);
          }
        }
        setIsCheckingServer(false);
      }
    };

    checkServerWithRetry();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, isPublicRoute]);

  // 🚨 If API Gateway is down on protected routes, render Google/Meta-grade Offline Screen
  if (isGatewayOffline && !isPublicRoute && location.pathname !== '/maintenance') {
    return (
      <GatewayOfflineScreen
        onRetrySuccess={() => {
          setIsGatewayOffline(false);
          window.location.reload();
        }}
      />
    );
  }

  // 🔄 Initial authentication/server resolution loader (short-lived, non-blocking for public routes)
  if ((!isInitialized || isCheckingServer) && !isPublicRoute && location.pathname !== '/maintenance') {
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
            path="/link-in-bio" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioPage />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/studio" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioDesigner />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/studio/:pageId" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioDesigner />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/design" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioDesigner />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/design/:userId" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioDesigner />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/analytics" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioAnalytics />
                </AppLayout>
              </AuthGuard>
            } 
          />
          <Route 
            path="/link-in-bio/analytics/:pageId" 
            element={
              <AuthGuard>
                <AppLayout>
                  <LinkInBioAnalytics />
                </AppLayout>
              </AuthGuard>
            } 
          />
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

          {/* Public Link-in-Bio Visitor Routes (Level 4) */}
          <Route path="/u/:username" element={<PublicBioVisitorPage />} />
          <Route path="/u/:username/:slug" element={<PublicBioVisitorPage />} />
          <Route path="/p/:slug" element={<PublicBioVisitorPage />} />
          <Route path="/bio/:username" element={<PublicBioVisitorPage />} />

          {/* Public Link-in-Bio Profile Catch-All */}
          <Route path="/:username" element={<PublicProfilePage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
  );
}

export default App;
