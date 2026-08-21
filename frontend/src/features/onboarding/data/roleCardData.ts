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
