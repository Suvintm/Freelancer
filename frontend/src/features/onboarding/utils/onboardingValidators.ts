import type { OnboardingSliceState, OnboardingStep } from '../types/onboarding.types';

export interface OnboardingValidationState {
  selectedRole?: { slug: string; name?: string } | null;
  authMethod?: string | null;
  [key: string]: any;
}

export const canNavigateToStep = (
  state: OnboardingValidationState | OnboardingSliceState,
  targetStep: OnboardingStep
): { allowed: boolean; redirectStep?: string } => {
  // Step 1: Welcome is always accessible
  if (targetStep === 'welcome') return { allowed: true };

  // Step 2: Role selection requires no prerequisites
  if (targetStep === 'role') return { allowed: true };

  // Must have selected a role before proceeding to step 3+
  if (!state.selectedRole) {
    return { allowed: false, redirectStep: '/role-selection' };
  }

  // Must have chosen auth method (email or google) before step 3+
  if (!state.authMethod) {
    return { allowed: false, redirectStep: '/role-selection' };
  }

  const roleSlug = state.selectedRole.slug?.toLowerCase() || '';

  // Role-specific step access validation
  if (targetStep === 'specialization') {
    if (roleSlug !== 'editor' && roleSlug !== 'video-editor') {
      return { allowed: false, redirectStep: '/role-selection' };
    }
  }

  if (targetStep === 'brand_details') {
    if (roleSlug !== 'brand' && roleSlug !== 'client' && roleSlug !== 'company') {
      return { allowed: false, redirectStep: '/role-selection' };
    }
  }

  if (targetStep === 'youtube_connect' || targetStep === 'youtube_niche') {
    if (roleSlug !== 'creator' && roleSlug !== 'youtuber') {
      return { allowed: false, redirectStep: '/role-selection' };
    }
  }

  return { allowed: true };
};
