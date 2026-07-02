import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsInitialized, selectUser, selectIsAddingAccount } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { queryClient } from '../../queries/queryClient';
import { CURRENT_USER_QUERY_KEY } from '../../queries/useCurrentUser';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const user = useSelector(selectUser);
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
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

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

interface RoleGuardProps {
  children: ReactNode;
  allowedCategories: string[];
}

export const RoleGuard = ({ children, allowedCategories }: RoleGuardProps) => {
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'admin') {
    return <>{children}</>;
  }

  const userCategorySlug = user.primaryRole?.category;
  if (!userCategorySlug || !allowedCategories.includes(userCategorySlug)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: AuthGuardProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const user = useSelector(selectUser);
  const location = useLocation();
  const isAddingAccount = useSelector(selectIsAddingAccount);

  if (!isInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // If already logged in and fully onboarded, don't show login/signup pages
  // UNLESS they explicitly want to add an account
  if (isAuthenticated && user?.isOnboarded && !isAddingAccount) {
    return <Navigate to="/home" replace />;
  }

  // If logged in but NOT onboarded, only redirect if they are trying to access /login or /signup
  const authEntryPaths = ['/login', '/signup', '/'];
  if (isAuthenticated && !user?.isOnboarded && authEntryPaths.includes(location.pathname)) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

const STEP_ORDER = ['role', 'subcategory', 'youtube', 'details', 'complete'] as const;
type OnboardingStep = typeof STEP_ORDER[number];

interface OnboardingGuardProps {
  children: ReactNode;
  requiredStep: OnboardingStep;
  fallback?: string;
}

export const OnboardingGuard = ({ children, requiredStep, fallback = '/role-selection' }: OnboardingGuardProps) => {
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);

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
