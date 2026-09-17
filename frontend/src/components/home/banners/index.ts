import React from 'react';
import { Banner1, BANNER_1_CONFIG, BANNER_1_DURATION } from './Banner1';
import { Banner2, BANNER_2_CONFIG, BANNER_2_DURATION } from './Banner2';

export interface BannerItem {
  id: string;
  title: string;
  badge?: string;
  duration: number; // Duration in milliseconds this banner is displayed
  thumbnail?: string;
  Component: React.FC<{ isDarkMode: boolean }>;
}

// ─────────────────────────────────────────────────────────────
// Master Registry of All Configured Banners
// Each banner specifies its own duration and layout component.
// ─────────────────────────────────────────────────────────────
export const BANNERS_LIST: BannerItem[] = [
  BANNER_1_CONFIG,
  BANNER_2_CONFIG,
];

export { Banner1, BANNER_1_DURATION, BANNER_1_CONFIG };
export { Banner2, BANNER_2_DURATION, BANNER_2_CONFIG };
export { BannerHost } from './BannerHost';
