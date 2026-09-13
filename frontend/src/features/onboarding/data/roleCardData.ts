export interface RolePresentation {
  id: string;
  name: string;
  slug: string;
  roleGroup: 'PROVIDER' | 'CLIENT';
  headlineTop: string;
  headlineHighlight: string;
  highlightColor: string;
  badgeBg: string;
  badgeIcon: 'video' | 'film' | 'briefcase' | 'users' | 'camera' | 'music' | 'sparkles';
  badgeLabel: string;
  bgImage: string;
  floatingPill?: {
    text: string;
    position?: 'top-right' | 'mid-right' | 'bottom-left' | 'bottom-right';
  };
  statsPill?: {
    leftValue: string;
    leftLabel: string;
    leftType: 'heart' | 'star';
    rightValue: string;
    rightLabel: string;
    rightType: 'play' | 'eye';
  };
  brandLogos?: boolean;
  baseRotateY: number;
  baseRotateX: number;
  baseRotateZ: number;
  description: string;
  perks: string[];
}

export const PRIMARY_ROLE_CARDS: RolePresentation[] = [
  // 1. Content Creator
  {
    id: 'creator',
    name: 'Content Creator',
    slug: 'creator',
    roleGroup: 'PROVIDER',
    headlineTop: 'Turn\nMoments into',
    headlineHighlight: 'Movements',
    highlightColor: 'text-[#ec4899]',
    badgeBg: 'from-[#ec4899] to-[#db2777]',
    badgeIcon: 'video',
    badgeLabel: 'Content Creator',
    bgImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    floatingPill: {
      text: 'Live • Create • Inspire',
      position: 'mid-right',
    },
    statsPill: {
      leftValue: '12.9K',
      leftLabel: 'Followers',
      leftType: 'heart',
      rightValue: '3.4M',
      rightLabel: 'Views',
      rightType: 'play',
    },
    baseRotateY: 6,
    baseRotateX: 2,
    baseRotateZ: -1,
    description: 'Scale your audience, land premium sponsorship deals, and collaborate with top video editors.',
    perks: ['Direct Brand Deal Matching', 'Vetted Video Editor Network', 'YouTube & Instagram API Sync', 'Milestone Escrow Payouts'],
  },

  // 2. Video Editor
  {
    id: 'editor',
    name: 'Video Editor',
    slug: 'editor',
    roleGroup: 'PROVIDER',
    headlineTop: 'Edit\nIdeas into',
    headlineHighlight: 'Impact',
    highlightColor: 'text-[#a855f7]',
    badgeBg: 'from-[#a855f7] to-[#7c3aed]',
    badgeIcon: 'film',
    badgeLabel: 'Video Editor',
    bgImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop',
    floatingPill: {
      text: 'Cut • Create • Polish • Perform',
      position: 'mid-right',
    },
    baseRotateY: 2,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Get hired by top creators and brands for high-converting video edits, VFX, and reels.',
    perks: ['Guaranteed Escrow Payments', 'Direct Creator Retainers', 'Custom Video Reel Showcase', 'Multi-Format Project Hub'],
  },

  // 3. Brand & Sponsor
  {
    id: 'brand',
    name: 'Brand & Sponsor',
    slug: 'brand',
    roleGroup: 'CLIENT',
    headlineTop: 'Partner\nwith Creators',
    headlineHighlight: 'for Real Impact',
    highlightColor: 'text-[#3b82f6]',
    badgeBg: 'from-[#3b82f6] to-[#2563eb]',
    badgeIcon: 'briefcase',
    badgeLabel: 'Brand & Sponsor',
    bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    floatingPill: {
      text: 'BRANDS GROW WITH CREATORS',
      position: 'mid-right',
    },
    brandLogos: true,
    baseRotateY: -2,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Launch high-ROI influencer marketing campaigns with verified creators and performance tracking.',
    perks: ['Verified Creator Discovery', 'Automated Campaign Bidding', 'Real-Time ROI Analytics', 'Escrow Protected Deliverables'],
  },

  // 4. Normal User
  {
    id: 'user',
    name: 'Normal User',
    slug: 'user',
    roleGroup: 'CLIENT',
    headlineTop: 'Discover\nAmazing',
    headlineHighlight: 'Content',
    highlightColor: 'text-[#f97316]',
    badgeBg: 'from-[#f97316] to-[#ea580c]',
    badgeIcon: 'users',
    badgeLabel: 'Normal User',
    bgImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800&auto=format&fit=crop',
    floatingPill: {
      text: '✈️ Explore • Follow • Support • Be a Part',
      position: 'bottom-left',
    },
    baseRotateY: -6,
    baseRotateX: 2,
    baseRotateZ: 1,
    description: 'Explore exclusive creator content, hire talented creatives, and join thriving communities.',
    perks: ['Personalized Content Feed', 'Direct Creator Messaging', '100% Protected Bookings', 'Exclusive Community Perks'],
  },
];

