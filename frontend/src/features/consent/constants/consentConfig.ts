import type { CategoryInfo } from '../types/consent.types';

export const CONSENT_COOKIE_NAME = 'suvix_consent_v1';
export const CURRENT_CONSENT_VERSION = '1.0.0';
export const CONSENT_EXPIRY_DAYS = 180; // 6 months per CNIL / DPDP recommendations
export const CONSENT_SOFT_RENEWAL_DAYS = 150; // 5 months (soft reminder window)

export const CONSENT_CATEGORIES_INFO: CategoryInfo[] = [
  {
    id: 'necessary',
    name: 'Strictly Necessary',
    required: true,
    description:
      'Essential for site security, user authentication, session persistence, escrow payments, and CSRF protection. The platform cannot function without these cookies.',
    examples: [
      'Authentication JWT tokens (auth_token)',
      'Security and CSRF tokens',
      'Payment gateway checkout state (Razorpay / Stripe)',
      'Cookie consent preference persistence',
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Performance',
    required: false,
    description:
      'Helps us understand how creators, editors, and audiences interact with SuviX. Measures video engagement, page performance, and feature usage to improve reliability.',
    examples: [
      'Google Analytics 4 telemetry (page views, session duration)',
      'Creator metrics & portfolio engagement monitoring',
      'Application speed and error diagnostics',
    ],
  },
  {
    id: 'marketing',
    name: 'Advertising & Marketing',
    required: false,
    description:
      'Used by our advertising partners to serve relevant creator opportunities, brand campaigns, and measure sponsorship attribution across external networks.',
    examples: [
      'Google AdSense / DoubleClick DART ad personalization',
      'Meta Pixel conversion tracking for brand campaigns',
      'Third-party promotional attribution tags',
    ],
  },
  {
    id: 'functional',
    name: 'Personalization & Preferences',
    required: false,
    description:
      'Stores your preferences such as language, region, theme (dark/light), workspace layouts, and video player settings.',
    examples: [
      'Dark mode / Light mode theme preference',
      'Video editor workspace layouts and volume presets',
      'Language and localized regional preferences',
    ],
  },
];
