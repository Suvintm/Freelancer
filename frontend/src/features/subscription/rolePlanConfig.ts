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

// ── 1. FALLBACK / CANONICAL PLANS PER ROLE (Matches V9 DB Seeds) ────────────
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

// ── 4. DYNAMIC BACKEND PLAN NORMALIZER ──────────────────────────────────────
export function mergeBackendPlansWithPresenter(
  backendPlans: Plan[],
  role: WorkspaceRole
): PlanCardPresenter[] {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.creator;
  const fallbacks = config.fallbackPlans;

  if (!backendPlans || !Array.isArray(backendPlans) || backendPlans.length === 0) {
    return fallbacks;
  }

  // Filter backend plans matching role or 'all' safely
  const matchingBackendPlans = backendPlans.filter((p) => {
    if (!p) return false;
    const targetRole = p.targetRole ? p.targetRole.toLowerCase() : '';
    const planSlug = p.slug ? p.slug.toLowerCase() : '';
    const planName = p.name ? p.name.toLowerCase() : '';
    const planId = p.id ? p.id.toLowerCase() : '';
    const roleLower = (role || 'creator').toLowerCase();

    return (
      targetRole === roleLower ||
      targetRole === 'all' ||
      planSlug.includes(roleLower) ||
      planName.includes(roleLower) ||
      planId.includes(roleLower) ||
      (roleLower === 'creator' && p.tierLevel === 1)
    );
  });

  if (matchingBackendPlans.length === 0) {
    return fallbacks;
  }

  return fallbacks.map((fb) => {
    // Find matching backend plan by tierLevel, id, slug, or name safely
    const matchedBackend = matchingBackendPlans.find((bp) => {
      if (!bp) return false;
      const bpSlug = bp.slug ? bp.slug.toLowerCase() : '';
      const bpId = bp.id ? bp.id.toLowerCase() : '';
      const bpName = bp.name ? bp.name.toLowerCase() : '';
      const fbKey = (fb.key || '').toLowerCase();
      const fbId = (fb.id || '').toLowerCase();
      const fbName = (fb.name || '').toLowerCase();

      return (
        bp.tierLevel === fb.tierLevel ||
        (fbKey && bpSlug.includes(fbKey)) ||
        (fbId && bpId === fbId) ||
        (fbName && bpName.includes(fbName))
      );
    });

    if (!matchedBackend) {
      return fb;
    }

    // Extract dynamic features & quotas from backend if present
    const dynamicQuotas = [...fb.quotas];
    if (matchedBackend.limits && typeof matchedBackend.limits === 'object') {
      Object.entries(matchedBackend.limits).forEach(([limKey, val]) => {
        const readableKey = limKey.replace(/_/g, ' ').replace('max ', '');
        const readableVal = val === -1 ? 'Unlimited' : String(val);
        const existingIdx = dynamicQuotas.findIndex((q) =>
          q.label.toLowerCase().includes(readableKey.toLowerCase())
        );
        if (existingIdx !== -1) {
          dynamicQuotas[existingIdx] = {
            ...dynamicQuotas[existingIdx],
            value: readableVal,
          };
        }
      });
    }

    return {
      ...fb,
      id: matchedBackend.id || fb.id,
      name: matchedBackend.name || fb.name,
      priceMonthly: matchedBackend.priceMonthly ?? fb.priceMonthly,
      priceAnnual: matchedBackend.priceAnnual
        ? Math.round(matchedBackend.priceAnnual / 12)
        : fb.priceAnnual,
      isPopular: fb.isPopular || matchedBackend.isPopular,
      quotas: dynamicQuotas,
    };
  });
}
