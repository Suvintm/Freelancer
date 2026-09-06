import {
  Send,
  User,
  Rocket,
  Building2,
  Sparkles,
  Scissors,
  Crown,
  Briefcase,
  Zap,
} from 'lucide-react';
import type { Plan } from '../../api/services/subscription.service';

export type WorkspaceRole = 'creator' | 'editor' | 'brand' | 'user';

export interface RoleConfig {
  role: WorkspaceRole;
  tabLabel: string;
  badgeLabel: string;
  heroHeadline: string;
  heroSubtitle: string;
  fallbackPlans: PlanCardPresenter[];
}

export interface PlanCardPresenter {
  id: string;
  key: string;
  name: string;
  subtitle: string;
  tierLevel: number;
  priceMonthly: number;
  priceAnnual: number;
  isPopular?: boolean;
  badge?: string;
  buttonText: string;
  icon: any;
  features: string[];
  quotas: { label: string; value: string }[];
}

export interface ComparisonRow {
  featureName: string;
  tier1: string | boolean;
  tier2: string | boolean;
  tier3: string | boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

// ── 1. FALLBACK / CANONICAL PLANS PER ROLE (For Offline / Network Resiliency) ──
export const ROLE_CONFIGS: Record<WorkspaceRole, RoleConfig> = {
  creator: {
    role: 'creator',
    tabLabel: '🎬 Creators',
    badgeLabel: 'CREATOR MONETIZATION & GROWTH',
    heroHeadline: 'Supercharge your creator brand & earnings',
    heroSubtitle: 'Unlock verified badge, 4K media vaults, AI scriptwriters, custom bio themes, and direct brand deals with SuviX.',
    fallbackPlans: [
      {
        id: 'plan_creator_free',
        key: 'creator_free',
        name: 'Creator Starter',
        subtitle: 'Kickstart your creator journey',
        tierLevel: 1,
        priceMonthly: 0,
        priceAnnual: 0,
        buttonText: 'Get Started Free',
        icon: Send,
        features: [
          'Public Creator Profile',
          'Add up to 5 Bio Links',
          'Standard Link-in-Bio Theme',
          'Basic Audience Analytics',
          'Community Access',
        ],
        quotas: [
          { label: 'Active Services / Gigs', value: '3 Active' },
          { label: 'Media Cloud Storage', value: '5 GB' },
          { label: 'AI Script Generations', value: '5 / month' },
          { label: 'Daily Messages', value: '50 / day' },
        ],
      },
      {
        id: 'plan_creator_pro',
        key: 'creator_pro',
        name: 'Creator Pro',
        subtitle: 'For fast-growing content creators',
        tierLevel: 2,
        priceMonthly: 499,
        priceAnnual: 399,
        isPopular: true,
        badge: 'MOST POPULAR',
        buttonText: 'Start Free Trial',
        icon: Rocket,
        features: [
          'Verified Blue Badge on Profile ⭐',
          'Unlimited Bio Links & Blocks',
          'Custom Bio Themes & CSS Styles',
          'Priority AI Script & Caption Generator',
          'Advanced Audience & Link Analytics',
          'Priority Support (24/7)',
        ],
        quotas: [
          { label: 'Active Services / Gigs', value: '15 Active' },
          { label: 'Media Cloud Storage', value: '50 GB' },
          { label: 'AI Script Generations', value: '100 / month' },
          { label: 'Daily Messages', value: '500 / day' },
        ],
      },
      {
        id: 'plan_creator_elite',
        key: 'creator_elite',
        name: 'Creator Elite',
        subtitle: 'Custom domain & agency scale',
        tierLevel: 3,
        priceMonthly: 1499,
        priceAnnual: 1199,
        buttonText: 'Start Free Trial',
        icon: Crown,
        features: [
          'Everything in Creator Pro',
          'Custom Apex Domain (yourname.com)',
          'Brand Deal Sponsorship CRM',
          'VIP Collab Marketplace Priority',
          'Dedicated Creator Success Manager',
          'Early Access to Beta Monetization',
        ],
        quotas: [
          { label: 'Active Services / Gigs', value: '50 Active' },
          { label: 'Media Cloud Storage', value: '500 GB Vault' },
          { label: 'AI Script Generations', value: '1,000 / month' },
          { label: 'Daily Messages', value: 'Unlimited' },
        ],
      },
    ],
  },
  editor: {
    role: 'editor',
    tabLabel: '✂️ Editors & Freelancers',
    badgeLabel: 'FREELANCER & STUDIO REVENUE',
    heroHeadline: 'Keep 100% of your earnings with 0% escrow fee',
    heroSubtitle: 'Win high-paying client contracts, unlock verified editor clout, priority proposal bids, and 1TB video vaults.',
    fallbackPlans: [
      {
        id: 'plan_editor_free',
        key: 'editor_free',
        name: 'Freelancer Basic',
        subtitle: 'Start offering creative services',
        tierLevel: 1,
        priceMonthly: 0,
        priceAnnual: 0,
        buttonText: 'Get Started Free',
        icon: Scissors,
        features: [
          'Public Freelancer Portfolio',
          'Escrow Contract Protection',
          'Client Chat & Reviews',
          'Standard Project Workroom',
        ],
        quotas: [
          { label: 'Platform Escrow Fee', value: '10% Commission' },
          { label: 'Active Service Listings', value: '3 Active' },
          { label: 'Monthly Job Proposals', value: '5 Bids / month' },
          { label: 'Project Storage', value: '10 GB' },
        ],
      },
      {
        id: 'plan_editor_pro',
        key: 'editor_pro',
        name: 'Freelancer Pro',
        subtitle: 'Lower fees & verified editor clout',
        tierLevel: 2,
        priceMonthly: 399,
        priceAnnual: 319,
        isPopular: true,
        badge: 'MOST POPULAR',
        buttonText: 'Start Free Trial',
        icon: Zap,
        features: [
          'Reduced 5% Platform Fee (Save 50%)',
          'Verified Creative Badge ⭐',
          'Priority Job Feed Alerts',
          'Client Contract GST Invoicing',
          'Custom Video Portfolio Embeds',
          'Priority Dispute Resolution',
        ],
        quotas: [
          { label: 'Platform Escrow Fee', value: '5% Commission' },
          { label: 'Active Service Listings', value: '15 Active' },
          { label: 'Monthly Job Proposals', value: '25 Bids / month' },
          { label: 'Project Storage', value: '100 GB' },
        ],
      },
      {
        id: 'plan_editor_studio',
        key: 'editor_studio',
        name: 'Studio Agency',
        subtitle: '0% commission & multi-editor team',
        tierLevel: 3,
        priceMonthly: 1199,
        priceAnnual: 959,
        buttonText: 'Start Free Trial',
        icon: Building2,
        features: [
          '0% Platform Commission on All Escrows 💰',
          'Unlimited Client Job Proposals',
          'Agency Multi-Editor Workspace Seats',
          'Direct Wire & Instant Payouts',
          'White-Label Client Invoices & Contracts',
          'Dedicated Account Manager',
        ],
        quotas: [
          { label: 'Platform Escrow Fee', value: '0% (Keep 100%)' },
          { label: 'Active Service Listings', value: '50 Active' },
          { label: 'Monthly Job Proposals', value: 'Unlimited Bids' },
          { label: 'Project Storage', value: '1 TB Vault' },
        ],
      },
    ],
  },
  brand: {
    role: 'brand',
    tabLabel: '🏢 Brands & Agencies',
    badgeLabel: 'ENTERPRISE HIRING & CAMPAIGNS',
    heroHeadline: 'Discover top creators and run high-ROI campaigns',
    heroSubtitle: 'Source verified creators, manage multi-seat hiring, execute escrow-secured contracts, and access deep audience analytics.',
    fallbackPlans: [
      {
        id: 'plan_brand_free',
        key: 'brand_free',
        name: 'Brand Explorer',
        subtitle: 'Explore creator marketplace',
        tierLevel: 1,
        priceMonthly: 0,
        priceAnnual: 0,
        buttonText: 'Get Started Free',
        icon: Briefcase,
        features: [
          'Browse Verified Creator Catalog',
          'Direct Hire via Escrow Protection',
          'Standard Project Workroom',
          'Automated GST Receipts',
        ],
        quotas: [
          { label: 'Open Campaign Postings', value: '1 Active' },
          { label: 'Creator Discovery Searches', value: '50 / month' },
          { label: 'Workspace Team Seats', value: '1 Seat' },
        ],
      },
      {
        id: 'plan_brand_starter',
        key: 'brand_starter',
        name: 'Brand Starter',
        subtitle: 'For growing brands & studios',
        tierLevel: 2,
        priceMonthly: 999,
        priceAnnual: 799,
        isPopular: true,
        badge: 'MOST POPULAR',
        buttonText: 'Start Free Trial',
        icon: Rocket,
        features: [
          'Verified Brand Badge ⭐',
          'Creator Discovery Search & Filters',
          'Fraud & Fake Engagement Detection AI',
          'Multi-Milestone Escrow Contracts',
          'Campaign Performance Tracking',
          'Priority Support (24/7)',
        ],
        quotas: [
          { label: 'Open Campaign Postings', value: '5 Active' },
          { label: 'Creator Discovery Searches', value: '500 / month' },
          { label: 'Workspace Team Seats', value: '3 Seats' },
        ],
      },
      {
        id: 'plan_brand_scale',
        key: 'brand_scale',
        name: 'Brand Scale',
        subtitle: 'Unlimited campaigns & enterprise CRM',
        tierLevel: 3,
        priceMonthly: 2999,
        priceAnnual: 2399,
        buttonText: 'Contact Sales',
        icon: Building2,
        features: [
          'Unlimited Campaign Postings',
          'Unlimited Creator Discovery Searches',
          'Full Creator Outreach CRM',
          'Bulk Escrow Payouts & Custom Milestones',
          'Custom Legal NDA & Contract Builder',
          'Dedicated Strategic Account Manager',
        ],
        quotas: [
          { label: 'Open Campaign Postings', value: 'Unlimited' },
          { label: 'Creator Discovery Searches', value: 'Unlimited' },
          { label: 'Workspace Team Seats', value: '15 Seats' },
        ],
      },
    ],
  },
  user: {
    role: 'user',
    tabLabel: '👤 Community & Fans',
    badgeLabel: 'COMMUNITY PASS & VIP ACCESS',
    heroHeadline: 'Connect closer with your favorite creators',
    heroSubtitle: 'Enjoy an ad-free experience, verified supporter badge, early access to creator drops, and VIP community chat rooms.',
    fallbackPlans: [
      {
        id: 'plan_user_free',
        key: 'user_free',
        name: 'Community Member',
        subtitle: 'Follow and connect with creators',
        tierLevel: 1,
        priceMonthly: 0,
        priceAnnual: 0,
        buttonText: 'Join Free',
        icon: User,
        features: [
          'Follow Creators & Channels',
          'Public Community Feed & Posts',
          'Direct Messaging',
          'Standard Community Access',
        ],
        quotas: [
          { label: 'Daily Messages', value: '50 / day' },
          { label: 'Follow Limit', value: '200 Creators' },
        ],
      },
      {
        id: 'plan_user_supporter',
        key: 'user_supporter',
        name: 'Supporter Pass',
        subtitle: 'VIP creator clout & ad-free experience',
        tierLevel: 2,
        priceMonthly: 99,
        priceAnnual: 79,
        isPopular: true,
        badge: 'BEST VALUE',
        buttonText: 'Get Supporter Pass',
        icon: Sparkles,
        features: [
          '100% Ad-Free Experience Across SuviX',
          'Exclusive Supporter Badge on Profile ⭐',
          'VIP Community Chat Room Access',
          'Early Access to Creator Drops & Content',
          'Priority Direct Messaging to Creators',
          'Custom Profile Themes & Avatars',
        ],
        quotas: [
          { label: 'Daily Messages', value: '500 / day' },
          { label: 'Follow Limit', value: '1,000 Creators' },
        ],
      },
    ],
  },
};

// ── 2. FEATURE COMPARISON MATRICES PER ROLE ─────────────────────────────────
export const COMPARISON_MATRICES: Record<WorkspaceRole, { headers: string[]; rows: ComparisonRow[] }> = {
  creator: {
    headers: ['Feature / Capability', 'Starter (₹0)', 'Pro (₹499/mo)', 'Elite (₹1499/mo)'],
    rows: [
      { featureName: 'Verified Blue Badge ⭐', tier1: false, tier2: true, tier3: true },
      { featureName: 'Custom Domain (brand.com)', tier1: false, tier2: false, tier3: true },
      { featureName: 'Media Cloud Storage', tier1: '5 GB', tier2: '50 GB', tier3: '500 GB Vault' },
      { featureName: 'AI Script & Idea Generations', tier1: '5 / month', tier2: '100 / month', tier3: '1,000 / month' },
      { featureName: 'Active Gigs & Services', tier1: '3 Listings', tier2: '15 Listings', tier3: '50 Listings' },
      { featureName: 'Link-in-Bio Custom Themes & CSS', tier1: false, tier2: true, tier3: true },
      { featureName: 'Brand Deal & Sponsorship CRM', tier1: false, tier2: false, tier3: true },
      { featureName: 'Dedicated Creator Manager', tier1: false, tier2: false, tier3: true },
      { featureName: 'Priority 24/7 Support', tier1: false, tier2: true, tier3: true },
    ],
  },
  editor: {
    headers: ['Feature / Capability', 'Basic (₹0)', 'Pro (₹399/mo)', 'Studio Agency (₹1199/mo)'],
    rows: [
      { featureName: 'Platform Escrow Fee', tier1: '10% Commission', tier2: '5% (Save 50%)', tier3: '0% (Keep 100%)' },
      { featureName: 'Verified Editor Badge ⭐', tier1: false, tier2: true, tier3: true },
      { featureName: 'Monthly Job Proposal Bids', tier1: '5 Bids', tier2: '25 Bids', tier3: 'Unlimited Bids' },
      { featureName: 'Project Video Vault Storage', tier1: '10 GB', tier2: '100 GB', tier3: '1 TB Vault' },
      { featureName: 'Priority Job Alerts Feed', tier1: false, tier2: true, tier3: true },
      { featureName: 'Client GST Tax Invoices', tier1: false, tier2: true, tier3: true },
      { featureName: 'Multi-Editor Team Seats', tier1: '1 Seat', tier2: '1 Seat', tier3: '5 Seats' },
      { featureName: 'Direct Instant Wire Payouts', tier1: false, tier2: false, tier3: true },
    ],
  },
  brand: {
    headers: ['Feature / Capability', 'Explorer (₹0)', 'Starter (₹999/mo)', 'Scale (₹2999/mo)'],
    rows: [
      { featureName: 'Verified Brand Badge ⭐', tier1: false, tier2: true, tier3: true },
      { featureName: 'Open Campaign Postings', tier1: '1 Active', tier2: '5 Active', tier3: 'Unlimited' },
      { featureName: 'Creator Discovery Searches', tier1: '50 / month', tier2: '500 / month', tier3: 'Unlimited' },
      { featureName: 'Fraud & Fake Follower AI Filter', tier1: false, tier2: true, tier3: true },
      { featureName: 'Team Collaboration Seats', tier1: '1 Seat', tier2: '3 Seats', tier3: '15 Seats' },
      { featureName: 'Custom Legal NDA / Contracts', tier1: false, tier2: false, tier3: true },
      { featureName: 'Dedicated Strategic Account Mgr', tier1: false, tier2: false, tier3: true },
    ],
  },
  user: {
    headers: ['Feature / Capability', 'Member (₹0)', 'Supporter Pass (₹99/mo)', ''],
    rows: [
      { featureName: 'Ad-Free Browsing Experience', tier1: false, tier2: true, tier3: '' },
      { featureName: 'Exclusive Supporter Badge ⭐', tier1: false, tier2: true, tier3: '' },
      { featureName: 'VIP Community Chat Access', tier1: false, tier2: true, tier3: '' },
      { featureName: 'Daily Direct Messaging Limit', tier1: '50 DMs', tier2: '500 DMs', tier3: '' },
      { featureName: 'Early Access to Creator Drops', tier1: false, tier2: true, tier3: '' },
    ],
  },
};

export interface ComparisonRow {
  featureName: string;
  tier1: string | boolean;
  tier2: string | boolean;
  tier3: string | boolean;
  values?: (string | boolean)[];
}

/**
 * Generates dynamic comparison table headers and rows directly from loaded database plans
 */
export function getDynamicComparisonMatrix(
  plans: PlanCardPresenter[],
  role: WorkspaceRole
): { headers: string[]; rows: ComparisonRow[] } {
  const baseMatrix = COMPARISON_MATRICES[role] || COMPARISON_MATRICES.creator;

  if (!plans || plans.length === 0) {
    return baseMatrix;
  }

  // Generate dynamic headers with live DB plan names and prices
  const dynamicHeaders = [
    'Feature / Capability',
    ...plans.map((p) => `${p.name} (₹${p.priceMonthly}/mo)`),
  ];

  const dynamicRows: ComparisonRow[] = [];
  const seenFeatureNames = new Set<string>();

  // 1. DYNAMIC QUOTAS & LIMITS ROWS
  const allQuotaLabels = new Set<string>();
  plans.forEach((p) => {
    p.quotas?.forEach((q) => allQuotaLabels.add(q.label));
  });

  allQuotaLabels.forEach((label) => {
    const values = plans.map((p) => {
      const match = p.quotas?.find((q) => q.label === label);
      return match ? match.value : '-';
    });

    dynamicRows.push({
      featureName: label,
      tier1: values[0] ?? '-',
      tier2: values[1] ?? '-',
      tier3: values[2] ?? (values.length > 2 ? values[2] : ''),
      values,
    });
    seenFeatureNames.add(label.toLowerCase());
  });

  // 2. DYNAMIC FEATURE ENTITLEMENTS (CHECKLIST ROWS)
  const allFeatures = new Set<string>();
  plans.forEach((p) => {
    p.features?.forEach((f) => {
      if (f && typeof f === 'string') {
        allFeatures.add(f.trim());
      }
    });
  });

  allFeatures.forEach((feat) => {
    // Normalize feature name for matching
    const featClean = feat.replace(/[⭐💰✅]/g, '').trim().toLowerCase();
    if (seenFeatureNames.has(featClean)) return;
    seenFeatureNames.add(featClean);

    const values = plans.map((p) => {
      const hasFeature = p.features?.some((pf) => {
        const pfClean = pf.replace(/[⭐💰✅]/g, '').trim().toLowerCase();
        return pfClean.includes(featClean) || featClean.includes(pfClean);
      });
      return Boolean(hasFeature);
    });

    dynamicRows.push({
      featureName: feat,
      tier1: values[0] ?? false,
      tier2: values[1] ?? false,
      tier3: values[2] ?? (values.length > 2 ? values[2] : ''),
      values,
    });
  });

  // If no dynamic rows were created, fall back to canonical rows
  const finalRows = dynamicRows.length > 0 ? dynamicRows : baseMatrix.rows;

  return {
    headers: dynamicHeaders,
    rows: finalRows,
  };
}

// ── 3. ENTERPRISE BILLING & PRORATION FAQS ───────────────────────────────────
export const ENTERPRISE_FAQS: FaqItem[] = [
  {
    question: 'How does second-level mathematical proration work when I upgrade?',
    answer:
      'When you upgrade your tier, SuviX calculates your unused subscription balance down to the exact second. That credit is immediately deducted from your new plan charge. You never pay twice for overlapping time.',
  },
  {
    question: 'Can I pause my subscription if I take a break or go on vacation?',
    answer:
      'Yes! Paid members can freeze their billing for 15, 30, 60, or 90 days from the dashboard. Your portfolio and data remain 100% intact, and you will not be billed while paused.',
  },
  {
    question: 'Are GST tax invoices provided with Indian SAC 998439 breakdown?',
    answer:
      'Yes. Every payment automatically generates a digitally signed vector PDF invoice containing full 18% GST (CGST/SGST/IGST), SAC code 998439, and company billing credentials for seamless tax filing.',
  },
  {
    question: 'What happens if I cancel my subscription plan?',
    answer:
      'If you cancel, you will retain full access to all premium privileges until the end of your prepaid billing period. Your account will automatically transition to the Free tier afterwards without surprise charges.',
  },
  {
    question: 'What payment methods do you support?',
    answer:
      'We support all major Indian and international payment methods including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), NetBanking across 50+ banks, and International Cards via Stripe.',
  },
];

// ── 4. DYNAMIC DATABASE FEATURE FORMATTERS ────────────────────────────────────

/**
 * Human-readable feature name lookup with verified icons/badges
 */
const KNOWN_FEATURE_TITLES: Record<string, string> = {
  verifiedBadge: 'Verified Blue Badge on Profile ⭐',
  verified_badge: 'Verified Blue Badge on Profile ⭐',
  customDomain: 'Custom Apex Domain (yourname.com)',
  custom_domain: 'Custom Apex Domain (yourname.com)',
  analyticsDashboard: 'Advanced Audience & Link Analytics',
  analytics: 'Audience & Traffic Analytics',
  prioritySupport: 'Priority 24/7 Dedicated Support',
  priority_support: 'Priority 24/7 Dedicated Support',
  apiAccess: 'Developer API & Webhooks Access',
  api_access: 'Developer API & Webhooks Access',
  whiteLabel: 'White-Label Invoices & Workspaces',
  white_label: 'White-Label Invoices & Workspaces',
  teamCollaboration: 'Multi-Seat Team Collaboration',
  team_collaboration: 'Multi-Seat Team Collaboration',
  advancedSeo: 'Advanced SEO & Google Search Indexing',
  monetizationTools: 'Direct Monetization & Payout Tools',
  brandDealCrm: 'Brand Deal & Sponsorship CRM',
  brand_deal_crm: 'Brand Deal & Sponsorship CRM',
  customIntegrations: 'Custom Webhook & CRM Integrations',
  adFree: '100% Ad-Free Experience Across SuviX',
  ad_free_browsing: '100% Ad-Free Experience Across SuviX',
  supporterBadge: 'Exclusive Supporter Badge on Profile ⭐',
  supporter_badge: 'Exclusive Supporter Badge on Profile ⭐',
  exclusiveChats: 'VIP Community Chat Room Access',
  exclusive_chats: 'VIP Community Chat Room Access',
  publicProfile: 'Public Creator Profile & Portfolio',
  public_profile: 'Public Creator Profile & Portfolio',
  portfolio: 'Public Freelancer Portfolio',
  escrowProtection: 'Escrow Contract Protection',
  escrow_protection: 'Escrow Contract Protection',
  priorityJobFeed: 'Priority Job Feed Alerts',
  priority_job_feed: 'Priority Job Feed Alerts',
  clientGstInvoicing: 'Client Contract GST Invoicing',
  client_gst_invoicing: 'Client Contract GST Invoicing',
  videoVault1tb: '1 TB High-Speed Video Vault',
  creatorDiscovery: 'Creator Discovery Search & AI Filters',
  creator_discovery: 'Creator Discovery Search & AI Filters',
  fraudDetection: 'Fraud & Fake Engagement Detection AI',
  fraud_detection_analytics: 'Fraud & Fake Engagement Detection AI',
  dedicatedManager: 'Dedicated Creator Success Manager',
  dedicated_manager: 'Dedicated Creator Success Manager',
  dedicated_account_manager: 'Dedicated Strategic Account Manager',
  communityAccess: 'Community Channels & Feed Access',
  community_access: 'Community Channels & Feed Access',
  aiScriptGenerator: 'AI Script & Caption Generator',
  ai_script_generator: 'AI Script & Caption Generator',
};

/**
 * Format any arbitrary feature key/value pair into a human-readable title
 */
function formatFeatureKey(key: string, value: any): string | null {
  if (value === false || value === 0 || value === null || value === undefined) {
    return null;
  }

  // Check direct known dictionary
  if (KNOWN_FEATURE_TITLES[key]) {
    return KNOWN_FEATURE_TITLES[key];
  }

  // Handle specific extra parameter mappings
  if (key === 'bioLinks') {
    return value === -1 ? 'Unlimited Bio Links & Blocks' : `Add up to ${value} Bio Links`;
  }
  if (key === 'theme') {
    return value === 'custom_css' ? 'Custom Bio Themes & CSS Styles' : 'Standard Link-in-Bio Theme';
  }
  if (key === 'escrowFeePercent') {
    return value === 0
      ? '0% Platform Commission on Escrows 💰'
      : value === 5
      ? 'Reduced 5% Platform Fee (Save 50%)'
      : `Standard ${value}% Escrow Fee`;
  }
  if (key === 'apexDomain' && value === true) {
    return 'Custom Apex Domain (yourname.com)';
  }

  // Fallback: Convert camelCase or snake_case to Title Case
  if (value === true || typeof value === 'string' || typeof value === 'number') {
    const formatted = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
    return formatted;
  }

  return null;
}

/**
 * Extract 100% dynamic feature array from DB plan record
 */
export function extractPlanFeatures(plan: Plan | any): string[] {
  if (!plan) return [];

  const featuresList: string[] = [];

  // 1. If backend explicitly returned an array of features
  if (Array.isArray(plan.features)) {
    plan.features.forEach((feat: any) => {
      if (typeof feat === 'string' && feat.trim()) {
        featuresList.push(feat.trim());
      } else if (typeof feat === 'object' && feat !== null) {
        const title = feat.title || feat.name || feat.featureKey || feat.key;
        if (title && (feat.isEnabled !== false)) {
          featuresList.push(KNOWN_FEATURE_TITLES[title] || title);
        }
      }
    });
  } else if (plan.features && typeof plan.features === 'object') {
    // 2. Parse boolean feature flags from DB JSONB
    Object.entries(plan.features).forEach(([key, val]) => {
      if (key === 'extra' && val && typeof val === 'object') {
        Object.entries(val).forEach(([extraKey, extraVal]) => {
          const formatted = formatFeatureKey(extraKey, extraVal);
          if (formatted) featuresList.push(formatted);
        });
      } else {
        const formatted = formatFeatureKey(key, val);
        if (formatted) featuresList.push(formatted);
      }
    });
  }

  // 3. Parse entitlements array if provided
  if (Array.isArray(plan.entitlements)) {
    plan.entitlements.forEach((ent: any) => {
      if (ent.isEnabled) {
        const title = KNOWN_FEATURE_TITLES[ent.featureKey] || formatFeatureKey(ent.featureKey, true);
        if (title && !featuresList.includes(title)) {
          featuresList.push(title);
        }
      }
    });
  }

  // If no dynamic features resolved, return safe defaults
  if (featuresList.length === 0) {
    if (plan.tierLevel === 1) {
      return ['Standard Profile', 'Community Access', 'Direct Messaging'];
    }
    return ['Verified Profile Badge ⭐', 'Priority Support (24/7)', 'Advanced Tools'];
  }

  // Deduplicate while preserving order
  return Array.from(new Set(featuresList));
}

/**
 * Extract 100% dynamic quota pill badges from DB limits JSONB
 */
export function extractPlanQuotas(plan: Plan | any): { label: string; value: string }[] {
  if (!plan) return [];

  // 1. Direct Server-Driven UI pass-through if quotas array is provided from DB
  if (Array.isArray(plan.quotas) && plan.quotas.length > 0) {
    return plan.quotas;
  }

  if (!plan.limits || typeof plan.limits !== 'object') {
    return [];
  }

  const limitsObj = { ...plan.limits, ...(plan.limits.extra || {}) };
  const quotas: { label: string; value: string }[] = [];

  // Helper formatter
  const addQuota = (label: string, val: any, suffix: string = '') => {
    if (val === undefined || val === null) return;
    const valueStr = val === -1 ? 'Unlimited' : `${val}${suffix}`;
    quotas.push({ label, value: valueStr });
  };

  // Quotas for Creators & Freelancers
  if (limitsObj.escrowFeePercent !== undefined) {
    quotas.push({
      label: 'Platform Escrow Fee',
      value: limitsObj.escrowFeePercent === 0 ? '0% (Keep 100%)' : `${limitsObj.escrowFeePercent}% Commission`,
    });
  }

  if (limitsObj.maxProjects !== undefined) {
    addQuota(
      plan.targetRole === 'editor' ? 'Active Service Listings' : 'Active Services / Gigs',
      limitsObj.maxProjects,
      limitsObj.maxProjects === -1 ? '' : ' Active'
    );
  }

  if (limitsObj.maxStorageGb !== undefined) {
    const gb = limitsObj.maxStorageGb;
    const valStr = gb >= 1000 ? `${gb / 1000} TB Vault` : `${gb} GB`;
    quotas.push({
      label: plan.targetRole === 'editor' ? 'Project Video Vault' : 'Media Cloud Storage',
      value: valStr,
    });
  }

  if (limitsObj.maxAiGenerations !== undefined && limitsObj.maxAiGenerations !== 0) {
    addQuota('AI Script Generations', limitsObj.maxAiGenerations, limitsObj.maxAiGenerations === -1 ? '' : ' / month');
  }

  if (limitsObj.maxMonthlyBids !== undefined) {
    addQuota('Monthly Job Proposals', limitsObj.maxMonthlyBids, limitsObj.maxMonthlyBids === -1 ? ' Bids' : ' Bids / month');
  }

  if (limitsObj.maxOpenCampaigns !== undefined) {
    addQuota('Open Campaign Postings', limitsObj.maxOpenCampaigns, limitsObj.maxOpenCampaigns === -1 ? '' : ' Active');
  }

  if (limitsObj.creatorDiscovery !== undefined || limitsObj.creatorDiscoverySearches !== undefined) {
    const searches = limitsObj.creatorDiscoverySearches ?? limitsObj.creatorDiscovery;
    addQuota('Creator Discovery Searches', searches, searches === -1 ? '' : ' / month');
  }

  if (limitsObj.maxTeamMembers !== undefined && limitsObj.maxTeamMembers > 1) {
    addQuota('Workspace Team Seats', limitsObj.maxTeamMembers, limitsObj.maxTeamMembers === 1 ? ' Seat' : ' Seats');
  }

  if (limitsObj.maxDailyMessages !== undefined) {
    addQuota('Daily Messages', limitsObj.maxDailyMessages, limitsObj.maxDailyMessages === -1 ? '' : ' / day');
  }

  return quotas;
}

/**
 * Dynamically map plan icons from DB or role/tier characteristics
 */
const ICON_MAP: Record<string, any> = {
  Send,
  User,
  Rocket,
  Building2,
  Sparkles,
  Scissors,
  Crown,
  Briefcase,
  Zap,
};

export function mapPlanIcon(plan: Plan | any, role: WorkspaceRole): any {
  if (plan.icon && ICON_MAP[plan.icon]) {
    return ICON_MAP[plan.icon];
  }

  const slug = (plan.slug || plan.id || '').toLowerCase();
  const name = (plan.name || '').toLowerCase();
  const tier = plan.tierLevel || 1;

  if (slug.includes('elite') || name.includes('elite') || slug.includes('crown') || tier === 3) {
    return role === 'editor' || role === 'brand' ? Building2 : Crown;
  }
  if (slug.includes('pro') || name.includes('pro') || slug.includes('starter') || tier === 2) {
    return role === 'editor' ? Zap : Rocket;
  }
  if (role === 'editor') return Scissors;
  if (role === 'brand') return Briefcase;
  if (role === 'user') return tier === 2 ? Sparkles : User;
  return Send;
}

/**
 * Converts a database Plan record into a full PlanCardPresenter
 */
export function dynamicPlanToPresenter(
  backendPlan: Plan | any,
  role: WorkspaceRole
): PlanCardPresenter {
  const tierLevel = Number(backendPlan.tierLevel || 1);
  const priceMonthly = Number(backendPlan.priceMonthly ?? 0);
  
  // Calculate dynamic annual monthly-equivalent
  let priceAnnual = priceMonthly;
  if (backendPlan.pricing?.annual?.monthlyEquivalent) {
    priceAnnual = Number(backendPlan.pricing.annual.monthlyEquivalent);
  } else if (backendPlan.priceAnnual && Number(backendPlan.priceAnnual) > 0) {
    priceAnnual = Math.round(Number(backendPlan.priceAnnual) / 12);
  } else if (priceMonthly > 0) {
    priceAnnual = Math.round(priceMonthly * 0.8);
  }

  const isPopular = Boolean(backendPlan.isPopular || backendPlan.is_popular || tierLevel === 2);
  const badge = backendPlan.badge || (isPopular ? 'MOST POPULAR' : tierLevel === 3 ? 'VIP' : undefined);

  let buttonText = 'Start Free Trial';
  if (tierLevel === 1) {
    buttonText = role === 'user' ? 'Join Free' : 'Get Started Free';
  } else if (priceMonthly >= 2500) {
    buttonText = 'Contact Sales';
  }

  const features = extractPlanFeatures(backendPlan);
  const quotas = extractPlanQuotas(backendPlan);
  const icon = mapPlanIcon(backendPlan, role);

  return {
    id: backendPlan.id,
    key: backendPlan.slug || backendPlan.id,
    name: backendPlan.name || (tierLevel === 1 ? 'Starter' : tierLevel === 2 ? 'Pro' : 'Elite'),
    subtitle: backendPlan.description || (tierLevel === 1 ? 'Get started for free' : 'For scaling professionals'),
    tierLevel,
    priceMonthly,
    priceAnnual,
    isPopular,
    badge,
    buttonText,
    icon,
    features,
    quotas,
  };
}

/**
 * ── 5. 100% DYNAMIC BACKEND PLAN NORMALIZER ────────────────────────────────
 * When backend plans are loaded from the database, builds all UI cards dynamically
 * from the database records. Falls back to offline presets only upon network failure.
 */
export function mergeBackendPlansWithPresenter(
  backendPlans: Plan[],
  role: WorkspaceRole
): PlanCardPresenter[] {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.creator;
  const fallbacks = config.fallbackPlans;

  if (!backendPlans || !Array.isArray(backendPlans) || backendPlans.length === 0) {
    return fallbacks;
  }

  const roleLower = (role || 'creator').toLowerCase();

  // Filter backend plans matching role or 'all' safely
  const matchingBackendPlans = backendPlans.filter((p) => {
    if (!p) return false;
    const targetRole = (p.targetRole || '').toLowerCase();
    const planSlug = (p.slug || '').toLowerCase();
    const planName = (p.name || '').toLowerCase();
    const planId = (p.id || '').toLowerCase();

    return (
      targetRole === roleLower ||
      targetRole === 'all' ||
      planSlug.includes(roleLower) ||
      planName.includes(roleLower) ||
      planId.includes(roleLower) ||
      (roleLower === 'creator' && p.tierLevel === 1 && !targetRole)
    );
  });

  if (matchingBackendPlans.length === 0) {
    return fallbacks;
  }

  // Sort matching plans by tierLevel ascending (1 -> 2 -> 3)
  const sortedPlans = [...matchingBackendPlans].sort(
    (a, b) => (a.tierLevel || 1) - (b.tierLevel || 1)
  );

  // Convert EVERY matching database plan into a dynamic presenter card
  return sortedPlans.map((bp) => dynamicPlanToPresenter(bp, role));
}