export const ROLE_PRESENTATION_MAP: Record<string, RolePresentation> = {
  creator: PRIMARY_ROLE_CARDS[0],
  yt_influencer: PRIMARY_ROLE_CARDS[0],
  editor: PRIMARY_ROLE_CARDS[1],
  video_editor: PRIMARY_ROLE_CARDS[1],
  brand: PRIMARY_ROLE_CARDS[2],
  social_promoter: PRIMARY_ROLE_CARDS[2],
  user: PRIMARY_ROLE_CARDS[3],
  direct_client: PRIMARY_ROLE_CARDS[3],
  client: PRIMARY_ROLE_CARDS[3],
  photographer: {
    id: 'photographer',
    name: 'Photographer',
    slug: 'photographer',
    roleGroup: 'PROVIDER',
    headlineTop: 'Capture\nStories into',
    headlineHighlight: 'Frames',
    highlightColor: 'text-[#06b6d4]',
    badgeBg: 'from-[#06b6d4] to-[#0284c7]',
    badgeIcon: 'camera',
    badgeLabel: 'Photographer',
    bgImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Studio • Editorial • Commercial', position: 'mid-right' },
    statsPill: { leftValue: '4.9★', leftLabel: 'Rating', leftType: 'star', rightValue: '180+', rightLabel: 'Shoots', rightType: 'eye' },
    baseRotateY: 3,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Showcase visual portfolios, accept direct booking inquiries, and secure commercial licensing.',
    perks: ['Visual Portfolio Gallery', 'Client Booking Calendar', 'Secure Deposit Escrow', 'Commercial Licensing Tools'],
  },
  videographer: {
    id: 'videographer',
    name: 'Videographer',
    slug: 'videographer',
    roleGroup: 'PROVIDER',
    headlineTop: 'Direct\nVision into',
    headlineHighlight: 'Cinema',
    highlightColor: 'text-[#6366f1]',
    badgeBg: 'from-[#6366f1] to-[#4f46e5]',
    badgeIcon: 'film',
    badgeLabel: 'Videographer',
    bgImage: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: '4K Cinema • Production • Direction', position: 'mid-right' },
    baseRotateY: -3,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Accept commercial film projects, collaborate on high-production shoots, and manage client briefs.',
    perks: ['Production Reel Showcase', 'Crew & Gear Collaboration', 'Milestone Escrow Contracts', 'Direct Client Bidding'],
  },
  musician: {
    id: 'musician',
    name: 'Musician & Audio',
    slug: 'musician',
    roleGroup: 'PROVIDER',
    headlineTop: 'Compose\nEmotion into',
    headlineHighlight: 'Melodies',
    highlightColor: 'text-[#f43f5e]',
    badgeBg: 'from-[#f43f5e] to-[#e11d48]',
    badgeIcon: 'music',
    badgeLabel: 'Musician & Audio',
    bgImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Beats • Soundtracks • Audio Design', position: 'mid-right' },
    baseRotateY: 4,
    baseRotateX: 2,
    baseRotateZ: -1,
    description: 'License royalty-free tracks, compose custom audio beats for YouTubers, and produce podcasts.',
    perks: ['Audio Track Licensing', 'Custom Beat Bidding', 'Creator Collaboration', 'Instant Royalty Payouts'],
  },
  actor: {
    id: 'actor',
    name: 'Actor & Talent',
    slug: 'actor',
    roleGroup: 'PROVIDER',
    headlineTop: 'Bring\nCharacters to',
    headlineHighlight: 'Life',
    highlightColor: 'text-[#8b5cf6]',
    badgeBg: 'from-[#8b5cf6] to-[#7c3aed]',
    badgeIcon: 'sparkles',
    badgeLabel: 'Actor & Talent',
    bgImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Casting • Commercials • Voiceover', position: 'mid-right' },
    baseRotateY: -4,
    baseRotateX: 2,
    baseRotateZ: 1,
    description: 'Get cast in commercial ads, digital brand campaigns, UGC promos, and short films.',
    perks: ['Headshot & Reel Profile', 'Verified Casting Calls', 'Direct Director Contact', 'Fast-track Booking'],
  },
  singer: {
    id: 'singer',
    name: 'Singer & Vocalist',
    slug: 'singer',
    roleGroup: 'PROVIDER',
    headlineTop: 'Sing\nMelodies into',
    headlineHighlight: 'Harmony',
    highlightColor: 'text-[#ec4899]',
    badgeBg: 'from-[#ec4899] to-[#be185d]',
    badgeIcon: 'music',
    badgeLabel: 'Singer & Vocalist',
    bgImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Vocals • Live Gigs • Tracks', position: 'mid-right' },
    baseRotateY: 3,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Vocal production, live gigs, and original music releases.',
    perks: ['Vocal Sample Showcase', 'Live Gig Bookings', 'Royalty Splits', 'Studio Collaborations'],
  },
  dancer: {
    id: 'dancer',
    name: 'Dancer & Choreographer',
    slug: 'dancer',
    roleGroup: 'PROVIDER',
    headlineTop: 'Move\nRhythm into',
    headlineHighlight: 'Energy',
    highlightColor: 'text-[#f59e0b]',
    badgeBg: 'from-[#f59e0b] to-[#d97706]',
    badgeIcon: 'sparkles',
    badgeLabel: 'Dancer & Choreographer',
    bgImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Choreography • Viral • Stage', position: 'mid-right' },
    baseRotateY: -3,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Dance choreography, viral trends, and stage performances.',
    perks: ['Viral Campaign Matching', 'Dance Workshop Hub', 'Music Video Bookings', 'Brand Sponsorships'],
  },
  fitness_expert: {
    id: 'fitness_expert',
    name: 'Fitness Coach & Trainer',
    slug: 'fitness_expert',
    roleGroup: 'PROVIDER',
    headlineTop: 'Train\nBody into',
    headlineHighlight: 'Power',
    highlightColor: 'text-[#10b981]',
    badgeBg: 'from-[#10b981] to-[#059669]',
    badgeIcon: 'sparkles',
    badgeLabel: 'Fitness Coach',
    bgImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: '1:1 Coaching • Programs • Nutrition', position: 'mid-right' },
    baseRotateY: 4,
    baseRotateX: 2,
    baseRotateZ: -1,
    description: 'Workout programs, nutrition guides, and 1:1 fitness coaching.',
    perks: ['Custom Training Plans', 'Brand Sponsorships', 'Escrow Bookings', 'Client Progress Hub'],
  },
  rent_service: {
    id: 'rent_service',
    name: 'Rental Studio & Gear',
    slug: 'rent_service',
    roleGroup: 'CLIENT',
    headlineTop: 'Equip\nCreations with',
    headlineHighlight: 'Pro Gear',
    highlightColor: 'text-[#6366f1]',
    badgeBg: 'from-[#6366f1] to-[#4338ca]',
    badgeIcon: 'briefcase',
    badgeLabel: 'Rental Studio & Gear',
    bgImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
    floatingPill: { text: 'Cinema Cameras • Lenses • Studios', position: 'mid-right' },
    baseRotateY: -2,
    baseRotateX: 1,
    baseRotateZ: 0,
    description: 'Rent cinema cameras, studio spaces, and audio gear.',
    perks: ['Verified Rental Protection', 'Instant Availability Calendar', 'Deposit Escrow', 'Flexible Booking'],
  },
};

