import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Crown,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Megaphone,
  Building2,
  UserCheck,
  Users,
  TrendingUp,
  Layers,
  ArrowRight,
  Lock,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import subscriptionBg from '../../assets/subscriptionbg.png';
import cardBg from '../../assets/cardbg.png';
import { subscriptionService, type Plan } from '../../api/services/subscription.service';
import {
  mergeBackendPlansWithPresenter,
  type WorkspaceRole,
} from '../../features/subscription/rolePlanConfig';

interface WelcomePricingSectionProps {
  className?: string;
}

interface RoleTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  workspaceRole: WorkspaceRole;
}

const ALL_ROLES: RoleTab[] = [
  { id: 'creator', label: 'Creators', icon: Megaphone, workspaceRole: 'creator' },
  { id: 'brand', label: 'Brands', icon: Building2, workspaceRole: 'brand' },
  { id: 'editor', label: 'Editors', icon: Scissors, workspaceRole: 'editor' },
  { id: 'user', label: 'Audience', icon: UserCheck, workspaceRole: 'user' },
];

interface BulletPoint {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  text: string;
}

interface RoleIntroContent {
  tag: string;
  scriptTag: string;
  title: string;
  subtitle: string;
  proof: string;
  bullets: BulletPoint[];
  footerTag: string;
}

const ROLE_INTRO_DATA: Record<WorkspaceRole, RoleIntroContent> = {
  creator: {
    tag: 'FOR CREATORS',
    scriptTag: 'Ideas\nCreators\nImpact',
    title: 'Turn Your Passion Into Opportunities',
    subtitle: 'Everything you need to create, share, and grow — all in one place.',
    proof: 'Creators worldwide are growing with SuviX',
    bullets: [
      { icon: Users, text: 'Build your presence' },
      { icon: TrendingUp, text: 'Grow your audience' },
      { icon: Layers, text: 'Monetize your content' },
    ],
    footerTag: 'CREATE  •  SHARE  •  GROW',
  },
  brand: {
    tag: 'FOR BRANDS',
    scriptTag: 'Reach\nEngage\nConvert',
    title: 'Scale Your Brand With Top Creators',
    subtitle: 'Discover verified creators, launch high-ROI campaigns, and manage sponsorships seamlessly.',
    proof: '5,000+ brands partnering on SuviX',
    bullets: [
      { icon: Users, text: 'Direct creator discovery' },
      { icon: TrendingUp, text: 'Audience & fraud analytics' },
      { icon: Layers, text: 'Escrow-protected contracts' },
    ],
    footerTag: 'DISCOVER  •  LAUNCH  •  SCALE',
  },
  editor: {
    tag: 'FOR EDITORS',
    scriptTag: 'Craft\nDeliver\nEarn',
    title: 'Land High-Paying Client Contracts',
    subtitle: 'Keep 100% of your earnings with 0% escrow fee, priority job bids, and verified clout.',
    proof: '50,000+ editors creating on SuviX',
    bullets: [
      { icon: Users, text: '0% commission on contracts' },
      { icon: TrendingUp, text: 'Priority job feed & bids' },
      { icon: Layers, text: '1TB cloud video vaults' },
    ],
    footerTag: 'EDIT  •  DELIVER  •  SUCCEED',
  },
  user: {
    tag: 'FOR AUDIENCE',
    scriptTag: 'Watch\nConnect\nBelong',
    title: 'Connect With Your Favorite Creators',
    subtitle: 'Enjoy ad-free streaming, exclusive community chats, supporter badges, and early access.',
    proof: '2M+ fans connecting on SuviX',
    bullets: [
      { icon: Users, text: 'Ad-free content stream' },
      { icon: TrendingUp, text: 'Exclusive creator chats' },
      { icon: Layers, text: 'VIP supporter badge' },
    ],
    footerTag: 'WATCH  •  SUPPORT  •  ENGAGE',
  },
};

