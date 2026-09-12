import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Send,
  Rocket,
  Crown,
  ShieldCheck,
  CreditCard,
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

export const WelcomePricingSection: React.FC<WelcomePricingSectionProps> = ({ className = '' }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('creator');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(['creator', 'brand', 'editor', 'user']);
  const [_loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // Reference for horizontal scrollable/swipeable track
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll to the top of the welcome page when clicking on any plan card or button
  const handlePlanSelect = () => {
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

  // Handle Carousel Scroll & Pagination
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const isMobile = window.innerWidth < 640;
      const cardStep = isMobile ? (clientWidth / 2) : 316;
      const index = Math.round(scrollLeft / cardStep);
      setCarouselIndex(Math.min(Math.max(0, index), Math.max(0, displayPlans.length - 1)));
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const isMobile = window.innerWidth < 640;
      const cardStep = isMobile ? (clientWidth / 2) : 316;
      scrollContainerRef.current.scrollTo({
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

  // Reset scroll position on role/currency change
  useEffect(() => {
    setCarouselIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
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

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        
        {/* ── 1. HEADER SECTION ─ */}
        <div className="relative w-full text-center max-w-2xl mx-auto mb-3 sm:mb-8 pt-1">
          
          {/* Top Left Handwritten Note (Visible on Mobile & Desktop, tucked cleanly in corner) */}
          <div className="absolute top-0 left-0 xs:-left-1 sm:-left-8 md:-left-12 rotate-[-7deg] pointer-events-none select-none text-left z-20">
            <div className="flex flex-col items-start leading-none">
              <span className="font-['Caveat'] text-[11px] xs:text-xs sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none drop-shadow-2xs">
                Invest
              </span>
              <span className="font-['Caveat'] text-[11px] xs:text-xs sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none">
                . in Your
              </span>
              <span className="font-['Caveat'] text-[11px] xs:text-xs sm:text-xl md:text-2xl font-bold text-zinc-700 tracking-tight leading-none">
                Next Chapter
              </span>
              <svg className="w-10 xs:w-14 sm:w-20 md:w-24 h-1.5 sm:h-2 text-zinc-600 mt-0.5" viewBox="0 0 100 15" fill="none">
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
            <h2 className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.18] text-center">
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
          <p className="text-[10.5px] xs:text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto font-normal leading-relaxed mt-2.5 sm:mt-4 px-2 text-center">
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
        {/* ── MOBILE VIEW (< lg): TOP SHOWCASE BANNER + 2-CARD CAROUSEL ─── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden w-full">
          {/* 1. Mobile Showcase Hero Banner Card */}
          <div className="w-full mb-3.5">
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

          {/* 2. Choose Your Plan Title + Carousel Controls */}
          <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
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
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth py-1 px-0.5 no-scrollbar items-stretch"
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
              const CardIcon = displayPlan.tierLevel === 1 ? Send : displayPlan.tierLevel === 2 ? Rocket : Crown;
              const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;
              const planSubtitle = isOffline ? '--' : displayPlan.subtitle;

              return (
                <div
                  key={displayPlan.key || displayPlan.id || planIndex}
                  className="w-[calc(50%-4px)] shrink-0 snap-start flex flex-col py-0.5"
                >
                  <motion.div
                    whileHover={{ y: -3 }}
                    onClick={handlePlanSelect}
                    className={`relative rounded-2xl p-2.5 xs:p-3 flex flex-col justify-between h-full transition-colors duration-200 cursor-pointer select-none ${
                      isPopular
                        ? 'bg-white border-2 border-zinc-950 shadow-md z-10'
                        : 'bg-white border border-zinc-200 shadow-2xs'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-2 right-2 z-20">
                        <span className="text-[7.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 bg-black text-white">
                          <Star className="w-2 h-2 fill-current" />
                          <span>MOST POPULAR</span>
                        </span>
                      </div>
                    )}

                    <div className="relative z-10">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                            isPopular ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <CardIcon className="w-3 h-3" />
                        </div>
                        {!isPopular && (
                          <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 bg-white border-zinc-200 text-zinc-600">
                            {displayPlan.badge || (displayPlan.tierLevel === 1 ? 'For Starters' : 'Basic')}
                          </span>
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="mb-1.5">
                        <h3 className="text-xs font-bold tracking-tight leading-tight text-zinc-950 truncate">
                          {planTitle}
                        </h3>
                        <p className="text-[8px] mt-0.5 font-normal text-zinc-500 truncate">
                          {planSubtitle}
                        </p>
                      </div>

                      {/* Price Block */}
                      <div className="my-1.5">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-base xs:text-lg font-black tracking-tight text-zinc-950 leading-none">
                            {formattedPrice}
                          </span>
                          {!isEnterprise && (
                            <span className="text-[8px] font-normal text-zinc-500">
                              / month
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Blurred Features Lock Box */}
                      <div className="relative rounded-xl p-2 my-1.5 flex flex-col items-center justify-center text-center overflow-hidden min-h-[50px] bg-zinc-50/90 border border-zinc-200 shadow-2xs">
                        <div className="absolute inset-0 p-2 opacity-25 filter blur-[2px] flex flex-col justify-around pointer-events-none text-zinc-400">
                          <div className="h-1 bg-zinc-400 rounded-full w-3/4 mx-auto" />
                          <div className="h-1 bg-zinc-400 rounded-full w-5/6 mx-auto" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-5 h-5 rounded-full shadow-2xs border bg-white border-zinc-200 text-zinc-800 flex items-center justify-center mb-0.5">
                            <Lock size={9} className="text-zinc-700" />
                          </div>
                          <span className="text-[8px] font-bold leading-tight text-zinc-900">
                            Log in or sign up
                          </span>
                          <span className="text-[7px] font-medium leading-tight mt-0.5 text-zinc-500">
                            to view features
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="mt-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlanSelect();
                        }}
                        className={`relative z-10 w-full py-1.5 rounded-xl text-[9.5px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                          isPopular
                            ? 'bg-black hover:bg-zinc-800 text-white shadow-md'
                            : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200'
                        }`}
                      >
                        <span className="truncate">{isOffline ? 'Unavailable' : (displayPlan.buttonText || (isPopular ? 'Start Free Trial' : 'Get Started Free'))}</span>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── LAPTOP / DESKTOP VIEW (lg:flex): 2-COLUMN MAIN ROW ─────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex w-full max-w-7xl flex-row gap-6 items-stretch">
          {/* Column 1: Showcase Intro Card (Pinned Left) */}
          <div className="w-[280px] xl:w-[310px] shrink-0 py-1 flex flex-col">
            <div className="relative rounded-3xl p-7 flex flex-col justify-between h-full bg-zinc-950 text-white border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] overflow-hidden">
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
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                    {introContent.tag}
                  </span>
                  <div className="text-right">
                    <span className="font-['Caveat'] text-lg font-bold text-zinc-300 italic tracking-tight leading-tight block">
                      {introContent.scriptTag.split('\n').map((line, i) => (
                        <span key={i} className="block leading-none">{line}</span>
                      ))}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight leading-tight mb-2 mt-1">
                  {introContent.title}
                </h3>

                <p className="text-xs text-zinc-300 font-normal leading-relaxed mb-5 max-w-[250px]">
                  {introContent.subtitle}
                </p>

                <div className="space-y-3.5 mb-6">
                  {introContent.bullets.map((item, bIdx) => {
                    const BulletIcon = item.icon;
                    return (
                      <div key={bIdx} className="flex items-center gap-3 text-xs text-zinc-200 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center shrink-0 shadow-2xs">
                          <BulletIcon size={13} className="text-zinc-300" />
                        </div>
                        <span className="leading-tight">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-zinc-800/80 mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-7 h-7 rounded-full border border-zinc-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&auto=format&fit=crop&crop=faces&q=80"
                      alt="Creator Avatar"
                      className="w-7 h-7 rounded-full border border-zinc-900 object-cover"
                    />
                    <div className="w-7 h-7 rounded-full bg-zinc-800 text-white text-[9px] font-black flex items-center justify-center border border-zinc-900">
                      2M+
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300 leading-tight">
                    {introContent.proof}
                  </span>
                </div>

                <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-zinc-500 pt-0.5">
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
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-4 pb-6 px-2 no-scrollbar items-stretch"
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
                const CardIcon = displayPlan.tierLevel === 1 ? Send : displayPlan.tierLevel === 2 ? Rocket : Crown;
                const planTitle = isOffline ? `Plan ${planIndex + 1}` : displayPlan.name;
                const planSubtitle = isOffline ? '--' : displayPlan.subtitle;

                const originalMonthlyPrice = (!isOffline && billingCycle === 'annual' && displayPlan.priceMonthly && displayPlan.priceAnnual && displayPlan.priceMonthly > displayPlan.priceAnnual)
                  ? displayPlan.priceMonthly
                  : null;

                return (
                  <div
                    key={displayPlan.key || displayPlan.id || planIndex}
                    className="w-[280px] xl:w-[300px] shrink-0 snap-start flex flex-col py-1"
                  >
                    <motion.div
                      whileHover={{ y: -6, transition: { duration: 0.25 } }}
                      onClick={handlePlanSelect}
                      className={`relative rounded-2xl p-6 flex flex-col justify-between h-full transition-colors duration-200 transform-gpu cursor-pointer select-none ${
                        isPopular
                          ? 'bg-white border-2 border-zinc-950 shadow-xl scale-[1.01] z-10'
                          : 'bg-white border-2 border-zinc-900/85 hover:border-zinc-950 shadow-sm'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-2.5 right-6 z-20">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 bg-black text-white">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{displayPlan.badge || 'Most Popular'}</span>
                          </span>
                        </div>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                                isPopular ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-zinc-100 border-zinc-900/40 text-zinc-800'
                              }`}
                            >
                              <CardIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold tracking-tight leading-tight text-zinc-900">
                                {planTitle}
                              </h3>
                              <p className="text-[11px] mt-0.5 font-normal text-zinc-500">
                                {planSubtitle}
                              </p>
                            </div>
                          </div>

                          {!isPopular && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 bg-zinc-100 border-zinc-900/30 text-zinc-700">
                              {displayPlan.badge || (displayPlan.tierLevel === 1 ? 'For Starters' : displayPlan.tierLevel === 2 ? 'Pro Tier' : 'VIP')}
                            </span>
                          )}
                        </div>

                        <div className="my-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
                              {formattedPrice}
                            </span>
                            {!isEnterprise && (
                              <span className="text-xs font-normal text-zinc-500">
                                / month
                              </span>
                            )}
                            {originalMonthlyPrice && displayPlan.tierLevel > 1 && (
                              <span className="text-sm font-semibold line-through text-zinc-400 ml-1">
                                {currencySymbol}{originalMonthlyPrice}
                              </span>
                            )}
                          </div>

                          {displayPlan.tierLevel > 1 && !isEnterprise && (
                            <div className="space-y-0.5 mt-1">
                              <p className="text-[11px] font-bold text-zinc-800">
                                {isOffline ? 'Save --' : `Save ${displayPlan.savingsPercent || maxSavingsPercent}% with yearly`}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-normal">
                                {currency === 'INR' ? 'All taxes & GST included in price' : '0% tax for overseas creators'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="relative rounded-2xl p-5 my-5 flex flex-col items-center justify-center text-center overflow-hidden min-h-[140px] bg-zinc-50/90 border border-zinc-200/80 shadow-2xs">
                          <div className="absolute inset-0 p-4 opacity-30 filter blur-[3px] flex flex-col justify-around pointer-events-none text-zinc-400">
                            <div className="h-2 bg-zinc-400 rounded-full w-3/4 mx-auto" />
                            <div className="h-2 bg-zinc-400 rounded-full w-5/6 mx-auto" />
                            <div className="h-2 bg-zinc-400 rounded-full w-2/3 mx-auto" />
                            <div className="h-2 bg-zinc-400 rounded-full w-4/5 mx-auto" />
                          </div>

                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full shadow-2xs border bg-white border-zinc-200 text-zinc-800 flex items-center justify-center mb-2">
                              <Lock size={14} className="text-zinc-700" />
                            </div>
                            <span className="text-xs font-bold leading-tight text-zinc-900">
                              Log in or sign up
                            </span>
                            <span className="text-[11px] font-medium leading-tight mt-0.5 text-zinc-500">
                              to view features
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanSelect();
                          }}
                          className={`relative z-10 w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                            isPopular
                              ? 'bg-black hover:bg-zinc-800 text-white shadow-lg border-2 border-black'
                              : 'bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-950 shadow-xs'
                          }`}
                        >
                          <span>{isOffline ? 'Unavailable' : (displayPlan.buttonText || 'Get Started Free')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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

        {/* ── 7. BOTTOM TRUST BAR (4 Columns) ───────────────────────── */}
        <div className="relative w-full max-w-4xl mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-zinc-200/80">
          <div className="grid grid-cols-4 divide-x divide-zinc-200/80 text-center items-center">
            {/* 1. Money Back */}
            <div className="flex flex-col items-center px-1">
              <ShieldCheck size={18} className="text-zinc-800 mb-1" />
              <div className="text-[9.5px] xs:text-[10.5px] sm:text-xs font-bold text-zinc-900 leading-tight">14-day</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">money back</div>
            </div>

            {/* 2. 2M+ Creators */}
            <div className="flex flex-col items-center px-1">
              <Users size={18} className="text-zinc-800 mb-1" />
              <div className="text-[9.5px] xs:text-[10.5px] sm:text-xs font-bold text-zinc-900 leading-tight">2M+</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">creators trust SuviX</div>
            </div>

            {/* 3. Rating */}
            <div className="flex flex-col items-center px-1">
              <Star size={18} className="text-zinc-800 mb-1" />
              <div className="text-[9.5px] xs:text-[10.5px] sm:text-xs font-bold text-zinc-900 leading-tight">4.8/5</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">average rating</div>
            </div>

            {/* 4. Secure & Flexible */}
            <div className="flex flex-col items-center px-1">
              <CreditCard size={18} className="text-zinc-800 mb-1" />
              <div className="text-[9.5px] xs:text-[10.5px] sm:text-xs font-bold text-zinc-900 leading-tight">Secure &amp; flexible</div>
              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">payment options</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