export interface PopoutWidget {
  title: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  rating?: string;
  badge?: string;
  badgeType?: 'discount' | 'verified' | 'growth' | 'pro' | 'trending';
  ctaText: string;
  accentColor?: string;
  iconType?: 'sparkles' | 'video' | 'calendar' | 'download' | 'briefcase' | 'award' | 'film' | 'music' | 'zap' | 'star';
}

export interface SecondaryPill {
  title: string;
  price?: string;
  iconType: 'calendar' | 'book' | 'shield' | 'check' | 'creditCard' | 'file' | 'camera' | 'music' | 'activity' | 'video';
}

export interface OrbitalBadge {
  label: string;
  iconType: 'calendar' | 'download' | 'courses' | 'shield' | 'camera' | 'music' | 'video' | 'zap' | 'verified';
  position: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' | 'right';
  gradient: string;
}

export interface RoleShowcaseData {
  slug: string;
  creatorName: string;
  handle: string;
  roleTitle: string;
  heroTagline: string;
  themeColor: string; // Tailwind gradient/hex
  accentGlow: string;
  socials: Array<'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'instagram'>;
  mainWidget: PopoutWidget;
  secondaryPills: SecondaryPill[];
  orbitalBadges: OrbitalBadge[];
  bottomActionText: string;
  bottomAmount?: string;
  perks: string[];
}

