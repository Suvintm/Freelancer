/**
 * shared/kernel/constants.js
 * Platform-wide constants — single source of truth.
 * These mirror Prisma enums and business-logic values.
 */

// ── Role Groups (mirrors Prisma RoleGroup enum) ────────────────────────────
export const ROLE_GROUP = {
  CLIENT:   'CLIENT',   // Brand / Social Promoter
  PROVIDER: 'PROVIDER', // YouTube Creator / Editor
};

// ── Role Sub-categories (mirrors RoleSubCategory slugs in DB) ─────────────
export const ROLE_SUB_CATEGORY = {
  YOUTUBE_CREATOR: 'youtube-creator',
  EDITOR:          'editor',
  BRAND:           'brand',
  PROMOTER:        'social-promoter',
};

// ── System Roles (mirrors Prisma UserRole enum) ────────────────────────────
export const SYSTEM_ROLE = {
  SUVIX_USER: 'suvix_user',
  ADMIN:      'admin',
};

// ── App Roles (derived, not stored) ───────────────────────────────────────
export const APP_ROLE = {
  PROVIDER: 'provider', // All PROVIDERs (Creator, Editor) map to this app role
  CLIENT:   'client',   // All CLIENTs (Brand, Promoter) map to this app role
  ADMIN:    'admin',
};

// ── Capabilities (what each sub-role can do) ──────────────────────────────
// Used by requireCapability() middleware
export const CAPABILITIES = {
  CONTENT_UPLOAD_POST:    'content.upload.post',
  CONTENT_UPLOAD_REEL:    'content.upload.reel',
  CONTENT_UPLOAD_STORY:   'content.upload.story',
  CREATOR_CONNECT_YT:     'creator.connect_youtube',
  CREATOR_SYNC_CHANNEL:   'creator.sync_channel',
  CAMPAIGN_CREATE:        'campaign.create',
  CAMPAIGN_APPLY:         'campaign.apply',
  SUBSCRIPTION_PURCHASE:  'subscription.purchase',
};

// Maps capability → allowed subCategory slugs
export const CAPABILITY_MAP = {
  [CAPABILITIES.CONTENT_UPLOAD_POST]:  [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR, ROLE_SUB_CATEGORY.EDITOR],
  [CAPABILITIES.CONTENT_UPLOAD_REEL]:  [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR, ROLE_SUB_CATEGORY.EDITOR],
  [CAPABILITIES.CONTENT_UPLOAD_STORY]: [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR, ROLE_SUB_CATEGORY.EDITOR],
  [CAPABILITIES.CREATOR_CONNECT_YT]:   [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR],
  [CAPABILITIES.CREATOR_SYNC_CHANNEL]: [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR],
  [CAPABILITIES.CAMPAIGN_CREATE]:      [ROLE_SUB_CATEGORY.BRAND, ROLE_SUB_CATEGORY.PROMOTER],
  [CAPABILITIES.CAMPAIGN_APPLY]:       [ROLE_SUB_CATEGORY.YOUTUBE_CREATOR],
  [CAPABILITIES.SUBSCRIPTION_PURCHASE]: Object.values(ROLE_SUB_CATEGORY), // All roles
};

// ── Subscription Tiers ─────────────────────────────────────────────────────
export const SUBSCRIPTION_TIER = {
  FREE:    'free',
  BASIC:   'basic',
  PRO:     'pro',
  PREMIUM: 'premium',
};

// ── Media ──────────────────────────────────────────────────────────────────
export const MEDIA_STATUS = {
  PENDING:    'PENDING',
  PROCESSING: 'PROCESSING',
  READY:      'READY',
  RETRYING:   'RETRYING',
  FAILED:     'FAILED',
};

export const MEDIA_TYPE = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
};

// ── Payment ────────────────────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  PENDING:    'pending',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  FAILED:     'failed',
  REFUNDED:   'refunded',
};

export const PAYMENT_PROVIDER = {
  RAZORPAY_NODE: 'razorpay_node', // Default (current)
  KAFKA_JAVA:    'kafka_java',    // Java payment-service via Kafka
};

// ── Notification Types (mirrors Prisma NotificationType enum) ─────────────
export const NOTIFICATION_TYPE = {
  SYSTEM:        'SYSTEM',
  MESSAGE:       'MESSAGE',
  ORDER_UPDATE:  'ORDER_UPDATE',
  FOLLOW:        'FOLLOW',
  PROMOTION:     'PROMOTION',
  WELCOME:       'WELCOME',
  MEDIA_READY:   'MEDIA_READY',
  MEDIA_FAILED:  'MEDIA_FAILED',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
  STORY_EXPIRED: 'STORY_EXPIRED',
};

// ── Availability ───────────────────────────────────────────────────────────
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  BUSY:      'busy',
  AWAY:      'away',
};
