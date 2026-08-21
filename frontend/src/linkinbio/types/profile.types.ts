// ─────────────────────────────────────────────────────────────────────────────
// profile.types.ts
// Types for the user's saved public profile data (maps 1:1 to DB schema)
// ─────────────────────────────────────────────────────────────────────────────

export type BlockType = 'LINK' | 'YOUTUBE_CHANNEL' | 'INSTAGRAM_PROFILE';

export interface ProfileBlock {
  id: string;
  type: BlockType;
  title: string;
  url: string;
  orderIndex: number;
  isVisible: boolean;
  /** Optional extra data per block type (icon override, thumbnail, etc.) */
  metadata?: Record<string, unknown>;
}

export interface PublicProfile {
  id: string;
  userId: string;
  isActive: boolean;
  isEligible: boolean;
  /** Slug of the template they chose, e.g. "minimal-v1" */
  templateSlug: string;
  /** JSON blob of all user theme overrides */
  themeConfig: Record<string, unknown>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  customDomain?: string | null;
  blocks: ProfileBlock[];
  createdAt: string;
  updatedAt: string;
}

/** Data about the logged-in creator used to pre-fill template fields */
export interface CreatorInfo {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture?: string | null;
  isVerified: boolean;
}
