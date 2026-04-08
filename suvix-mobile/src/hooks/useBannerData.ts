import { useQuery } from '@tanstack/react-query';

const DEFAULT_HOME_BANNERS = [
  {
    _id: 'home_1',
    title: 'Premium Video Editing',
    description: 'Elite editors at your fingertips. Transform your raw footage into cinematic masterpieces.',
    mediaUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    ctaText: 'SEE PORTFOLIO',
    badge: 'ELITE',
  },
  {
    _id: 'home_2',
    title: 'Global Talent Pipeline',
    description: 'Connect with creators from over 50 countries.',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    ctaText: 'DASHBOARD',
    badge: 'GLOBAL',
  },
  {
    _id: 'home_3',
    title: 'Explore the Marketplace',
    description: 'Find your next big project or the perfect editor for your brand.',
    mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    ctaText: 'EXPLORE GIGS',
    badge: 'MARKET',
  },
];

export const useBannerData = () => {
  return useQuery({
    queryKey: ['home-banners-static'],
    queryFn: async () => DEFAULT_HOME_BANNERS,
    staleTime: Infinity,
  });
};
