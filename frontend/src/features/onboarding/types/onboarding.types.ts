export type AuthMethod = 'email' | 'google';

export type OnboardingRoleGroup = 'CLIENT' | 'PROVIDER';

export type OnboardingRoleSlug = 'user' | 'creator' | 'editor' | 'brand' | string;

export type OnboardingStep =
  | 'welcome'
  | 'role'
  | 'auth_method'
  | 'specialization'
  | 'brand'
  | 'subcategory'
  | 'youtube'
  | 'youtube_connect'
  | 'youtube_niche'
  | 'brand_details'
  | 'details'
  | 'complete'
  | 'complete_profile';

export interface YouTubeVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number | string;
  videoCount: number | string;
  channelHandle?: string;
  isClaimed?: boolean;
  videos?: YouTubeVideoItem[];
}

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
  videos?: YouTubeVideoItem[];
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  mediaType: string;
  thumbnailUrl: string | null;
  permalink?: string;
  likeCount?: number;
  commentsCount?: number;
  timestamp?: string;
}

export interface InstagramAccount {
  accountId: string;
  handle: string;
  name?: string;
  bio?: string;
  website?: string;
  profilePictureUrl?: string;
  followerCount: number | string;
  followingCount?: number | string;
  mediaCount: number | string;
  accountType?: string;
  isPrimary?: boolean;
  recentMedia?: InstagramMediaItem[];
}

export interface SocialProfile {
  name: string;
  email: string;
  picture?: string;
  googleId: string;
}

export interface GoogleIdentity {
  email: string;
  googleId: string;
  name: string;
  picture?: string;
}

export interface CreatorData {
  channels: YouTubeChannel[];
  selectedChannelIds: string[];
  instagramAccounts?: InstagramAccount[];
  selectedInstagramAccountIds?: string[];
  selectedNiches: string[];
  discoveryToken: string | null;
  primarySubCategoryId?: string;
  bio?: string;
}

export interface EditorData {
  specializations: string[];
  softwareUsed: string[];
  skills?: string[];
  portfolioUrl?: string;
  experienceYears?: number;
}

export interface BrandData {
  companyName: string;
  companyWebsite: string;
  designation: string;
  industry: string;
  companySize: string;
  approxBudget: string | number;
  targetRegions?: string[];
}

export interface SelectedRole {
  id: string;
  name: string;
  slug: OnboardingRoleSlug;
  roleGroup?: OnboardingRoleGroup;
}

export interface TempSignupData {
  intent?: 'login' | 'register';
  onboardingStep?: OnboardingStep;
  authMethod?: AuthMethod;
  categoryId?: string;
  categorySlug?: OnboardingRoleSlug;
  role?: string;
  roleGroup?: OnboardingRoleGroup;
  roleName?: string;
  roleSubCategoryIds?: string[];
  specializations?: string[];
  softwareUsed?: string[];
  skills?: string[];
  portfolioUrl?: string;
  experienceYears?: number;
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  designation?: string;
  approxBudget?: string | number;
  targetRegions?: string[];
  isSocialSignup?: boolean;
  socialProfile?: SocialProfile;
  youtubeChannels?: DiscoveredYouTubeChannel[];
  instagramAccounts?: InstagramAccount[];
  discoveryToken?: string | null;
}

export interface OnboardingSliceState {
  tempSignupData: TempSignupData;
  selectedRole: SelectedRole | null;
  authMethod: AuthMethod | null;
  creatorData: CreatorData;
  editorData: EditorData;
  brandData: BrandData;
  googleIdentity: GoogleIdentity | null;
  youtubeDiscovery: {
    channels: YouTubeChannel[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
}

export type OnboardingState = OnboardingSliceState;
