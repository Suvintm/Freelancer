import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import SubcategorySelection from './pages/SubcategorySelection';
import YouTubeConnect from './pages/YouTubeConnect';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PlaceholderPage from './pages/PlaceholderPage';
import Maintenance from './pages/Maintenance';
import OAuthSuccess from './pages/OAuthSuccess';
import { AppLayout } from './components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AuthGuard, PublicRoute } from './components/auth/AuthGuard';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth, isInitialized } = useAuthStore();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  useEffect(() => {
    // 🛰️ INITIAL AUTH CHECK
    checkAuth().finally(() => {
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
    });
  }, [checkAuth, navigate, location.pathname]);

  if ((!isInitialized || isCheckingServer) && location.pathname !== '/maintenance') {
    return (
      <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black font-sans antialiased text-white">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/maintenance" element={<Maintenance />} />
        
        {/* Public Routes (Redirect to /home if authenticated) */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/role-selection" element={<PublicRoute><RoleSelection /></PublicRoute>} />
        <Route path="/subcategory-selection" element={<PublicRoute><SubcategorySelection /></PublicRoute>} />
        <Route path="/youtube-connect" element={<PublicRoute><YouTubeConnect /></PublicRoute>} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        
        {/* Authenticated Routes wrapped in AppLayout and AuthGuard */}
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
                <PlaceholderPage title="Nearby" />
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
          path="/settings" 
          element={
            <AuthGuard>
              <AppLayout>
                <Settings />
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
