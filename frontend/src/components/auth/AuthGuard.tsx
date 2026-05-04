import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for interceptor-forced logouts (expired token, 401 on refresh)
  // Without this, a session expiry mid-use leaves the user on a blank page
  useEffect(() => {
    const handleForcedLogout = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('suvix:logout', handleForcedLogout);
    return () => window.removeEventListener('suvix:logout', handleForcedLogout);
  }, [navigate]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding guard — uses reactive `user` from hook (not stale getState())
  const onboardingPaths = ['/role-selection', '/signup', '/youtube-connect', '/subcategory-selection', '/complete-profile'];
  if (user && !user.isOnboarded && !onboardingPaths.includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