// Dynamic glob import of role pricing artwork added under assets/pricing/{role}/*.{png,jpg,jpeg,webp}
const rolePricingImages = import.meta.glob<string>('../../assets/pricing/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

// Helper to look up image dynamically by active role and tier/index.
// Supported folder structure: assets/pricing/<role>/<role><number>.<ext>
// Examples:
// - assets/pricing/creator/creator1.png, creator2.png, creator3.png, creator4.png
// - assets/pricing/brand/brand1.png, brand2.png, brand3.png, brand4.png
// - assets/pricing/editor/editor1.png, editor2.png, editor3.png, editor4.png
// - assets/pricing/normaluser/normaluser1.png, normaluser2.png (or user1.png)
// If the image is not found, returns null so the card displays a sleek solid black background (bg-zinc-950) by default.
const getRolePlanImage = (role: string, tierLevel: number, planIndex: number): string | null => {
  const normRole = (role || 'creator').toLowerCase();
  const folderNames = (normRole === 'user' || normRole === 'audience' || normRole === 'normaluser')
    ? ['normaluser', 'user']
    : [normRole];

  const candidateNums = [planIndex + 1, tierLevel];

  // Dynamic glob lookup across assets/pricing/{folder}/{file}
  for (const [path, url] of Object.entries(rolePricingImages)) {
    const normalizedPath = path.toLowerCase().replace(/\\/g, '/');
    for (const f of folderNames) {
      if (normalizedPath.includes(`/pricing/${f}/`)) {
        for (const num of candidateNums) {
          const prefixes = Array.from(new Set([f, normRole]));
          for (const prefix of prefixes) {
            if (
              normalizedPath.endsWith(`/${prefix}${num}.png`) ||
              normalizedPath.endsWith(`/${prefix}${num}.jpg`) ||
              normalizedPath.endsWith(`/${prefix}${num}.jpeg`) ||
              normalizedPath.endsWith(`/${prefix}${num}.webp`)
            ) {
              return url;
            }
          }
          if (
            normalizedPath.endsWith(`/${num}.png`) ||
            normalizedPath.endsWith(`/${num}.jpg`) ||
            normalizedPath.endsWith(`/${num}.jpeg`) ||
            normalizedPath.endsWith(`/${num}.webp`)
          ) {
            return url;
          }
        }
      }
    }
  }

  return null;
};

const getPlanBadgeConfig = (tierLevel: number) => {
  if (tierLevel === 1) {
    return { text: 'For Starters', Icon: Send };
  }
  if (tierLevel === 2) {
    return { text: 'For Professionals', Icon: Sparkles };
  }
  return { text: 'VIP', Icon: Crown };
};

export const WelcomePricingSection: React.FC<WelcomePricingSectionProps> = ({ className = '' }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('creator');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(['creator', 'brand', 'editor', 'user']);
  const [_loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // References for horizontal scrollable/swipeable tracks (separate for mobile and desktop)
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  const desktopScrollContainerRef = useRef<HTMLDivElement>(null);

  // Touch swipe gesture tracking for mobile devices
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingRef = useRef<boolean>(false);

  const getActiveScrollContainer = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return mobileScrollContainerRef.current || desktopScrollContainerRef.current;
    }
    return desktopScrollContainerRef.current || mobileScrollContainerRef.current;
  };

  // Smoothly scroll to the top of the welcome page when clicking on any plan card or button
  const handlePlanSelect = () => {
    // If user was swiping or dragging cards horizontally, do not trigger page jump
    if (isSwipingRef.current) return;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 1. Fetch Lightweight Public Pricing Summary dynamically
  useEffect(() => {
    const fetchPublicPricing = async () => {
      setLoading(true);
      try {
        const summary = await subscriptionService.getPublicPricingSummary(currency);
        if (summary && Array.isArray(summary.plans) && summary.plans.length > 0) {
          setAllPlans(summary.plans);
          if (Array.isArray(summary.availableRoles) && summary.availableRoles.length > 0) {
            setAvailableRoles(summary.availableRoles);
          }
        } else {
          setAllPlans([]);
        }
      } catch (err) {
        console.warn('[WelcomePricingSection] Failed to load public pricing, using fallback:', err);
        setAllPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPricing();
  }, [currency]);

  // Filter visible role tabs dynamically based on backend published roles
  const visibleRoles = useMemo(() => {
    if (!availableRoles || availableRoles.length === 0) return ALL_ROLES;
    const lowerAvailable = availableRoles.map((r) => r.toLowerCase());
    const matched = ALL_ROLES.filter(
      (r) => lowerAvailable.includes(r.id.toLowerCase()) || lowerAvailable.includes(r.workspaceRole.toLowerCase())
    );
    return matched.length > 0 ? matched : ALL_ROLES;
  }, [availableRoles]);

  // Current active role mapping
  const currentTab = visibleRoles.find((r) => r.id === selectedRoleTab) || visibleRoles[0] || ALL_ROLES[0];
  const effectiveRole = currentTab.workspaceRole;
  const introContent = ROLE_INTRO_DATA[effectiveRole] || ROLE_INTRO_DATA.creator;

  // 2. Transform plans with Presenter metadata dynamically for the active role
  const displayPlans = useMemo(() => {
    return mergeBackendPlansWithPresenter(allPlans, effectiveRole, currency);
  }, [allPlans, effectiveRole, currency]);

  // Max savings calculation dynamically computed from the active role's display plans
  const maxSavingsPercent = useMemo(() => {
    const validSavings = displayPlans
      .map((p) => {
        if (typeof p.savingsPercent === 'number' && p.savingsPercent > 0) {
          return p.savingsPercent;
        }
        if (p.priceMonthly && p.priceAnnual && p.priceMonthly > p.priceAnnual) {
          return Math.round(((p.priceMonthly - p.priceAnnual) / p.priceMonthly) * 100);
        }
        return 0;
      })
      .filter((s) => s > 0);

    return validSavings.length > 0 ? Math.max(...validSavings) : 20;
  }, [displayPlans]);

  // Handle Carousel Scroll & Pagination (rAF throttled to prevent mobile render stutter)
  const scrollRafRef = useRef<number | null>(null);
  const handleScroll = (e?: React.UIEvent<HTMLDivElement>) => {
    if (scrollRafRef.current) return;
    const targetElement = (e?.currentTarget as HTMLDivElement) || getActiveScrollContainer();
    scrollRafRef.current = requestAnimationFrame(() => {
      if (targetElement) {
        const { scrollLeft, clientWidth } = targetElement;
        const firstCard = targetElement.firstElementChild as HTMLElement | null;
        const gap = window.innerWidth < 1024 ? 8 : 16;
        const cardStep = firstCard
          ? firstCard.getBoundingClientRect().width + gap
          : window.innerWidth < 640
          ? clientWidth / 2
          : 316;
        const index = Math.round(scrollLeft / cardStep);
        setCarouselIndex(Math.min(Math.max(0, index), Math.max(0, displayPlans.length - 1)));
      }
      scrollRafRef.current = null;
    });
  };

  const scrollToIndex = (index: number) => {
    const container = getActiveScrollContainer();
    if (container) {
      const firstCard = container.firstElementChild as HTMLElement | null;
      const gap = window.innerWidth < 1024 ? 8 : 16;
      const cardStep = firstCard
        ? firstCard.getBoundingClientRect().width + gap
        : window.innerWidth < 640
        ? container.clientWidth / 2
        : 316;
      container.scrollTo({
        left: index * cardStep,
        behavior: 'smooth',
      });
      setCarouselIndex(index);
    }
  };

  const handlePrev = () => {
    const target = Math.max(0, carouselIndex - 1);
    scrollToIndex(target);
  };

  const handleNext = () => {
    const target = Math.min(displayPlans.length - 1, carouselIndex + 1);
    scrollToIndex(target);
  };

  // Touch swipe gesture event handlers for 100% swipe reliability on all mobile browsers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartXRef.current);
    const deltaY = Math.abs(currentY - touchStartYRef.current);

    if (deltaX > 8 && deltaX > deltaY) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 100);
  };

  // Reset scroll position on role/currency change
  useEffect(() => {
    setCarouselIndex(0);
    if (mobileScrollContainerRef.current) {
      mobileScrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    if (desktopScrollContainerRef.current) {
      desktopScrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selectedRoleTab, currency]);

  return (
    <section
      id="pricing"
      className={`relative w-full overflow-hidden py-6 sm:py-16 px-3 xs:px-4 sm:px-6 lg:px-8 font-sans ${className}`}
    >
      {/* ── BACKGROUND GRAPHIC ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={subscriptionBg}
          alt="Pricing Background"
          className="w-full h-full object-cover object-center opacity-100 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
      </div>

      <div className="relative z-10 w-full max-w-5xl lg:max-w-[85vw] lg:w-[85vw] mx-auto flex flex-col items-center">
        
        {/* ── 1. HEADER SECTION ─ */}
        <div className="relative w-full text-center max-w-2xl mx-auto mb-3 sm:mb-8 pt-1">
          
          {/* Top Left Handwritten Note (Visible on Mobile & Desktop, tucked cleanly in corner) */}
          <div className="absolute top-0 left-0 xs:-left-1 sm:-left-8 md:-left-12 pointer-events-none select-none text-left z-20 -rotate-7">
            <div className="flex flex-col items-start leading-none">
              <span className="font-['Caveat'] text-xs xs:text-sm sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none drop-shadow-2xs">
                Invest
              </span>
              <span className="font-['Caveat'] text-xs xs:text-sm sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none">
                . in Your
              </span>
              <span className="font-['Caveat'] text-xs xs:text-sm sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none">
                Next Chapter
              </span>
              <svg className="w-11 xs:w-16 sm:w-20 md:w-24 h-1.5 sm:h-2 text-zinc-600 mt-0.5" viewBox="0 0 100 15" fill="none">
                <path d="M2 8 C 30 2, 70 14, 98 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* PRICING Pill Badge - Always Centered */}
          <div className="w-full flex items-center justify-center mb-1.5 sm:mb-2.5">
            <span className="px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/90 text-zinc-800 text-[9px] xs:text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest shadow-2xs">
              PRICING
            </span>
          </div>

          {/* Heading with Serif Italic 'Bigger Possibilities' and Signature Amazon-Orange Smile Underline */}
          <div className="w-full text-center flex flex-col items-center justify-center">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.15] text-center">
              <span>Simple Pricing for</span>
              <br />
              <span className="font-['Playfair_Display'] italic font-medium tracking-normal text-zinc-950 relative inline-block mt-0.5">
                Bigger Possibilities
                {/* Amazon Signature Curved Smile Underline with Arrow in Signature Orange */}
                <svg
                  className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3.5 text-[#FF9900] overflow-visible"
                  viewBox="0 0 250 20"
                  fill="none"
                >
                  <path
                    d="M 5 6 Q 125 24, 235 6"
                    stroke="#FF9900"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 224 8 L 238 6 L 236 17"
                    stroke="#FF9900"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </h2>
          </div>

          {/* Subtitle description */}
          <p className="text-xs xs:text-[13px] sm:text-sm text-zinc-600 max-w-xl mx-auto font-normal leading-relaxed mt-2.5 sm:mt-4 px-2 text-center">
            Whether you&apos;re just starting or building a global brand, SuviX has a plan that fits your journey. Upgrade, create, and grow — on your terms.
          </p>
        </div>

        {/* ── 2. DYNAMIC ROLE FILTER BUTTONS (4 BUTTON GRID / ROW - NO OVERFLOW) ── */}
        <div className="w-full max-w-md mx-auto mb-2.5 sm:mb-4 px-0.5">
          <div className="grid grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2 w-full">
            {visibleRoles.map((roleItem) => {
              const isSelected = selectedRoleTab === roleItem.id;
              const Icon = roleItem.icon;
              return (
                <button
                  key={roleItem.id}
                  type="button"
                  onClick={() => setSelectedRoleTab(roleItem.id)}
                  className={`w-full flex items-center justify-center gap-1 xs:gap-1.5 px-1 xs:px-2 sm:px-3.5 py-1.5 rounded-full text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 backdrop-blur-md'
                  }`}
                  title={roleItem.label}
                >
                  <Icon className={`w-3 h-3 xs:w-3.5 xs:h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-600'}`} />
                  <span className="truncate">{roleItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. BILLING CYCLE TOGGLE + DISCOUNT BADGE + CURRENCY TOGGLE ─ */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 mb-3.5 sm:mb-6 w-full px-1">
          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex p-0.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-2.5 xs:px-3.5 py-1 rounded-full text-[10px] xs:text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-2.5 xs:px-3.5 py-1 rounded-full text-[10px] xs:text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Green Discount Pill Badge */}
          {maxSavingsPercent > 0 && (
            <span className="px-2 xs:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] xs:text-[11px] font-bold shadow-2xs border border-emerald-200">
              Save up to {maxSavingsPercent}%
            </span>
          )}

          {/* Currency Toggle (INR ₹ / USD $) */}
          <div className="inline-flex p-0.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`px-2.5 xs:px-3 py-1 rounded-full text-[10px] xs:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'INR'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="View pricing in Indian Rupees (₹)"
            >
              <span>INR</span>
              <span className="text-[9.5px] xs:text-[10px] font-normal opacity-90">(₹)</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 xs:px-3 py-1 rounded-full text-[10px] xs:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'USD'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="View pricing in US Dollars ($)"
            >
              <span>USD</span>
              <span className="text-[9.5px] xs:text-[10px] font-normal opacity-90">($)</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── MOBILE VIEW (< lg): PLAN CAROUSEL + SHOWCASE BANNER BELOW ───── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden w-full">
          {/* 1. Choose Your Plan Title + Carousel Controls */}
          <div
            className="w-full flex items-center justify-between mb-2.5 px-0.5"
          >
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm xs:text-base font-black text-zinc-950 tracking-tight">
                Choose Your Plan
              </h3>
              <span className="w-5 h-[1.5px] bg-zinc-300 rounded-full inline-block" />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={carouselIndex === 0}
                className={`w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-2xs flex items-center justify-center text-zinc-700 ${
                  carouselIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
                }`}
                title="Previous Plan"
              >
                <ChevronLeft size={13} />
              </button>

              <div className="flex items-center gap-1">
                {displayPlans.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => scrollToIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      carouselIndex === dotIdx ? 'w-3.5 bg-zinc-950' : 'w-1.5 bg-zinc-300'
                    }`}
                    title={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={carouselIndex >= displayPlans.length - 1}
                className={`w-6 h-6 rounded-full bg-white border border-zinc-200 shadow-2xs flex items-center justify-center text-zinc-700 ${
                  carouselIndex >= displayPlans.length - 1 ? 'opacity-30 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
                }`}
                title="Next Plan"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* 3. Mobile Plan Cards Carousel (2 Cards Side-by-Side) */}
          <div
            ref={mobileScrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full flex gap-2 overflow-x-auto snap-x snap-mandatory py-1 px-0.5 no-scrollbar items-stretch"
          >
            {displayPlans.map((displayPlan, planIndex) => {
              const isPopular = Boolean(displayPlan.isPopular || displayPlan.tierLevel === 2 || (displayPlans.length > 2 && planIndex === 1));
              const isEnterprise = Boolean(displayPlan.tierLevel >= 4 || displayPlan.name.toLowerCase().includes('enterprise'));

              const monthlyPrice = displayPlan.priceMonthly;
              const annualPrice = displayPlan.priceAnnual;
              const price = billingCycle === 'annual' ? annualPrice : monthlyPrice;
              const isOffline = Boolean(displayPlan.isOfflineFallback || price === null || price === undefined);
              const isFree = !isOffline && (displayPlan.tierLevel === 0 || (displayPlan.tierLevel === 1 && price === 0));

              const formattedPrice = isEnterprise ? "Let's Talk" : isOffline ? '--' : isFree ? `${currencySymbol}0` : `${currencySymbol}${price}`;
              const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;

              const planImage = getRolePlanImage(effectiveRole, displayPlan.tierLevel, planIndex);
              const badgeConfig = getPlanBadgeConfig(displayPlan.tierLevel);
              const BadgeIcon = badgeConfig.Icon;
              const badgeText = displayPlan.badge || badgeConfig.text;
              const subtitleText = displayPlan.subtitle && !isOffline
                ? displayPlan.subtitle
                : (displayPlan.tierLevel === 1 || planIndex === 0 ? 'Get started for free' : 'For scaling professionals');

              return (
                <div
                  key={displayPlan.key || displayPlan.id || planIndex}
                  className="w-[calc(50%-4px)] shrink-0 snap-start flex flex-col py-0.5 relative"
                >
                  {isPopular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 bg-black text-white border border-zinc-700 whitespace-nowrap">
                        <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span>MOST POPULAR</span>
                      </span>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ y: -3 }}
                    onClick={handlePlanSelect}
                    className={`relative rounded-2xl p-2.5 xs:p-3 flex flex-col justify-between h-full bg-zinc-950 text-white border-0 ${
                      isPopular ? 'shadow-lg' : 'shadow-sm'
                    } overflow-hidden transition-colors duration-200 cursor-pointer select-none`}
                  >
                    {/* Role Plan Background Artwork (If provided, else default to solid black card) */}
                    {planImage && (
                      <div className="absolute inset-x-0 top-0 h-[105px] xs:h-[115px] overflow-hidden z-0 pointer-events-none">
                        <img
                          src={planImage}
                          alt={`${planTitle} background`}
                          className="w-full h-full object-cover object-center scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-10 xs:h-12 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                      </div>
                    )}

                    {/* Header Row over Top */}
                    <div className="relative z-10 flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[8px] xs:text-[9px] font-medium shadow-xs">
                        <BadgeIcon className="w-2.5 h-2.5 text-white" />
                        <span className="truncate max-w-[70px]">{badgeText}</span>
                      </div>

                      <div className="w-5 h-5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xs">
                        <MoreHorizontal className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Middle: Price, Title & Subtitle */}
                    <div className={`relative z-10 ${planImage ? 'mt-10 xs:mt-12' : 'mt-3'}`}>
                      <div className="flex items-baseline gap-0.5 mb-1">
                        <span className="text-base xs:text-lg font-bold tracking-tight text-white leading-none">
                          {formattedPrice}
                        </span>
                        {!isEnterprise && (
                          <span className="text-[7.5px] xs:text-[8px] font-normal text-zinc-400">
                            / month
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold tracking-tight leading-tight text-white truncate">
                        {planTitle}
                      </h3>
                      <p className="text-[7.5px] xs:text-[8px] mt-0.5 font-normal text-zinc-400 truncate">
                        {subtitleText}
                      </p>

                      {/* Locked Features Box */}
                      <div className="relative rounded-xl p-2 my-1.5 flex flex-col items-center justify-center text-center bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm min-h-[48px]">
                        <Lock size={9} className="text-zinc-400 mb-0.5" />
                        <span className="text-[8px] font-semibold leading-tight text-zinc-200">
                          Log in or sign up
                        </span>
                        <span className="text-[7px] font-normal leading-tight mt-0.5 text-zinc-400">
                          to view features
                        </span>
                      </div>
                    </div>

                    {/* White Bottom Button */}
                    <div className="relative z-10 mt-auto pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlanSelect();
                        }}
                        className="w-full py-1.5 rounded-xl text-[9px] xs:text-[10px] font-bold bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="truncate">{isOffline ? 'Unavailable' : (displayPlan.tierLevel === 1 || planIndex === 0 ? 'Get Started Free' : 'Start Free Trial')}</span>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0 text-zinc-950" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* 2. Mobile Showcase Hero Banner Card (Placed Below Plan Cards) */}
          <div className="w-full mt-3.5 transform-gpu">
            <div className="relative rounded-2xl p-3.5 xs:p-4 bg-zinc-950 text-white border border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col justify-between min-h-[150px]">
              {/* Background Artwork */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-end">
                <img
                  src={cardBg}
                  alt="Role Card Background"
                  className="w-full h-full object-cover object-right opacity-90 select-none scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent" />
              </div>

              {/* Script tag on top right */}
              <div className="absolute top-3 right-3 z-10 text-right">
                <span className="font-['Caveat'] text-xs font-bold text-zinc-300 italic tracking-tight leading-tight block">
                  {introContent.scriptTag.split('\n').map((line, i) => (
                    <span key={i} className="block leading-none">{line}</span>
                  ))}
                </span>
              </div>

              {/* Next Role Button on bottom right */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => {
                    const currIdx = visibleRoles.findIndex((r) => r.id === selectedRoleTab);
                    const nextRole = visibleRoles[(currIdx + 1) % visibleRoles.length];
                    if (nextRole) setSelectedRoleTab(nextRole.id);
                  }}
                  className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                  title="Next Role"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Left Content */}
              <div className="relative z-10 max-w-[68%] text-left flex flex-col justify-between h-full">
                <div>
                  <span className="text-[7.5px] xs:text-[8.5px] font-extrabold uppercase tracking-widest text-zinc-400">
                    {introContent.tag}
                  </span>

                  <h3 className="text-sm xs:text-base font-black text-white tracking-tight leading-tight mt-1 mb-1">
                    {introContent.title}
                  </h3>

                  <p className="text-[9.5px] xs:text-[10.5px] text-zinc-300 font-normal leading-relaxed mb-2.5 line-clamp-2">
                    {introContent.subtitle}
                  </p>
                </div>

                {/* Creator Avatars + Proof */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                  <div className="flex -space-x-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-4.5 h-4.5 rounded-full border border-zinc-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-4.5 h-4.5 rounded-full border border-zinc-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-4.5 h-4.5 rounded-full border border-zinc-900 object-cover"
                    />
                    <div className="w-4.5 h-4.5 rounded-full bg-zinc-800 text-white text-[7.5px] font-black flex items-center justify-center border border-zinc-900">
                      2M+
                    </div>
                  </div>
                  <span className="text-[8px] xs:text-[9px] font-medium text-zinc-300 leading-tight">
                    {introContent.proof}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── LAPTOP / DESKTOP VIEW (lg:flex): 2-COLUMN MAIN ROW ─────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex w-full lg:max-w-[85vw] lg:w-[85vw] flex-row gap-5 items-stretch justify-center">
          {/* Column 1: Showcase Intro Card (Pinned Left) */}
          <div className="w-[245px] xl:w-[265px] shrink-0 py-1 flex flex-col">
            <div className="relative rounded-2xl xl:rounded-3xl p-5 xl:p-6 flex flex-col justify-between h-full bg-zinc-950 text-white border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden">
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img
                  src={cardBg}
                  alt="Role Card Background"
                  className="w-full h-full object-cover object-right opacity-90 select-none scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-transparent to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                    {introContent.tag}
                  </span>
                  <div className="text-right">
                    <span className="font-['Caveat'] text-base font-bold text-zinc-300 italic tracking-tight leading-tight block">
                      {introContent.scriptTag.split('\n').map((line, i) => (
                        <span key={i} className="block leading-none">{line}</span>
                      ))}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl xl:text-2xl font-black text-white tracking-tight leading-tight mb-2 mt-1">
                  {introContent.title}
                </h3>

                <p className="text-xs text-zinc-300 font-normal leading-relaxed mb-4 max-w-[220px]">
                  {introContent.subtitle}
                </p>

                <div className="space-y-2.5 mb-4">
                  {introContent.bullets.map((item, bIdx) => {
                    const BulletIcon = item.icon;
                    return (
                      <div key={bIdx} className="flex items-center gap-2.5 text-xs text-zinc-200 font-medium">
                        <div className="w-5 h-5 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 shadow-2xs">
                          <BulletIcon size={12} className="text-zinc-300" />
                        </div>
                        <span className="leading-tight">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 pt-3.5 border-t border-zinc-800/80 mt-auto">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-6 h-6 rounded-full border border-zinc-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-6 h-6 rounded-full border border-zinc-900 object-cover"
                    />
                    <div className="w-6 h-6 rounded-full bg-zinc-800 text-white text-[8px] font-black flex items-center justify-center border border-zinc-900">
                      2M+
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300 leading-tight">
                    {introContent.proof}
                  </span>
                </div>

                <div className="text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 pt-0.5">
                  {introContent.footerTag}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Plan Cards Carousel Track */}
          <div className="flex-1 min-w-0 flex flex-col justify-between relative">
            {displayPlans.length > 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={carouselIndex >= displayPlans.length - 1}
                className={`flex absolute top-1/2 -translate-y-1/2 -right-3 z-20 w-9 h-9 rounded-full bg-white border border-zinc-200/90 shadow-md items-center justify-center text-zinc-800 transition-all ${
                  carouselIndex >= displayPlans.length - 1 ? 'opacity-0 pointer-events-none' : 'hover:scale-105 active:scale-95 cursor-pointer'
                }`}
                title="Next Plan"
              >
                <ChevronRight size={17} />
              </button>
            )}

            <div
              ref={desktopScrollContainerRef}
              onScroll={handleScroll}
              className="w-full flex gap-3.5 xl:gap-4 overflow-x-auto snap-x snap-mandatory pt-4 pb-6 px-2 no-scrollbar items-stretch"
            >
              {displayPlans.map((displayPlan, planIndex) => {
                const isPopular = Boolean(displayPlan.isPopular || displayPlan.tierLevel === 2 || (displayPlans.length > 2 && planIndex === 1));
                const isEnterprise = Boolean(displayPlan.tierLevel >= 4 || displayPlan.name.toLowerCase().includes('enterprise'));

                const monthlyPrice = displayPlan.priceMonthly;
                const annualPrice = displayPlan.priceAnnual;
                const price = billingCycle === 'annual' ? annualPrice : monthlyPrice;
                const isOffline = Boolean(displayPlan.isOfflineFallback || price === null || price === undefined);
                const isFree = !isOffline && (displayPlan.tierLevel === 0 || (displayPlan.tierLevel === 1 && price === 0));

                const formattedPrice = isEnterprise ? "Let's Talk" : isOffline ? '--' : isFree ? `${currencySymbol}0` : `${currencySymbol}${price}`;
                const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;

                const planImage = getRolePlanImage(effectiveRole, displayPlan.tierLevel, planIndex);
                const badgeConfig = getPlanBadgeConfig(displayPlan.tierLevel);
                const BadgeIcon = badgeConfig.Icon;
                const badgeText = displayPlan.badge || badgeConfig.text;
                const subtitleText = displayPlan.subtitle && !isOffline
                  ? displayPlan.subtitle
                  : (displayPlan.tierLevel === 1 || planIndex === 0 ? 'Get started for free' : 'For scaling professionals');

                const originalMonthlyPrice = (!isOffline && billingCycle === 'annual' && displayPlan.priceMonthly && displayPlan.priceAnnual && displayPlan.priceMonthly > displayPlan.priceAnnual)
                  ? displayPlan.priceMonthly
                  : null;

                return (
                  <div
                    key={displayPlan.key || displayPlan.id || planIndex}
                    className="w-[235px] xl:w-[255px] shrink-0 snap-start flex flex-col py-1 relative"
                  >
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 bg-black text-white border border-zinc-700 whitespace-nowrap">
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>MOST POPULAR</span>
                        </span>
                      </div>
                    )}

                    <motion.div
                      whileHover={{ y: -5, transition: { duration: 0.25 } }}
                      onClick={handlePlanSelect}
                      className={`relative rounded-2xl xl:rounded-3xl p-4 xl:p-5 flex flex-col justify-between h-full bg-zinc-950 text-white border-0 ${
                        isPopular ? 'shadow-2xl' : 'shadow-xl'
                      } overflow-hidden transform-gpu cursor-pointer select-none`}
                    >
                      {/* Role Plan Background Artwork (If provided, else default to solid black card) */}
                      {planImage && (
                        <div className="absolute inset-x-0 top-0 h-[160px] xl:h-[175px] overflow-hidden z-0 pointer-events-none">
                          <img
                            src={planImage}
                            alt={`${planTitle} background`}
                            className="w-full h-full object-cover object-center scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 xl:h-20 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                        </div>
                      )}

                      {/* Header Row over Top */}
                      <div className="relative z-10 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] xl:text-[11px] font-medium shadow-xs">
                          <BadgeIcon className="w-3.5 h-3.5 text-white" />
                          <span>{badgeText}</span>
                        </div>

                        <div className="w-6 h-6 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xs">
                          <MoreHorizontal className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* Price, Title & Subtitle */}
                      <div className={`relative z-10 ${planImage ? 'mt-20 xl:mt-22' : 'mt-5'}`}>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-none">
                            {formattedPrice}
                          </span>
                          {!isEnterprise && (
                            <span className="text-[11px] xl:text-xs font-normal text-zinc-400">
                              / month
                            </span>
                          )}
                          {originalMonthlyPrice && displayPlan.tierLevel > 1 && (
                            <span className="text-xs font-normal line-through text-zinc-500 ml-1.5">
                              {currencySymbol}{originalMonthlyPrice}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base xl:text-lg font-bold tracking-tight text-white leading-tight">
                            {planTitle}
                          </h3>
                          <p className="text-[11px] xl:text-xs text-zinc-400 font-normal mt-0.5">
                            {subtitleText}
                          </p>
                        </div>

                        {/* Features Lock Box */}
                        <div className="relative rounded-xl p-3 my-2.5 flex flex-col items-center justify-center text-center bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm min-h-[70px]">
                          <Lock className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                          <span className="text-[11px] xl:text-xs font-semibold text-zinc-200">
                            Log in or sign up
                          </span>
                          <span className="text-[10px] xl:text-[11px] font-normal text-zinc-400 mt-0.5">
                            to view features
                          </span>
                        </div>
                      </div>

                      {/* White Bottom Action Button */}
                      <div className="relative z-10 mt-auto pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanSelect();
                          }}
                          className="w-full py-2.5 xl:py-3 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-950 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <span>{isOffline ? 'Unavailable' : (displayPlan.tierLevel === 1 || planIndex === 0 ? 'Get Started Free' : 'Start Free Trial')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Carousel Controls */}
            <div className="flex flex-col items-center justify-center mt-5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={carouselIndex === 0}
                  className={`w-8 h-8 rounded-full bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-center text-zinc-700 transition-all ${
                    carouselIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  title="Previous Plan"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1.5">
                  {displayPlans.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => scrollToIndex(dotIdx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        carouselIndex === dotIdx ? 'w-5 bg-zinc-950' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
                      }`}
                      title={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={carouselIndex >= displayPlans.length - 1}
                  className={`w-8 h-8 rounded-full bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-center text-zinc-700 transition-all ${
                    carouselIndex >= displayPlans.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  title="Next Plan"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <span className="text-[11px] text-zinc-400 font-medium mt-2 select-none pointer-events-none">
                Swipe to explore more plans
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
