import type { Block } from './block.types';
import type { Theme } from './theme.types';

/**
 * Bio Page Type Definitions
 * Represents the full data model for both Draft and Published snapshots.
 */

export type PageStatus = 'draft' | 'published' | 'archived';

export interface PageSeoSettings {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  favicon?: string;
}

export interface PageAnalyticsSettings {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
}

export interface PageAdvancedSettings {
  customDomain?: string | null;
  passwordProtection?: {
    enabled: boolean;
    passwordHash?: string;
  };
  hideBranding: boolean;
  customCss?: string | null;
  utmTracking: boolean;
}

export interface BioPageSettings {
  seo: PageSeoSettings;
  analytics: PageAnalyticsSettings;
  advanced: PageAdvancedSettings;
}

export interface PublishedSnapshot {
  blocks: Block[];
  theme: Theme;
  settings: BioPageSettings;
  publishedAt: string;
}

export interface BioPage {
  id: string;                    // UUID
  userId: string;                // User owner ID
  slug: string;                  // e.g. "main" or "shop"
  title: string;                 // Display title
  description: string;           // Brief summary
  status: PageStatus;
  isActive: boolean;             // True if this is the user's primary public bio
  templateId?: string;           // Provenance template ID
  templateVersion?: number;      // Provenance template version

  // Draft Data (Actively edited & autosaved)
  draftBlocks: Block[];
  draftTheme: Theme;
  settings: BioPageSettings;

  // Published Snapshot (Frozen payload served to public visitors)
  publishedSnapshot?: PublishedSnapshot | null;
  publishedAt?: string | null;

  // Real-time Counters (Denormalized)
  viewCount: number;
  clickCount: number;
  ctr?: number;

  createdAt: string;
  updatedAt: string;
}

export interface BioPageSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: PageStatus;
  isActive: boolean;
  templateId?: string;
  thumbnailUrl?: string;
  viewCount: number;
  clickCount: number;
  ctr: number;
  publishedAt?: string | null;
  updatedAt: string;
}
