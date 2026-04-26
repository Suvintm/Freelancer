import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PlaceholderPage from './pages/PlaceholderPage';
import Maintenance from './pages/Maintenance';
import { AppLayout } from './components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  useEffect(() => {
    // 🛰️ SERVER HEALTH CHECK
    // Pings the backend to ensure the Nexus is online.
    const checkServer = async () => {
      // Don't check if we are already on the maintenance page to avoid loops
      if (location.pathname === '/maintenance') {
        setIsCheckingServer(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api';
        const response = await fetch(`${apiUrl}/auth/me`, { signal: AbortSignal.timeout(3000) });
        
        // 503 Service Unavailable is our standard maintenance signal
        if (response.status === 503) {
          navigate('/maintenance', { replace: true });
        }
      } catch (error) {
        console.warn('🚧 [MAINTENANCE] Nexus is unreachable. Redirecting to maintenance portal.');
        navigate('/maintenance', { replace: true });
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServer();
  }, [location.pathname, navigate]);

  if (isCheckingServer && location.pathname !== '/maintenance') {
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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        
        {/* Authenticated Routes wrapped in AppLayout */}
        <Route 
          path="/home" 
          element={
            <AppLayout>
              <Home />
            </AppLayout>
          } 
        />
        <Route 
          path="/explore" 
          element={
            <AppLayout>
              <Explore />
            </AppLayout>
          } 
        />
        <Route 
          path="/nearby" 
          element={
            <AppLayout>
              <PlaceholderPage title="Nearby" />
            </AppLayout>
          } 
        />
        <Route 
          path="/reels" 
          element={
            <AppLayout>
              <PlaceholderPage title="Reels" />
            </AppLayout>
          } 
        />
        <Route 
          path="/jobs" 
          element={
            <AppLayout>
              <PlaceholderPage title="Jobs" />
            </AppLayout>
          } 
        />
        <Route 
          path="/chats" 
          element={
            <AppLayout>
              <PlaceholderPage title="Chats" />
            </AppLayout>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <AppLayout>
              <Profile />
            </AppLayout>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          } 
        />

        {/* Catch-all redirect to welcome or home depending on auth (placeholder) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
