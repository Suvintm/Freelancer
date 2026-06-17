import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
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
      if (event.persisted) {
        console.log('🔄 [BFCache] Page restored from cache, verifying session...');
        checkAuth();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkAuth]);

  // 3. STRICT GUARD: While state is unknown, show nothing but the spinner
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
  const authEntryPaths = ['/login', '/signup', '/'];
  if (isAuthenticated && !user?.isOnboarded && authEntryPaths.includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

/**
 * OnboardingGuard — Enforces sequential step access in the onboarding flow.
 *
 * Prevents URL-hacking into the middle of registration. Each onboarding route
 * declares the minimum tempSignupData.onboardingStep required to access it.
 *
 * Step order: role → subcategory → youtube → details → complete
 *
 * Example: A user cannot visit /subcategory-selection directly unless
 * onboardingStep >= 'role' is already set in tempSignupData.
 */
const STEP_ORDER = ['role', 'subcategory', 'youtube', 'details', 'complete'] as const;
type OnboardingStep = typeof STEP_ORDER[number];

interface OnboardingGuardProps {
  children: ReactNode;
  /** The minimum onboardingStep required to access this page. */
  requiredStep: OnboardingStep;
  /** Where to redirect if the guard fails. Defaults to '/role-selection'. */
  fallback?: string;
}

export const OnboardingGuard = ({ children, requiredStep, fallback = '/role-selection' }: OnboardingGuardProps) => {
  const { tempSignupData } = useOnboardingStore();

  const currentStep = tempSignupData?.onboardingStep;
  const categoryId = tempSignupData?.categoryId;

  // Base requirement: must have a category selected at minimum
  if (!categoryId) {
    return <Navigate to={fallback} replace />;
  }

  // If a specific step is required, verify the user has reached at least that step
  if (requiredStep !== 'role') {
    const currentIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : -1;
    const requiredIndex = STEP_ORDER.indexOf(requiredStep);

    if (currentIndex < requiredIndex - 1) {
      // User hasn't completed enough steps — send them back
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};
