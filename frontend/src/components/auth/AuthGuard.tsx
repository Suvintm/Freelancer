import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitialized, user, checkAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. LISTEN FOR FORCED LOGOUTS (Interceptors)
  useEffect(() => {
    const handleForcedLogout = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('suvix:logout', handleForcedLogout);
    return () => window.removeEventListener('suvix:logout', handleForcedLogout);
  }, [navigate]);

  // 2. BFCACHE PROTECTION: Handle browser 'back' after logout
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is restored from cache (back button), force an auth check
      if (event.persisted) {
        console.log('🔄 [BFCache] Page restored from cache, verifying session...');
        checkAuth();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkAuth]);

  // 3. STRICT GUARD: While state is unknown, show nothing but the spinner
  // We NEVER render children if we aren't 100% sure the user is valid
  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // 4. UNAUTHENTICATED: Immediate redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 5. ONBOARDING GUARD: Ensure user has completed setup
  const onboardingPaths = ['/role-selection', '/signup', '/youtube-connect', '/subcategory-selection', '/complete-profile'];
  if (user && !user.isOnboarded && !onboardingPaths.includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // If already logged in and fully onboarded, don't show login/signup pages
  if (isAuthenticated && user?.isOnboarded) {
    return <Navigate to="/home" replace />;
  }

  // If logged in but NOT onboarded, only redirect if they are trying to access /login or /signup
  // This allows them to stay on /role-selection or /complete-profile
  const authEntryPaths = ['/login', '/signup', '/'];
  if (isAuthenticated && !user?.isOnboarded && authEntryPaths.includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

