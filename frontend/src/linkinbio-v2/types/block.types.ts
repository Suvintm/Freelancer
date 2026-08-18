/**
 * Block System Type Definitions
 * Represents the atomic unit of the Link-in-Bio platform.
 */

export type BlockType =
  | 'profile-header'
  | 'link-button'
  | 'social-bar'
  | 'product-grid'
  | 'video-embed'
  | 'text-block'
  | 'image-gallery'
  | 'email-capture'
  | 'divider'
  | 'countdown';

export type ProfileVariant = 'centered' | 'banner' | 'split';
export type LinkButtonVariant = 'solid' | 'outline' | 'soft' | 'glass';
export type LinkButtonAnimation = 'none' | 'pulse' | 'bounce' | 'glow';
export type SocialBarStyle = 'icons-only' | 'icons-with-label' | 'pills';
export type SocialIconSize = 'small' | 'medium' | 'large';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type ImageGalleryLayout = 'grid' | 'carousel' | 'masonry';
export type DividerStyle = 'line' | 'dashed' | 'dots' | 'space';

export interface SocialLinkItem {
  id: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'tiktok' | 'spotify' | 'linkedin' | 'github' | 'discord' | 'website' | 'email';
  url: string;
}

export interface ProductItem {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  url: string;
  badge?: string;
}

export interface GalleryImageItem {
  id: string;
  imageUrl: string;
  caption?: string;
  url?: string;
}

// ----------------------------------------------------
// Specific Block Config Interfaces
// ----------------------------------------------------

export interface ProfileHeaderConfig {
  imageUrl: string;
  bannerUrl?: string;
  title: string;
  subtitle: string;
  variant: ProfileVariant;
  alignment: 'left' | 'center' | 'right';
  showVerifiedBadge?: boolean;
}

export interface LinkButtonConfig {
  text: string;
  subtitle?: string;
  url: string;
  variant: LinkButtonVariant;
  color?: string;
  textColor?: string;
  icon?: string;
  imageUrl?: string;
  animation: LinkButtonAnimation;
  openInNewTab: boolean;
}

export interface SocialBarConfig {
  links: SocialLinkItem[];
  style: SocialBarStyle;
  size: SocialIconSize;
  color?: string;
}

export interface ProductGridConfig {
  products: ProductItem[];
  columns: 1 | 2 | 3;
  showPrice: boolean;
}

export interface VideoEmbedConfig {
  videoUrl: string;
  aspectRatio: VideoAspectRatio;
  autoplay: boolean;
  title?: string;
}

export interface TextBlockConfig {
  content: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  alignment: 'left' | 'center' | 'right';
  color?: string;
}

export interface ImageGalleryConfig {
  images: GalleryImageItem[];
  layout: ImageGalleryLayout;
  gap: 'none' | 'small' | 'medium' | 'large';
}

export interface EmailCaptureConfig {
  title: string;
  subtitle?: string;
  buttonText: string;
  successMessage: string;
  provider?: 'internal' | 'mailchimp' | 'convertkit';
}

export interface DividerConfig {
  style: DividerStyle;
  color?: string;
  spacing: 'small' | 'medium' | 'large';
}

export interface CountdownConfig {
  targetDate: string;
  title: string;
  expiredText: string;
}

export type AnyBlockConfig =
  | ProfileHeaderConfig
  | LinkButtonConfig
  | SocialBarConfig
  | ProductGridConfig
  | VideoEmbedConfig
  | TextBlockConfig
  | ImageGalleryConfig
  | EmailCaptureConfig
  | DividerConfig
  | CountdownConfig
  | Record<string, any>;

// ----------------------------------------------------
// Block Instance Definition
// ----------------------------------------------------

export interface Block<T = AnyBlockConfig> {
  id: string;                   // UUID v4
  type: BlockType;              // Block type identifier
  schemaVersion: number;        // Schema migration version
  order: number;                // 0-indexed position
  config: T;                    // Block specific payload
  styles?: Record<string, any>; // Optional per-block style overrides
  isVisible: boolean;           // Can hide without deleting
}

// ----------------------------------------------------
// Editor Dynamic Form Field Types
// ----------------------------------------------------

export type EditorFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'image-upload'
  | 'color-picker'
  | 'select'
  | 'toggle'
  | 'variant-picker'
  | 'rich-text'
  | 'icon-select'
  | 'social-links-editor'
  | 'product-list-editor'
  | 'image-gallery-editor'
  | 'datetime';

export interface EditorFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface EditorFieldDefinition {
  key: string;
  type: EditorFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  options?: EditorFieldOption[];
  defaultValue?: any;
}

export interface BlockDefinition<T = AnyBlockConfig> {
  type: BlockType;
  name: string;
  icon: string;
  description: string;
  category: 'core' | 'media' | 'commerce' | 'growth' | 'layout';
  schemaVersion: number;
  defaultConfig: T;
  editorFields: EditorFieldDefinition[];
  migrate?: (config: any, fromVersion: number) => T;
  isDeprecated?: boolean;
}
