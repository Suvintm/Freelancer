import type { Block } from './block.types';
import type { Theme } from './theme.types';

/**
 * Template System Type Definitions
 */

export type TemplateCategory =
  | 'all'
  | 'general'
  | 'creator'
  | 'commerce'
  | 'media'
  | 'education'
  | 'events';

export interface TemplateRestrictions {
  maxBlocks?: number;
  maxLinks?: number;
  allowCustomCss?: boolean;
  allowCustomDomain?: boolean;
}

export interface Template {
  id: string;
  version: number;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  isPremium: boolean;
  isActive: boolean;
  tags: string[];

  defaultBlocks: Block[];
  defaultTheme: Theme;
  allowedBlockTypes?: string[];
  restrictions?: TemplateRestrictions;

  createdAt: string;
  updatedAt: string;
}
