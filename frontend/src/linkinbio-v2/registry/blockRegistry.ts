import type { BlockDefinition, BlockType, Block } from '../types/block.types';

/**
 * BLOCK_REGISTRY - Single Source of Truth
 * Defines all available blocks, their schemas, default configurations,
 * and auto-generated editor form fields.
 */
export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition<any>> = {
  'profile-header': {
    type: 'profile-header',
    name: 'Profile Header',
    icon: 'User',
    description: 'Avatar, name, bio description, and layout styles',
    category: 'core',
    schemaVersion: 1,
    defaultConfig: {
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      bannerUrl: '',
      title: 'Alex Morgan',
      subtitle: 'Digital Creator • Building the future of content 🚀',
      variant: 'centered',
      alignment: 'center',
      showVerifiedBadge: true,
    },
    editorFields: [
      {
        key: 'variant',
        type: 'variant-picker',
        label: 'Layout Style',
        options: [
          { label: 'Centered', value: 'centered' },
          { label: 'Banner Hero', value: 'banner' },
          { label: 'Split Modern', value: 'split' },
        ],
      },
      {
        key: 'imageUrl',
        type: 'image-upload',
        label: 'Profile Photo',
      },
      {
        key: 'bannerUrl',
        type: 'image-upload',
        label: 'Banner Header Image (Optional)',
      },
      {
        key: 'title',
        type: 'text',
        label: 'Display Name',
        placeholder: 'Enter your name or brand',
      },
      {
        key: 'subtitle',
        type: 'textarea',
        label: 'Bio / Tagline',
        placeholder: 'Tell visitors about yourself...',
      },
      {
        key: 'alignment',
        type: 'select',
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      {
        key: 'showVerifiedBadge',
        type: 'toggle',
        label: 'Show Verified Badge',
      },
    ],
  },

  'link-button': {
    type: 'link-button',
    name: 'Link Button',
    icon: 'Link',
    description: 'High-converting interactive link button with animations',
    category: 'core',
    schemaVersion: 1,
    defaultConfig: {
      text: 'Visit My Official Website',
      subtitle: 'Articles, portfolios & recent projects',
      url: 'https://example.com',
      variant: 'solid',
      color: '#3b82f6',
      textColor: '#ffffff',
      icon: 'Globe',
      imageUrl: '',
      animation: 'none',
      openInNewTab: true,
    },
    editorFields: [
      {
        key: 'text',
        type: 'text',
        label: 'Button Title',
        placeholder: 'e.g. Check my latest portfolio',
      },
      {
        key: 'subtitle',
        type: 'text',
        label: 'Subtext / Description (Optional)',
        placeholder: 'e.g. 50% discount this week only',
      },
      {
        key: 'url',
        type: 'url',
        label: 'Destination URL',
        placeholder: 'https://...',
      },
      {
        key: 'variant',
        type: 'select',
        label: 'Button Style',
        options: [
          { label: 'Solid Color', value: 'solid' },
          { label: 'Outline Border', value: 'outline' },
          { label: 'Soft Tinted', value: 'soft' },
          { label: 'Glassmorphism', value: 'glass' },
        ],
      },
      {
        key: 'color',
        type: 'color-picker',
        label: 'Custom Button Color',
      },
      {
        key: 'textColor',
        type: 'color-picker',
        label: 'Text Color',
      },
      {
        key: 'icon',
        type: 'icon-select',
        label: 'Leading Icon',
      },
      {
        key: 'imageUrl',
        type: 'image-upload',
        label: 'Thumbnail Image (Optional)',
      },
      {
        key: 'animation',
        type: 'select',
        label: 'Attention Animation',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Pulse / Heartbeat', value: 'pulse' },
          { label: 'Bounce', value: 'bounce' },
          { label: 'Glowing Border', value: 'glow' },
        ],
      },
      {
        key: 'openInNewTab',
        type: 'toggle',
        label: 'Open in New Tab',
      },
    ],
  },

  'social-bar': {
    type: 'social-bar',
    name: 'Social Icons Bar',
    icon: 'Share2',
    description: 'Clean row or pills of your social media profiles',
    category: 'core',
    schemaVersion: 1,
    defaultConfig: {
      links: [
        { id: '1', platform: 'instagram', url: 'https://instagram.com' },
        { id: '2', platform: 'youtube', url: 'https://youtube.com' },
        { id: '3', platform: 'twitter', url: 'https://twitter.com' },
        { id: '4', platform: 'spotify', url: 'https://spotify.com' },
      ],
      style: 'icons-only',
      size: 'medium',
      color: '#ffffff',
    },
    editorFields: [
      {
        key: 'links',
        type: 'social-links-editor',
        label: 'Social Profiles',
      },
      {
        key: 'style',
        type: 'select',
        label: 'Display Style',
        options: [
          { label: 'Icons Only (Compact)', value: 'icons-only' },
          { label: 'Icons with Platform Label', value: 'icons-with-label' },
          { label: 'Floating Pills', value: 'pills' },
        ],
      },
      {
        key: 'size',
        type: 'select',
        label: 'Icon Size',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
  },

  'product-grid': {
    type: 'product-grid',
    name: 'Product Showcase / Store',
    icon: 'ShoppingBag',
    description: 'E-commerce cards to sell physical/digital items',
    category: 'commerce',
    schemaVersion: 1,
    defaultConfig: {
      products: [
        {
          id: 'p1',
          title: 'Creator Starter Kit',
          price: '$29.00',
          imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&auto=format&fit=crop&q=80',
          url: 'https://store.example.com/kit',
          badge: 'BESTSELLER',
        },
        {
          id: 'p2',
          title: 'Lightroom Presets Pack',
          price: '$15.00',
          imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
          url: 'https://store.example.com/presets',
        },
      ],
      columns: 2,
      showPrice: true,
    },
    editorFields: [
      {
        key: 'products',
        type: 'product-list-editor',
        label: 'Products',
      },
      {
        key: 'columns',
        type: 'select',
        label: 'Columns Layout',
        options: [
          { label: '1 Column (Full Width)', value: 1 },
          { label: '2 Columns (Grid)', value: 2 },
          { label: '3 Columns (Compact Grid)', value: 3 },
        ],
      },
      {
        key: 'showPrice',
        type: 'toggle',
        label: 'Display Price Badges',
      },
    ],
  },

  'video-embed': {
    type: 'video-embed',
    name: 'Video Player',
    icon: 'PlayCircle',
    description: 'Embed responsive YouTube, Vimeo, or TikTok clips',
    category: 'media',
    schemaVersion: 1,
    defaultConfig: {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      aspectRatio: '16:9',
      autoplay: false,
      title: 'Featured Video',
    },
    editorFields: [
      {
        key: 'videoUrl',
        type: 'url',
        label: 'Video Link (YouTube, Vimeo, TikTok)',
        placeholder: 'https://www.youtube.com/watch?v=...',
      },
      {
        key: 'title',
        type: 'text',
        label: 'Video Header Title (Optional)',
      },
      {
        key: 'aspectRatio',
        type: 'select',
        label: 'Video Ratio',
        options: [
          { label: '16:9 (Standard Widescreen)', value: '16:9' },
          { label: '9:16 (Vertical / Reels / TikTok)', value: '9:16' },
          { label: '1:1 (Square)', value: '1:1' },
        ],
      },
      {
        key: 'autoplay',
        type: 'toggle',
        label: 'Autoplay when in viewport (Muted)',
      },
    ],
  },

  'text-block': {
    type: 'text-block',
    name: 'Text & Announcements',
    icon: 'Type',
    description: 'Formatted announcements, notes, or long-form quotes',
    category: 'core',
    schemaVersion: 1,
    defaultConfig: {
      content: '✨ New workshop dates announced for next month! Early bird tickets are now live below.',
      fontSize: 'medium',
      alignment: 'center',
      color: '#e2e8f0',
    },
    editorFields: [
      {
        key: 'content',
        type: 'rich-text',
        label: 'Text Content',
      },
      {
        key: 'fontSize',
        type: 'select',
        label: 'Font Size',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Extra Large', value: 'xlarge' },
        ],
      },
      {
        key: 'alignment',
        type: 'select',
        label: 'Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      {
        key: 'color',
        type: 'color-picker',
        label: 'Custom Text Color',
      },
    ],
  },

  'image-gallery': {
    type: 'image-gallery',
    name: 'Photo Gallery / Carousel',
    icon: 'Image',
    description: 'Visual showcase for portfolios, photography, or events',
    category: 'media',
    schemaVersion: 1,
    defaultConfig: {
      images: [
        {
          id: 'g1',
          imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
          caption: 'Landscape Collection',
        },
        {
          id: 'g2',
          imageUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=400&auto=format&fit=crop&q=80',
          caption: 'Neon Series',
        },
      ],
      layout: 'grid',
      gap: 'small',
    },
    editorFields: [
      {
        key: 'images',
        type: 'image-gallery-editor',
        label: 'Upload Images',
      },
      {
        key: 'layout',
        type: 'select',
        label: 'Gallery Layout',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Carousel (Swipeable)', value: 'carousel' },
          { label: 'Masonry', value: 'masonry' },
        ],
      },
      {
        key: 'gap',
        type: 'select',
        label: 'Spacing Gap',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Small (8px)', value: 'small' },
          { label: 'Medium (16px)', value: 'medium' },
          { label: 'Large (24px)', value: 'large' },
        ],
      },
    ],
  },

  'email-capture': {
    type: 'email-capture',
    name: 'Newsletter / Email Capture',
    icon: 'Mail',
    description: 'Collect email subscribers directly on your profile',
    category: 'growth',
    schemaVersion: 1,
    defaultConfig: {
      title: 'Join the VIP Newsletter',
      subtitle: 'Get weekly exclusive tips and free templates in your inbox.',
      buttonText: 'Subscribe Free',
      successMessage: '🎉 Welcome to the community! Check your inbox.',
      provider: 'internal',
    },
    editorFields: [
      {
        key: 'title',
        type: 'text',
        label: 'Card Title',
      },
      {
        key: 'subtitle',
        type: 'textarea',
        label: 'Subtitle / Description',
      },
      {
        key: 'buttonText',
        type: 'text',
        label: 'Submit Button Label',
      },
      {
        key: 'successMessage',
        type: 'text',
        label: 'Success Notification Message',
      },
    ],
  },

  'divider': {
    type: 'divider',
    name: 'Divider / Spacer',
    icon: 'Minus',
    description: 'Visual separation line or spacing between blocks',
    category: 'layout',
    schemaVersion: 1,
    defaultConfig: {
      style: 'line',
      color: 'rgba(255, 255, 255, 0.15)',
      spacing: 'medium',
    },
    editorFields: [
      {
        key: 'style',
        type: 'select',
        label: 'Divider Style',
        options: [
          { label: 'Solid Line', value: 'line' },
          { label: 'Dashed Line', value: 'dashed' },
          { label: 'Dotted Line', value: 'dots' },
          { label: 'Blank Space Only', value: 'space' },
        ],
      },
      {
        key: 'color',
        type: 'color-picker',
        label: 'Divider Line Color',
      },
      {
        key: 'spacing',
        type: 'select',
        label: 'Vertical Padding Space',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
  },

  'countdown': {
    type: 'countdown',
    name: 'Countdown Timer',
    icon: 'Clock',
    description: 'Build anticipation for a product drop or event launch',
    category: 'growth',
    schemaVersion: 1,
    defaultConfig: {
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: '🚀 Big Product Drop Goes Live In:',
      expiredText: '🔥 Drop is now LIVE! Click below to shop.',
    },
    editorFields: [
      {
        key: 'title',
        type: 'text',
        label: 'Countdown Header',
      },
      {
        key: 'targetDate',
        type: 'datetime',
        label: 'Target Expiration Date & Time',
      },
      {
        key: 'expiredText',
        type: 'text',
        label: 'Expired Message',
      },
    ],
  },

  'tip-jar': {
    type: 'tip-jar',
    name: 'Tip Jar & Donations',
    icon: 'Heart',
    description: 'Accept tips and donations via UPI or direct payment links',
    category: 'commerce',
    schemaVersion: 1,
    defaultConfig: {
      title: 'Support My Work',
      description: 'If you enjoy my content, buy me a coffee! ☕',
      currency: 'INR',
      presets: [50, 100, 250, 500],
      customAmount: true,
      upiId: '',
      paymentUrl: '',
      thankYouMessage: 'Thank you so much for your generosity! ❤️',
    },
    editorFields: [
      {
        key: 'title',
        type: 'text',
        label: 'Card Title',
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Description / Call to Action',
      },
      {
        key: 'currency',
        type: 'select',
        label: 'Currency',
        options: [
          { label: 'INR (₹)', value: 'INR' },
          { label: 'USD ($)', value: 'USD' },
          { label: 'EUR (€)', value: 'EUR' },
          { label: 'GBP (£)', value: 'GBP' },
        ],
      },
      {
        key: 'upiId',
        type: 'text',
        label: 'UPI ID (For India / GPay / PhonePe)',
        placeholder: 'username@okaxis or phone@paytm',
      },
      {
        key: 'paymentUrl',
        type: 'url',
        label: 'Custom Stripe / Razorpay / PayPal Link (Optional)',
        placeholder: 'https://buy.stripe.com/...',
      },
      {
        key: 'thankYouMessage',
        type: 'text',
        label: 'Thank You Message',
      },
    ],
  },

  'music-embed': {
    type: 'music-embed',
    name: 'Music Player (Spotify / Apple)',
    icon: 'Music',
    description: 'Embed tracks, albums, or playlists with audio preview player',
    category: 'media',
    schemaVersion: 1,
    defaultConfig: {
      platform: 'spotify',
      embedUrl: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      title: 'Featured Track',
      theme: 'dark',
    },
    editorFields: [
      {
        key: 'platform',
        type: 'select',
        label: 'Streaming Platform',
        options: [
          { label: 'Spotify', value: 'spotify' },
          { label: 'Apple Music', value: 'apple-music' },
          { label: 'SoundCloud', value: 'soundcloud' },
        ],
      },
      {
        key: 'embedUrl',
        type: 'url',
        label: 'Track / Album / Playlist Link',
        placeholder: 'https://open.spotify.com/track/...',
      },
      {
        key: 'title',
        type: 'text',
        label: 'Display Title',
      },
    ],
  },

  'faq-accordion': {
    type: 'faq-accordion',
    name: 'FAQ Accordion',
    icon: 'HelpCircle',
    description: 'Interactive collapsible FAQ accordion for questions & answers',
    category: 'core',
    schemaVersion: 1,
    defaultConfig: {
      heading: 'Frequently Asked Questions',
      items: [
        {
          id: 'faq_1',
          question: 'How do I book a 1-on-1 collaboration?',
          answer: 'You can reach out via my email or WhatsApp link above for sponsorships, brand partnerships, or mentorship.',
        },
        {
          id: 'faq_2',
          question: 'Where can I find your free resources?',
          answer: 'Check out the links above for my free starter templates, design kits, and GitHub repositories!',
        },
      ],
    },
    editorFields: [
      {
        key: 'heading',
        type: 'text',
        label: 'Section Heading',
      },
    ],
  },

  'product-card': {
    type: 'product-card',
    name: 'Digital Product Showcase',
    icon: 'ShoppingBag',
    description: 'Sell a digital product, guide, or course with high-converting card',
    category: 'commerce',
    schemaVersion: 1,
    defaultConfig: {
      title: 'Ultimate Creator Notion OS',
      description: 'All-in-one system to manage your content calendar, sponsors, and growth.',
      price: '$29',
      originalPrice: '$59',
      imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80',
      url: 'https://suvix.in',
      badgeText: '50% OFF',
      buttonText: 'Get Instant Access',
    },
    editorFields: [
      {
        key: 'title',
        type: 'text',
        label: 'Product Title',
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Description',
      },
      {
        key: 'price',
        type: 'text',
        label: 'Sale Price',
        placeholder: 'e.g. $29 or ₹499',
      },
      {
        key: 'originalPrice',
        type: 'text',
        label: 'Original Price (Crossed out)',
        placeholder: 'e.g. $59 or ₹999',
      },
      {
        key: 'imageUrl',
        type: 'image-upload',
        label: 'Product Cover Image URL',
      },
      {
        key: 'url',
        type: 'url',
        label: 'Purchase Checkout URL',
      },
      {
        key: 'badgeText',
        type: 'text',
        label: 'Discount / Promo Badge Text',
      },
      {
        key: 'buttonText',
        type: 'text',
        label: 'CTA Button Label',
      },
    ],
  },
};

export function createNewBlock(type: BlockType, order: number, configOverrides?: Record<string, any>): Block {
  const def = BLOCK_REGISTRY[type];
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }

  const baseConfig = JSON.parse(JSON.stringify(def.defaultConfig));
  const finalConfig = configOverrides ? { ...baseConfig, ...configOverrides } : baseConfig;

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    schemaVersion: def.schemaVersion,
    order,
    config: finalConfig,
    isVisible: true,
  };
}
