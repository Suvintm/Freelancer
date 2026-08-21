import type { Block } from '../types/block.types';
import type { Theme } from '../types/theme.types';

/**
 * Universal Migrate-on-Read Engine (Figma Model)
 * Automatically ensures older JSON payloads from months/years ago seamlessly receive
 * modern schema defaults in memory without data loss or UI crashes.
 */
export function migrateBlock(block: any, index: number = 0): Block {
  if (!block || typeof block !== 'object') {
    return {
      id: `block_${Date.now()}_${index}`,
      type: 'text-block',
      schemaVersion: 1,
      isVisible: true,
      order: index,
      config: { content: '', align: 'center' },
    };
  }

  const id = block.id || `block_${Date.now()}_${index}`;
  const type = block.type || 'link-button';
  const schemaVersion = typeof block.schemaVersion === 'number' ? block.schemaVersion : 1;
  const isVisible = block.isVisible !== false;
  const order = typeof block.order === 'number' ? block.order : index;
  const cfg = { ...(block.config || {}) };

  // Block specific schema migrations
  switch (type) {
    case 'profile-header':
      if (!cfg.variant) cfg.variant = 'centered';
      if (!cfg.avatarShape) cfg.avatarShape = 'circle';
      if (!cfg.avatarSize) cfg.avatarSize = 'medium';
      if (!cfg.alignment) cfg.alignment = 'center';
      if (cfg.showVerifiedBadge === undefined) cfg.showVerifiedBadge = true;
      if (!cfg.title && cfg.displayName) cfg.title = cfg.displayName;
      if (!cfg.displayName && cfg.title) cfg.displayName = cfg.title;
      if (!cfg.imageUrl && cfg.avatarUrl) cfg.imageUrl = cfg.avatarUrl;
      if (!cfg.avatarUrl && cfg.imageUrl) cfg.avatarUrl = cfg.imageUrl;
      if (!cfg.subtitle && cfg.bio) cfg.subtitle = cfg.bio;
      if (!cfg.bio && cfg.subtitle) cfg.bio = cfg.subtitle;
      break;

    case 'link-button':
      if (!cfg.variant) cfg.variant = 'card';
      if (!cfg.animation) cfg.animation = 'none';
      if (!cfg.text && cfg.title) cfg.text = cfg.title;
      break;

    case 'social-bar':
      if (!cfg.style) cfg.style = 'filled-circle';
      if (!Array.isArray(cfg.platforms)) cfg.platforms = [];
      break;

    case 'tip-jar':
      if (!Array.isArray(cfg.suggestedAmounts)) cfg.suggestedAmounts = [5, 10, 25];
      if (!cfg.currency) cfg.currency = 'USD';
      if (!cfg.buttonText) cfg.buttonText = 'Send Support ☕';
      break;

    case 'faq-accordion':
      if (!Array.isArray(cfg.items)) cfg.items = [];
      break;

    case 'image-gallery':
      if (!cfg.layout) cfg.layout = 'grid';
      if (!Array.isArray(cfg.images)) cfg.images = [];
      break;

    default:
      break;
  }

  return {
    id,
    type,
    schemaVersion,
    isVisible,
    order,
    config: cfg,
  };
}

export function migrateTheme(theme: any): Theme {
  if (!theme || typeof theme !== 'object') {
    return {
      schemaVersion: 1,
      background: {
        type: 'solid',
        value: '#4D6234',
        color: '#4D6234',
        dominantColor: '#4D6234',
        blur: 0,
        overlay: { enabled: true, color: '#000000', opacity: 0.35 },
      },
      colors: {
        background: '#4D6234',
        primary: '#ffffff',
        secondary: '#4D6234',
        text: '#ffffff',
        textMuted: '#e2e8f0',
        cardBackground: 'rgba(255, 255, 255, 0.12)',
      },
      typography: {
        fontFamily: 'Plus Jakarta Sans',
        headingSize: 'large',
        bodySize: 'medium',
      },
      buttons: {
        style: 'rounded',
        borderRadius: 14,
        shadow: 'medium',
        animation: 'none',
      },
      spacing: {
        blockGap: 'medium',
        pagePadding: 'medium',
        maxWidth: 'medium',
      },
      cardVariant: 'solid',
    };
  }

  const schemaVersion = theme.schemaVersion || 1;
  const bg = theme.background || {};
  const colors = theme.colors || {};
  const typography = theme.typography || {};
  const buttons = theme.buttons || {};
  const spacing = theme.spacing || {};

  return {
    schemaVersion,
    background: {
      type: bg.type || 'solid',
      value: bg.value || bg.color || '#4D6234',
      color: bg.color || bg.value || '#4D6234',
      dominantColor: bg.dominantColor || '#4D6234',
      imageUrl: bg.imageUrl,
      assetId: bg.assetId,
      blur: typeof bg.blur === 'number' ? Math.min(12, Math.max(0, bg.blur)) : 0,
      overlay: {
        enabled: bg.overlay?.enabled !== false,
        color: bg.overlay?.color || '#000000',
        opacity: typeof bg.overlay?.opacity === 'number' ? bg.overlay.opacity : 0.35,
      },
    },
    colors: {
      background: colors.background || '#4D6234',
      primary: colors.primary || '#ffffff',
      secondary: colors.secondary || '#4D6234',
      text: colors.text || '#ffffff',
      textMuted: colors.textMuted || '#e2e8f0',
      cardBackground: colors.cardBackground || 'rgba(255, 255, 255, 0.12)',
    },
    typography: {
      fontFamily: typography.fontFamily || 'Plus Jakarta Sans',
      headingSize: typography.headingSize || 'large',
      bodySize: typography.bodySize || 'medium',
      headingWeight: typography.headingWeight || 'bold',
    },
    buttons: {
      style: buttons.style || 'rounded',
      borderRadius: typeof buttons.borderRadius === 'number' ? buttons.borderRadius : 14,
      shadow: buttons.shadow || 'medium',
      animation: buttons.animation || 'none',
    },
    spacing: {
      blockGap: spacing.blockGap || 'medium',
      pagePadding: spacing.pagePadding || 'medium',
      maxWidth: spacing.maxWidth || 'medium',
    },
    cardVariant: theme.cardVariant || 'solid',
  };
}

export function migrateBioPayload(rawBlocks: any[], rawTheme: any): { blocks: Block[]; theme: Theme } {
  const blocks = Array.isArray(rawBlocks) ? rawBlocks.map(migrateBlock) : [];
  const theme = migrateTheme(rawTheme);
  return { blocks, theme };
}
