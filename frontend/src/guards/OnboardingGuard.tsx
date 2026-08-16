import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { canNavigateToStep } from '../features/onboarding/utils/onboardingValidators';
import type { OnboardingStep } from '../features/onboarding/types/onboarding.types';

interface OnboardingGuardProps {
  children: React.ReactNode;
  step?: OnboardingStep;
  requiredStep?: string;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children, step, requiredStep }) => {
  const location = useLocation();
  const { auth, onboarding } = useSelector((state: RootState) => state);

  // Map requiredStep to valid OnboardingStep
  const rawStep = step || requiredStep || 'role';
  const targetStep: OnboardingStep =
    rawStep === 'youtube' ? 'youtube_connect' :
    rawStep === 'specialization' ? 'specialization' :
    rawStep === 'brand' ? 'brand_details' :
    (rawStep as OnboardingStep);

  // If user is already authenticated and onboarded, redirect away from onboarding to main app
  // UNLESS they are actively in the middle of onboarding (selectedRole set) or adding an account
  const activeSession = auth.sessions?.find((s) => s.user.id === auth.activeUserId);
  const isActivelyOnboarding = Boolean(onboarding.selectedRole || onboarding.tempSignupData?.categoryId);

  // Allow through if user is returning from Instagram OAuth (full-page redirect flow)
  const isReturningFromInstaOAuth = 
    localStorage.getItem('instagram_oauth_pending') === 'true' ||
    window.location.hash.includes('instaToken=') ||
    !!localStorage.getItem('instagram_access_token');

  if (activeSession?.user?.isOnboarded && !isActivelyOnboarding && !auth.isAddingAccount && !isReturningFromInstaOAuth) {
    return <Navigate to="/explore" replace />;
  }

  // Construct current state snapshot for validator
  const currentState = {
    currentStep: targetStep,
    authMethod: onboarding.authMethod || onboarding.tempSignupData?.authMethod || null,
    isSocialSignup: Boolean(onboarding.tempSignupData?.isSocialSignup),
    socialProfile: onboarding.tempSignupData?.socialProfile || null,
    selectedRole: onboarding.selectedRole || (onboarding.tempSignupData?.categorySlug ? {
      id: onboarding.tempSignupData.categoryId || '',
      name: onboarding.tempSignupData.roleName || '',
      slug: onboarding.tempSignupData.categorySlug,
      roleGroup: onboarding.tempSignupData.roleGroup || 'PROVIDER',
    } : null),
    editorData: {
      specializations: onboarding.tempSignupData?.specializations || [],
      softwareUsed: onboarding.tempSignupData?.softwareUsed || [],
      skills: onboarding.tempSignupData?.skills || [],
      portfolioUrl: onboarding.tempSignupData?.portfolioUrl,
      experienceYears: onboarding.tempSignupData?.experienceYears,
    },
    brandData: {
      companyName: onboarding.tempSignupData?.companyName,
      companyWebsite: onboarding.tempSignupData?.companyWebsite,
      industry: onboarding.tempSignupData?.industry,
      companySize: onboarding.tempSignupData?.companySize,
      designation: onboarding.tempSignupData?.designation,
      approxBudget: onboarding.tempSignupData?.approxBudget,
      targetRegions: onboarding.tempSignupData?.targetRegions,
    },
    creatorData: {
      channels: onboarding.tempSignupData?.youtubeChannels || [],
      selectedChannelIds: onboarding.youtubeDiscovery?.selectedChannelIds || [],
      primarySubCategoryId: undefined,
      bio: undefined,
    },
    isCompleted: false,
  };

  const validation = canNavigateToStep(currentState, targetStep);

  if (!validation.allowed) {
    return <Navigate to={validation.redirectStep || '/role-selection'} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