export const ROLE_SHOWCASE_CONFIG: Record<string, RoleShowcaseData> = {
  // ── 1. YouTube Creator ──
  creator: {
    slug: 'creator',
    creatorName: 'Alex Rivers',
    handle: '@alexrivers',
    roleTitle: 'YouTube Creator',
    heroTagline: 'Scale Your Views & Monetize',
    themeColor: 'from-red-500/20 via-rose-500/10 to-amber-500/20',
    accentGlow: 'rgba(239, 68, 68, 0.25)',
    socials: ['youtube', 'tiktok', 'twitter', 'instagram'],
    mainWidget: {
      title: 'Viral Title & AI SEO Engine',
      subtitle: 'Boost click-through rate & rank #1 on YouTube search algorithms',
      rating: '4.9',
      badge: 'PRO ENGINE',
      badgeType: 'trending',
      ctaText: 'Launch Tools',
      accentColor: 'from-red-600 to-rose-600',
      iconType: 'zap',
    },
    secondaryPills: [
      { title: '1:1 Channel Growth Strategy', price: '$79', iconType: 'calendar' },
      { title: 'Verified Brand Deals Vault', price: 'Instant', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'CALENDAR', iconType: 'calendar', position: 'top-left', gradient: 'from-blue-500 to-indigo-600' },
      { label: 'SYNC', iconType: 'download', position: 'bottom-left', gradient: 'from-amber-400 to-orange-500' },
      { label: 'MONETIZE', iconType: 'courses', position: 'right', gradient: 'from-red-500 to-rose-600' },
    ],
    bottomActionText: 'Sync YouTube Channel',
    bottomAmount: '100% Free',
    perks: ['YouTube API Channel Sync', 'Direct Brand Deal Matching', 'Vetted Video Editor Network', 'Viral Title & SEO Generator'],
  },

  yt_influencer: {
    slug: 'yt_influencer',
    creatorName: 'Alex Rivers',
    handle: '@alexrivers',
    roleTitle: 'YouTube Creator',
    heroTagline: 'Scale Your Views & Monetize',
    themeColor: 'from-red-500/20 via-rose-500/10 to-amber-500/20',
    accentGlow: 'rgba(239, 68, 68, 0.25)',
    socials: ['youtube', 'tiktok', 'twitter', 'instagram'],
    mainWidget: {
      title: 'Viral Title & AI SEO Engine',
      subtitle: 'Boost click-through rate & rank #1 on YouTube search algorithms',
      rating: '4.9',
      badge: 'PRO ENGINE',
      badgeType: 'trending',
      ctaText: 'Launch Tools',
      accentColor: 'from-red-600 to-rose-600',
      iconType: 'zap',
    },
    secondaryPills: [
      { title: '1:1 Channel Growth Strategy', price: '$79', iconType: 'calendar' },
      { title: 'Verified Brand Deals Vault', price: 'Instant', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'CALENDAR', iconType: 'calendar', position: 'top-left', gradient: 'from-blue-500 to-indigo-600' },
      { label: 'SYNC', iconType: 'download', position: 'bottom-left', gradient: 'from-amber-400 to-orange-500' },
      { label: 'MONETIZE', iconType: 'courses', position: 'right', gradient: 'from-red-500 to-rose-600' },
    ],
    bottomActionText: 'Sync YouTube Channel',
    bottomAmount: '100% Free',
    perks: ['YouTube API Channel Sync', 'Direct Brand Deal Matching', 'Vetted Video Editor Network', 'Viral Title & SEO Generator'],
  },

  // ── 2. Video Editor ──
  editor: {
    slug: 'editor',
    creatorName: 'Marcus Vance',
    handle: '@marcusvfx',
    roleTitle: 'Video Editor & VFX Pro',
    heroTagline: 'Edit for Elite YouTube Creators',
    themeColor: 'from-indigo-500/20 via-purple-500/10 to-blue-500/20',
    accentGlow: 'rgba(99, 102, 241, 0.25)',
    socials: ['youtube', 'twitter', 'linkedin', 'instagram'],
    mainWidget: {
      title: '4K Retention Master & VFX Reel',
      subtitle: 'High-energy storytelling, sound design, and custom 3D animations',
      rating: '5.0',
      badge: 'TOP RATED',
      badgeType: 'verified',
      ctaText: 'Hire Editor',
      accentColor: 'from-indigo-600 to-violet-600',
      iconType: 'film',
    },
    secondaryPills: [
      { title: 'Monthly Creator Retainer', price: '$1.4K', iconType: 'file' },
      { title: 'Milestone Escrow Payouts', price: 'Guaranteed', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'REELS', iconType: 'video', position: 'top-left', gradient: 'from-violet-500 to-purple-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-emerald-400 to-teal-500' },
      { label: 'CONTRACTS', iconType: 'courses', position: 'right', gradient: 'from-indigo-500 to-blue-600' },
    ],
    bottomActionText: 'Claim Editor Seat',
    bottomAmount: '$0 Fees',
    perks: ['Direct Creator Contracts', 'Escrow Milestone Protection', 'Portfolio Showcase', 'Project Collaboration Hub'],
  },

  video_editor: {
    slug: 'video_editor',
    creatorName: 'Marcus Vance',
    handle: '@marcusvfx',
    roleTitle: 'Video Editor & VFX Pro',
    heroTagline: 'Edit for Elite YouTube Creators',
    themeColor: 'from-indigo-500/20 via-purple-500/10 to-blue-500/20',
    accentGlow: 'rgba(99, 102, 241, 0.25)',
    socials: ['youtube', 'twitter', 'linkedin', 'instagram'],
    mainWidget: {
      title: '4K Retention Master & VFX Reel',
      subtitle: 'High-energy storytelling, sound design, and custom 3D animations',
      rating: '5.0',
      badge: 'TOP RATED',
      badgeType: 'verified',
      ctaText: 'Hire Editor',
      accentColor: 'from-indigo-600 to-violet-600',
      iconType: 'film',
    },
    secondaryPills: [
      { title: 'Monthly Creator Retainer', price: '$1.4K', iconType: 'file' },
      { title: 'Milestone Escrow Payouts', price: 'Guaranteed', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'REELS', iconType: 'video', position: 'top-left', gradient: 'from-violet-500 to-purple-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-emerald-400 to-teal-500' },
      { label: 'CONTRACTS', iconType: 'courses', position: 'right', gradient: 'from-indigo-500 to-blue-600' },
    ],
    bottomActionText: 'Claim Editor Seat',
    bottomAmount: '$0 Fees',
    perks: ['Direct Creator Contracts', 'Escrow Milestone Protection', 'Portfolio Showcase', 'Project Collaboration Hub'],
  },

  // ── 3. Brand & Sponsor ──
  brand: {
    slug: 'brand',
    creatorName: 'Apex Media Co.',
    handle: '@apexbrand',
    roleTitle: 'Brand & Sponsor',
    heroTagline: 'High-Converting Influencer Ads',
    themeColor: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    socials: ['twitter', 'linkedin', 'instagram'],
    mainWidget: {
      title: 'Influencer Campaign Bidding Hub',
      subtitle: 'Connect with verified creators with 50M+ combined targeted reach',
      rating: '4.8',
      badge: 'ENTERPRISE',
      badgeType: 'pro',
      ctaText: 'Launch Campaign',
      accentColor: 'from-amber-500 to-orange-600',
      iconType: 'briefcase',
    },
    secondaryPills: [
      { title: 'Real-Time ROI & Conversion Track', price: 'Live', iconType: 'activity' },
      { title: 'Automated Creator Contracts', price: 'Protected', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'ANALYTICS', iconType: 'zap', position: 'top-left', gradient: 'from-amber-500 to-orange-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-blue-500 to-indigo-600' },
      { label: 'CAMPAIGNS', iconType: 'courses', position: 'right', gradient: 'from-rose-500 to-amber-500' },
    ],
    bottomActionText: 'Start Brand Workspace',
    bottomAmount: 'Verified',
    perks: ['Verified Creator Marketplace', 'Custom Campaign Bidding', 'Automated Escrow Contracts', 'Real-time Conversion Analytics'],
  },

  social_promoter: {
    slug: 'social_promoter',
    creatorName: 'Apex Media Co.',
    handle: '@apexbrand',
    roleTitle: 'Brand & Sponsor',
    heroTagline: 'High-Converting Influencer Ads',
    themeColor: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    socials: ['twitter', 'linkedin', 'instagram'],
    mainWidget: {
      title: 'Influencer Campaign Bidding Hub',
      subtitle: 'Connect with verified creators with 50M+ combined targeted reach',
      rating: '4.8',
      badge: 'ENTERPRISE',
      badgeType: 'pro',
      ctaText: 'Launch Campaign',
      accentColor: 'from-amber-500 to-orange-600',
      iconType: 'briefcase',
    },
    secondaryPills: [
      { title: 'Real-Time ROI & Conversion Track', price: 'Live', iconType: 'activity' },
      { title: 'Automated Creator Contracts', price: 'Protected', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'ANALYTICS', iconType: 'zap', position: 'top-left', gradient: 'from-amber-500 to-orange-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-blue-500 to-indigo-600' },
      { label: 'CAMPAIGNS', iconType: 'courses', position: 'right', gradient: 'from-rose-500 to-amber-500' },
    ],
    bottomActionText: 'Start Brand Workspace',
    bottomAmount: 'Verified',
    perks: ['Verified Creator Marketplace', 'Custom Campaign Bidding', 'Automated Escrow Contracts', 'Real-time Conversion Analytics'],
  },

  // ── 4. Client / Hirer ──
  user: {
    slug: 'user',
    creatorName: 'Elena Rostova',
    handle: '@elenaclient',
    roleTitle: 'Client & Hirer',
    heroTagline: 'Hire Top Vetted Creatives',
    themeColor: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    socials: ['linkedin', 'twitter', 'instagram'],
    mainWidget: {
      title: 'Custom Creative Project Hub',
      subtitle: 'Post projects, receive instant bids from verified professionals worldwide',
      rating: '4.9',
      badge: 'VETTED NETWORK',
      badgeType: 'verified',
      ctaText: 'Post a Job',
      accentColor: 'from-emerald-600 to-teal-600',
      iconType: 'briefcase',
    },
    secondaryPills: [
      { title: '10,000+ Verified Portfolios', price: 'Free Search', iconType: 'book' },
      { title: '100% Milestone Money-Back', price: 'Protected', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'TALENT', iconType: 'star' as unknown as 'zap', position: 'top-left', gradient: 'from-teal-500 to-emerald-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-cyan-400 to-blue-500' },
      { label: 'PROJECTS', iconType: 'courses', position: 'right', gradient: 'from-emerald-500 to-teal-600' },
    ],
    bottomActionText: 'Create Client Account',
    bottomAmount: 'Free',
    perks: ['10,000+ Vetted Creatives', 'Milestone-based Payments', 'Fast Turnaround Delivery', '24/7 Dedicated Support'],
  },

  direct_client: {
    slug: 'direct_client',
    creatorName: 'Elena Rostova',
    handle: '@elenaclient',
    roleTitle: 'Client & Hirer',
    heroTagline: 'Hire Top Vetted Creatives',
    themeColor: 'from-emerald-500/20 via-teal-500/10 to-cyan-500/20',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    socials: ['linkedin', 'twitter', 'instagram'],
    mainWidget: {
      title: 'Custom Creative Project Hub',
      subtitle: 'Post projects, receive instant bids from verified professionals worldwide',
      rating: '4.9',
      badge: 'VETTED NETWORK',
      badgeType: 'verified',
      ctaText: 'Post a Job',
      accentColor: 'from-emerald-600 to-teal-600',
      iconType: 'briefcase',
    },
    secondaryPills: [
      { title: '10,000+ Verified Portfolios', price: 'Free Search', iconType: 'book' },
      { title: '100% Milestone Money-Back', price: 'Protected', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'TALENT', iconType: 'zap', position: 'top-left', gradient: 'from-teal-500 to-emerald-600' },
      { label: 'ESCROW', iconType: 'shield', position: 'bottom-left', gradient: 'from-cyan-400 to-blue-500' },
      { label: 'PROJECTS', iconType: 'courses', position: 'right', gradient: 'from-emerald-500 to-teal-600' },
    ],
    bottomActionText: 'Create Client Account',
    bottomAmount: 'Free',
    perks: ['10,000+ Vetted Creatives', 'Milestone-based Payments', 'Fast Turnaround Delivery', '24/7 Dedicated Support'],
  },

  // ── 5. Photographer ──
  photographer: {
    slug: 'photographer',
    creatorName: 'Liam Thorne',
    handle: '@liamthorne.raw',
    roleTitle: 'Commercial Photographer',
    heroTagline: 'High-Impact Visual Portfolios',
    themeColor: 'from-cyan-500/20 via-blue-500/10 to-sky-500/20',
    accentGlow: 'rgba(6, 182, 212, 0.25)',
    socials: ['instagram', 'twitter', 'linkedin'],
    mainWidget: {
      title: 'Commercial Shoot Booking',
      subtitle: 'Full day commercial studio or on-location editorial visual shoot',
      rating: '4.9',
      badge: 'AVAILABLE',
      badgeType: 'verified',
      ctaText: 'Book Shoot',
      accentColor: 'from-cyan-600 to-blue-600',
      iconType: 'camera' as unknown as 'film',
    },
    secondaryPills: [
      { title: 'Full Commercial Image Rights', price: 'Included', iconType: 'file' },
      { title: 'Deposit Security Escrow', price: '100%', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'PORTFOLIO', iconType: 'camera', position: 'top-left', gradient: 'from-cyan-500 to-blue-600' },
      { label: 'DATES', iconType: 'calendar', position: 'bottom-left', gradient: 'from-blue-400 to-indigo-500' },
      { label: 'SHOOTS', iconType: 'courses', position: 'right', gradient: 'from-sky-500 to-cyan-600' },
    ],
    bottomActionText: 'Join as Photographer',
    bottomAmount: 'Verified',
    perks: ['Visual Portfolio Gallery', 'Client Booking Calendar', 'Secure Deposit Protection', 'Commercial Licensing Tools'],
  },

  // ── 6. Videographer ──
  videographer: {
    slug: 'videographer',
    creatorName: 'Kai Tanaka',
    handle: '@kaicinema',
    roleTitle: 'Cinematographer & DP',
    heroTagline: '4K Films & Commercials',
    themeColor: 'from-blue-500/20 via-indigo-500/10 to-purple-500/20',
    accentGlow: 'rgba(59, 130, 246, 0.25)',
    socials: ['youtube', 'instagram', 'twitter'],
    mainWidget: {
      title: 'Full Production Day Shoot',
      subtitle: 'RED/Arri 4K cinematography, lighting package, and on-set direction',
      rating: '5.0',
      badge: 'CINEMA PRO',
      badgeType: 'pro',
      ctaText: 'Book Crew',
      accentColor: 'from-blue-600 to-indigo-600',
      iconType: 'film',
    },
    secondaryPills: [
      { title: '4K ProRes Master Deliverables', price: '$850', iconType: 'file' },
      { title: 'Crew & Gear Insurance', price: 'Verified', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'CINEMA', iconType: 'video', position: 'top-left', gradient: 'from-blue-500 to-indigo-600' },
      { label: 'EQUIPMENT', iconType: 'camera', position: 'bottom-left', gradient: 'from-purple-400 to-indigo-500' },
      { label: 'REELS', iconType: 'courses', position: 'right', gradient: 'from-indigo-600 to-purple-600' },
    ],
    bottomActionText: 'Join as Videographer',
    bottomAmount: 'Verified',
    perks: ['Production Reel Showcase', 'Crew & Gear Collaboration', 'Milestone Escrow Contracts', 'Direct Client Bidding'],
  },

  // ── 7. Musician / Audio Producer ──
  musician: {
    slug: 'musician',
    creatorName: 'Maya Cruz',
    handle: '@mayacruzaudio',
    roleTitle: 'Music Producer & Composer',
    heroTagline: 'Soundtracks, Beats & Jingles',
    themeColor: 'from-pink-500/20 via-rose-500/10 to-fuchsia-500/20',
    accentGlow: 'rgba(236, 72, 153, 0.25)',
    socials: ['youtube', 'tiktok', 'instagram', 'twitter'],
    mainWidget: {
      title: 'Royalty-Free Audio Beats',
      subtitle: 'Exclusive creator license for YouTube videos, podcasts & ads',
      rating: '4.8',
      price: '$49',
      badge: 'ORIGINAL',
      badgeType: 'trending',
      ctaText: 'Get License',
      accentColor: 'from-pink-600 to-rose-600',
      iconType: 'music',
    },
    secondaryPills: [
      { title: 'Custom Track Composition', price: '$220', iconType: 'music' },
      { title: 'Full Commercial Master Rights', price: 'Included', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'BEATS', iconType: 'music', position: 'top-left', gradient: 'from-pink-500 to-rose-600' },
      { label: 'AUDIO', iconType: 'download', position: 'bottom-left', gradient: 'from-fuchsia-400 to-pink-500' },
      { label: 'TRACKS', iconType: 'courses', position: 'right', gradient: 'from-rose-500 to-pink-600' },
    ],
    bottomActionText: 'Join as Musician',
    bottomAmount: 'Instant',
    perks: ['Audio Track Licensing', 'Custom Beat Bidding', 'Creator Collaboration', 'Royalty Management'],
  },

  // ── 8. Actor ──
  actor: {
    slug: 'actor',
    creatorName: 'Julian Sterling',
    handle: '@julianactor',
    roleTitle: 'Screen & Voice Talent',
    heroTagline: 'Commercials, Series & Digital Ads',
    themeColor: 'from-violet-500/20 via-purple-500/10 to-indigo-500/20',
    accentGlow: 'rgba(139, 92, 246, 0.25)',
    socials: ['instagram', 'tiktok', 'twitter'],
    mainWidget: {
      title: 'Commercial Spot & Ad Booking',
      subtitle: 'High-converting UGC ads, brand video commercials & character roles',
      rating: '4.9',
      badge: 'CASTING READY',
      badgeType: 'verified',
      ctaText: 'Book Audition',
      accentColor: 'from-violet-600 to-purple-600',
      iconType: 'film',
    },
    secondaryPills: [
      { title: 'Voiceover & Dubbing Session', price: '$90/hr', iconType: 'file' },
      { title: 'Direct Director Contact', price: 'Instant', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'REELS', iconType: 'video', position: 'top-left', gradient: 'from-violet-500 to-purple-600' },
      { label: 'CASTING', iconType: 'calendar', position: 'bottom-left', gradient: 'from-indigo-400 to-violet-500' },
      { label: 'ACTING', iconType: 'courses', position: 'right', gradient: 'from-purple-500 to-indigo-600' },
    ],
    bottomActionText: 'Join as Screen Talent',
    bottomAmount: 'Active',
    perks: ['Headshot & Reel Profile', 'Verified Casting Calls', 'Direct Director Contact', 'Fast-track Booking'],
  },

  // ── 9. Singer ──
  singer: {
    slug: 'singer',
    creatorName: 'Chloe Belle',
    handle: '@chloebelle_voice',
    roleTitle: 'Vocal Artist & Singer',
    heroTagline: 'Vocals for Brands & Producers',
    themeColor: 'from-fuchsia-500/20 via-pink-500/10 to-rose-500/20',
    accentGlow: 'rgba(217, 70, 239, 0.25)',
    socials: ['youtube', 'tiktok', 'instagram'],
    mainWidget: {
      title: 'Custom Vocal Track & Topline',
      subtitle: 'Professional lead vocals, harmonies, and commercial jingles',
      rating: '4.9',
      price: '$120',
      badge: 'TOP VOCAL',
      badgeType: 'trending',
      ctaText: 'Order Vocals',
      accentColor: 'from-fuchsia-600 to-pink-600',
      iconType: 'music',
    },
    secondaryPills: [
      { title: 'Live Studio Session (Remote)', price: '$80/hr', iconType: 'calendar' },
      { title: 'Commercial Release Rights', price: 'Verified', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'VOCALS', iconType: 'music', position: 'top-left', gradient: 'from-fuchsia-500 to-pink-600' },
      { label: 'AUDIO', iconType: 'download', position: 'bottom-left', gradient: 'from-pink-400 to-rose-500' },
      { label: 'STUDIO', iconType: 'courses', position: 'right', gradient: 'from-fuchsia-600 to-purple-600' },
    ],
    bottomActionText: 'Join as Vocalist',
    bottomAmount: 'Instant',
    perks: ['Vocal Sample Showcase', 'Commercial Voice Bids', 'Studio Session Bookings', 'Escrow Payments'],
  },

  // ── 10. Dancer ──
  dancer: {
    slug: 'dancer',
    creatorName: 'Zoe Martinez',
    handle: '@zoedancefit',
    roleTitle: 'Choreographer & Dancer',
    heroTagline: 'Music Videos & Viral Trends',
    themeColor: 'from-amber-500/20 via-red-500/10 to-orange-500/20',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    socials: ['tiktok', 'instagram', 'youtube'],
    mainWidget: {
      title: 'Viral Dance Choreography',
      subtitle: 'Custom choreography for TikTok music campaigns & live stages',
      rating: '5.0',
      badge: 'VIRAL CREATOR',
      badgeType: 'trending',
      ctaText: 'Book Dance',
      accentColor: 'from-orange-500 to-amber-600',
      iconType: 'zap',
    },
    secondaryPills: [
      { title: 'Music Video Shoot Appearance', price: '$350', iconType: 'video' },
      { title: 'Instant Deposit Protection', price: '100%', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'CHOREO', iconType: 'video', position: 'top-left', gradient: 'from-orange-500 to-amber-600' },
      { label: 'TRENDS', iconType: 'zap', position: 'bottom-left', gradient: 'from-red-400 to-orange-500' },
      { label: 'STAGE', iconType: 'courses', position: 'right', gradient: 'from-amber-500 to-yellow-600' },
    ],
    bottomActionText: 'Join as Dancer',
    bottomAmount: 'Active',
    perks: ['Choreography Reels', 'Viral Campaign Auditions', 'Direct Booking Flow', 'Instant Deposits'],
  },

  // ── 11. Fitness Expert ──
  fitness_expert: {
    slug: 'fitness_expert',
    creatorName: 'Jason Cole',
    handle: '@jasoncolefit',
    roleTitle: 'Fitness Coach & Athlete',
    heroTagline: 'Online Coaching & Nutrition',
    themeColor: 'from-emerald-500/20 via-green-500/10 to-teal-500/20',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    socials: ['youtube', 'instagram', 'tiktok'],
    mainWidget: {
      title: 'Custom 90-Day Transformation',
      subtitle: 'Weekly workout plans, custom nutrition macros & 1:1 check-ins',
      rating: '4.9',
      price: '$99/mo',
      badge: 'COACHING',
      badgeType: 'growth',
      ctaText: 'Start Program',
      accentColor: 'from-emerald-600 to-green-600',
      iconType: 'activity' as unknown as 'zap',
    },
    secondaryPills: [
      { title: '1:1 Live Nutrition Consultation', price: '$60', iconType: 'calendar' },
      { title: 'Brand Sponsorship Ready', price: 'Verified', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'COACH', iconType: 'zap', position: 'top-left', gradient: 'from-emerald-500 to-green-600' },
      { label: 'PLANS', iconType: 'download', position: 'bottom-left', gradient: 'from-teal-400 to-emerald-500' },
      { label: 'FITNESS', iconType: 'courses', position: 'right', gradient: 'from-green-500 to-teal-600' },
    ],
    bottomActionText: 'Join as Fitness Coach',
    bottomAmount: 'Instant',
    perks: ['Coaching Client Manager', 'Brand Sponsorship Hub', 'Custom Program Delivery', 'Direct Subscription Pay'],
  },

  // ── 12. Equipment Rentals & Services ──
  rent_service: {
    slug: 'rent_service',
    creatorName: 'StudioGrid Rentals',
    handle: '@studiogrid',
    roleTitle: 'Equipment & Space Rental',
    heroTagline: 'Cinema Gear & Soundstages',
    themeColor: 'from-yellow-500/20 via-amber-500/10 to-orange-500/20',
    accentGlow: 'rgba(234, 179, 8, 0.25)',
    socials: ['instagram', 'twitter', 'linkedin'],
    mainWidget: {
      title: 'Cinema Gear Package Rental',
      subtitle: 'Sony FX6 / FX3, GM lenses, wireless audio & Aputure lighting kit',
      rating: '4.9',
      price: '$180/day',
      badge: 'INSURED GEAR',
      badgeType: 'verified',
      ctaText: 'Reserve Gear',
      accentColor: 'from-amber-600 to-yellow-600',
      iconType: 'camera' as unknown as 'film',
    },
    secondaryPills: [
      { title: 'Soundstage / Cyclorama Space', price: '$400/day', iconType: 'calendar' },
      { title: 'Zero-Liability Insurance Policy', price: 'Protected', iconType: 'shield' },
    ],
    orbitalBadges: [
      { label: 'EQUIPMENT', iconType: 'camera', position: 'top-left', gradient: 'from-amber-500 to-yellow-600' },
      { label: 'DATES', iconType: 'calendar', position: 'bottom-left', gradient: 'from-orange-400 to-amber-500' },
      { label: 'RENTALS', iconType: 'courses', position: 'right', gradient: 'from-yellow-500 to-orange-600' },
    ],
    bottomActionText: 'List Gear / Space',
    bottomAmount: 'Insured',
    perks: ['Gear Inventory Manager', 'Deposit Security & Insurance', 'Instant Booking Requests', 'Verified Renter IDs'],
  },
};

