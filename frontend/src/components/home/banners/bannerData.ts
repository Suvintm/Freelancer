import React from 'react';
import { BannerLinkInBio } from './HomeBanners';

export interface BannerItem {
  id: string;
  title: string;
  badge: string;
  thumbnail: string;
  Component: React.FC<{ isDarkMode: boolean }>;
}

// ─────────────────────────────────────────────────────────────
// Master Banner Items Registry
// ─────────────────────────────────────────────────────────────
export const HOME_BANNER_ITEMS: BannerItem[] = [
  {
    id: 'banner-link-in-bio',
    title: 'Link in Bio Studio',
    badge: 'New Feature',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600',
    Component: BannerLinkInBio,
  },
];
