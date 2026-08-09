export type AuthMethod = 'email' | 'google';

export type OnboardingRoleGroup = 'CLIENT' | 'PROVIDER';

export type OnboardingRoleSlug = 'user' | 'creator' | 'editor' | 'brand' | string;

export type OnboardingStep =
  | 'welcome'
  | 'role'
  | 'auth_method'
  | 'specialization'
  | 'youtube_connect'
  | 'youtube_niche'
  | 'brand_details'
  | 'complete_profile';

export interface DiscoveredYouTubeChannel {
  channelId: string;
  channelName: string;
  channelHandle?: string | null;
  thumbnailUrl?: string | null;
  subscriberCount?: number | string;
  videoCount?: number | string;
  uploadsPlaylistId?: string | null;
  subCategoryId?: string;
  subCategorySlug?: string | null;
  isPrimary?: boolean;
  isVerified?: boolean;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }>;
}

export interface SocialProfile {
  name: string;
  email: string;
  picture?: string;
  googleId: string;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  authMethod: AuthMethod | null;
  isSocialSignup: boolean;
  socialProfile: SocialProfile | null;
  selectedRole: {
    id: string;
    name: string;
    slug: OnboardingRoleSlug;
    roleGroup?: OnboardingRoleGroup;
  } | null;
  
  // Domain specific payloads
  editorData: {
    specializations: string[];
    softwareUsed: string[];
    skills: string[];
    portfolioUrl?: string;
    experienceYears?: number;
  };
  
  brandData: {
    companyName?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string;
    designation?: string;
    approxBudget?: string | number;
    targetRegions?: string[];
  };

  creatorData: {
    channels: DiscoveredYouTubeChannel[];
    selectedChannelIds: string[];
    primarySubCategoryId?: string;
    bio?: string;
  };

  isCompleted: boolean;
}