export const DEFAULT_ROLE_SHOWCASE: RoleShowcaseData = {
  slug: 'default',
  creatorName: 'Creative Professional',
  handle: '@creativepro',
  roleTitle: 'Creative Professional',
  heroTagline: 'Monetize Talent & Connect',
  themeColor: 'from-zinc-500/20 via-zinc-400/10 to-zinc-600/20',
  accentGlow: 'rgba(113, 113, 122, 0.25)',
  socials: ['youtube', 'twitter', 'instagram', 'linkedin'],
  mainWidget: {
    title: 'Professional Service Hub',
    subtitle: 'Deliver bespoke projects and receive guaranteed escrow payouts',
    rating: '4.9',
    badge: 'VERIFIED',
    badgeType: 'verified',
    ctaText: 'Get Started',
    accentColor: 'from-zinc-800 to-zinc-950',
    iconType: 'sparkles',
  },
  secondaryPills: [
    { title: 'Direct Client Collaboration', price: 'Instant', iconType: 'file' },
    { title: 'Escrow Payment Protection', price: '100%', iconType: 'shield' },
  ],
  orbitalBadges: [
    { label: 'PORTFOLIO', iconType: 'camera', position: 'top-left', gradient: 'from-zinc-600 to-zinc-800' },
    { label: 'SYNC', iconType: 'download', position: 'bottom-left', gradient: 'from-zinc-500 to-zinc-700' },
    { label: 'PRO', iconType: 'courses', position: 'right', gradient: 'from-zinc-700 to-black' },
  ],
  bottomActionText: 'Get Started',
  bottomAmount: 'Free',
  perks: ['Verified Identity Badge', 'Direct Client Bidding', 'Escrow Payment Protection', '24/7 Priority Support'],
};
