import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Building2,
  Globe,
  Briefcase,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  DollarSign,
  ShieldCheck,
  Award,
  Zap,
  Laptop,
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Dumbbell,
  Megaphone,
  GraduationCap,
  Film,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../../store/slices/onboardingSlice';
import type { RootState } from '../../store';
import { selectUser } from '../../store/slices/authSlice';
import logo from '../../assets/lightlogo.png';
import brandBadge from '../../assets/verifiedBadges/brand_badge.png';

// ── INDUSTRY VERTICALS CATALOG ───────────────────────────────────────────────
interface IndustryOption {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const INDUSTRIES: IndustryOption[] = [
  { id: 'tech_saas', name: 'Tech & SaaS', desc: 'Software, AI & Dev Tools', icon: Laptop },
  { id: 'ecommerce_d2c', name: 'E-Commerce & D2C', desc: 'Consumer Brands & Retail', icon: ShoppingBag },
  { id: 'gaming_esports', name: 'Gaming & Esports', desc: 'Studios, Hardware & Streams', icon: Gamepad2 },
  { id: 'fintech_crypto', name: 'FinTech & Web3', desc: 'Banking, Investing & Crypto', icon: CreditCard },
  { id: 'fashion_lifestyle', name: 'Fashion & Lifestyle', desc: 'Apparel, Beauty & Luxury', icon: Sparkles },
  { id: 'health_fitness', name: 'Health & Wellness', desc: 'Fitness, Supplements & Diet', icon: Dumbbell },
  { id: 'media_agency', name: 'Agency & Media', desc: 'Marketing, PR & Management', icon: Megaphone },
  { id: 'edtech', name: 'Education & EdTech', desc: 'Academies, Courses & Tutoring', icon: GraduationCap },
  { id: 'entertainment', name: 'Entertainment & Film', desc: 'Production, Music & OTT', icon: Film },
  { id: 'other', name: 'Other Business', desc: 'B2B, Logistics & Real Estate', icon: Building2 },
];

const COMPANY_SIZES = [
  { id: 'seed', label: '1 - 10', desc: 'Startup' },
  { id: 'growth', label: '11 - 50', desc: 'Growing' },
  { id: 'mid', label: '51 - 200', desc: 'Mid-Market' },
  { id: 'large', label: '201 - 1000', desc: 'Enterprise' },
  { id: 'corp', label: '1000+', desc: 'Global Corp' },
];

const BUDGET_TIERS = [
  { id: 'starter', label: '< $1,000 / mo', desc: 'Test single creator integrations & pilot deals', badge: 'Starter' },
  { id: 'growth', label: '$1,000 - $5,000 / mo', desc: 'Ongoing sponsorships with active creator roster', badge: 'Popular' },
  { id: 'scale', label: '$5,000 - $25,000 / mo', desc: 'Dedicated campaigns, verified video editors & scale', badge: 'Growth' },
  { id: 'enterprise', label: '$25,000+ / mo', desc: 'High-volume omni-channel global creator sponsorships', badge: 'Enterprise' },
];

export default function BrandDetails() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onboarding = useSelector((state: RootState) => state.onboarding);
  const tempSignupData = onboarding.tempSignupData;
  const selectedRole = onboarding.selectedRole;
  const authMethod = onboarding.authMethod || tempSignupData?.authMethod;
  const user = useSelector(selectUser);

  const [companyName, setCompanyName] = useState(tempSignupData?.companyName || '');
  const [companyWebsite, setCompanyWebsite] = useState(tempSignupData?.companyWebsite || '');
  const [designation, setDesignation] = useState(tempSignupData?.designation || '');
  const [industry, setIndustry] = useState(tempSignupData?.industry || 'Tech & SaaS');
  const [companySize, setCompanySize] = useState(tempSignupData?.companySize || '11 - 50');
  const [approxBudget, setApproxBudget] = useState<string>(
    typeof tempSignupData?.approxBudget === 'string' ? tempSignupData.approxBudget : '$1,000 - $5,000 / mo'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔐 PRODUCTION GUARD: Requires Brand-role selection
  useEffect(() => {
    const isAuthed = !!user?.id;
    if (isAuthed && user.isOnboarded) {
      navigate('/home', { replace: true });
      return;
    }

    const roleSlug = selectedRole?.slug || tempSignupData?.categorySlug;
    const isBrand = roleSlug === 'brand' || roleSlug === 'social_promoter';

    if (!selectedRole && !isBrand) {
      try {
        const rawBackup = sessionStorage.getItem('suvix_temp_signup_data');
        if (rawBackup) {
          const parsed = JSON.parse(rawBackup);
          if (parsed?.categoryId || parsed?.categorySlug === 'brand') {
            dispatch(setTempSignupData(parsed));
            return;
          }
        }
      } catch {
        // ignore
      }
      navigate('/role-selection', { replace: true });
    }
  }, [selectedRole, tempSignupData, user, navigate, dispatch]);

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyWebsite(e.target.value);
  };

  const selectedIndustryObj = useMemo(
    () => INDUSTRIES.find((i) => i.name === industry) || INDUSTRIES[0],
    [industry]
  );

  const isFormValid = companyName.trim().length >= 2 && !!industry;

  const handleContinue = () => {
    if (!isFormValid) return;
    setIsSubmitting(true);

    let normalizedWebsite = companyWebsite.trim();
    if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    const updateData = {
      companyName: companyName.trim(),
      companyWebsite: normalizedWebsite,
      designation: designation.trim() || 'Brand Representative',
      industry,
      companySize,
      approxBudget,
      onboardingStep: 'brand' as const,
    };

    dispatch(setTempSignupData(updateData));

    try {
      const raw = sessionStorage.getItem('suvix_temp_signup_data');
      const cur = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem('suvix_temp_signup_data', JSON.stringify({ ...cur, ...updateData }));
    } catch {
      // ignore
    }

    const isGoogleFlow = authMethod === 'google';

    setTimeout(() => {
      setIsSubmitting(false);
      if (isGoogleFlow) {
        // Google flow: fire Google OAuth now (brand data is saved in sessionStorage).
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
        window.location.href = `${apiUrl}/auth/google`;
      } else {
        // Email flow: go to manual signup form
        navigate('/signup');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-zinc-900 flex flex-col relative selection:bg-zinc-900 selection:text-white">
      {/* ── SUBTLE ENTERPRISE GRID PATTERN ─────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(228, 228, 231, 0.6) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(228, 228, 231, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── TOP HEADER / NAVIGATION BAR ────────────────────────────────────── */}
      <header className="relative z-50 w-full px-4 py-3.5 sm:px-8 sm:py-4.5 md:px-12 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="SuviX"
            className="h-7 sm:h-8 md:h-8.5 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* Step Indicator & Back Button */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 shadow-2xs text-xs font-medium text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span>Step 2 of 3 • Brand Profile</span>
          </div>

          <button
            onClick={() => navigate('/role-selection')}
            className="h-9 px-3.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 hover:text-zinc-950 text-xs font-medium transition-all flex items-center gap-1.5 group active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-zinc-500" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER: 2-COLUMN DESKTOP SPLIT ─────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-2 sm:pt-4 pb-36 relative z-10">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Brand &amp; Sponsor Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Tell us about your brand
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md mx-auto">
            Directly connect with verified YouTube creators and elite video editors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  LEFT COLUMN: Live Brand Identity & Deal Flow Card (lg:5)      ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24">
            
            {/* Desktop Section Header */}
            <div className="hidden lg:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Brand &amp; Sponsor Setup
              </span>
              <h1 className="text-3xl font-bold text-zinc-950 tracking-tight leading-tight">
                Tell us about your brand
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                Directly connect with verified YouTube creators and elite video editors tailored to your vertical.
              </p>
            </div>

            {/* ── LIVE INTERACTIVE BRAND SPONSOR PREVIEW CARD ──────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-5 shadow-xs">
              {/* Card Header with Brand Details */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-zinc-700" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-zinc-950 truncate">
                      {companyName.trim() || 'Your Brand Name'}
                    </h2>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {designation.trim() || 'Brand Representative'}
                    </p>
                  </div>
                </div>

                {/* Verified Sponsor Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <img
                    src={brandBadge}
                    alt="Verified Brand"
                    className="h-6.5 w-auto object-contain"
                  />
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">
                    Verified Sponsor
                  </span>
                </div>
              </div>

              {/* Data Specifications Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/60 text-xs mb-3.5">
                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Industry
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {React.createElement(selectedIndustryObj.icon, {
                      size: 13,
                      className: 'text-zinc-700',
                      strokeWidth: 2,
                    })}
                    <span className="font-semibold text-zinc-900 truncate">
                      {industry}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Monthly Budget
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">
                    {approxBudget}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Team Size
                  </span>
                  <span className="font-semibold text-zinc-900 block mt-0.5">
                    {companySize} members
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Website
                  </span>
                  <span className="font-semibold text-zinc-900 truncate block mt-0.5">
                    {companyWebsite.trim() ? companyWebsite.replace(/^https?:\/\//i, '') : 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Live Matchmaking Status */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900 text-white text-xs">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-zinc-300 fill-zinc-300" />
                  <span className="text-[11px] font-medium text-zinc-200">
                    Direct Creator Deal Flow
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-wider">
                  Active Match
                </span>
              </div>
            </div>

            {/* Enterprise Guarantees Pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <ShieldCheck size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Escrow Protected</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Secure milestones</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <Award size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Vetted Creators</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Verified YouTube API</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                <TrendingUp size={16} className="text-zinc-800 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-zinc-900 block">Deal Analytics</span>
                <span className="text-[9px] text-zinc-500 block mt-0.5">Real-time ROI</span>
              </div>
            </div>

          </div>

          {/* ╔════════════════════════════════════════════════════════════════╗
              ║  RIGHT COLUMN: Clean Professional Form (lg:7)                  ║
              ╚════════════════════════════════════════════════════════════════╝ */}
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">

            {/* ── SECTION 1: ORGANIZATION IDENTITY ────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <Building2 className="w-4 h-4 text-zinc-800" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                  1. Organization Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                    <span>
                      Company / Brand Name <span className="text-red-500">*</span>
                    </span>
                    {companyName.trim().length >= 2 && (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                        <Check size={10} strokeWidth={3} /> Valid
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Nike, Notion, Sony, Apex Media"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                    <span>Company Website</span>
                    {companyWebsite.trim() && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <ExternalLink size={9} /> Valid Link
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyWebsite}
                      onChange={handleWebsiteChange}
                      placeholder="e.g. company.com"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Designation / Role */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">
                    Your Role / Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Head of Influencer Marketing, Brand Manager, Founder"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: INDUSTRY VERTICAL ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    2. Industry Vertical <span className="text-red-500">*</span>
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Select primary sector
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                {INDUSTRIES.map((ind) => {
                  const isSelected = industry === ind.name;
                  const IconComp = ind.icon;
                  return (
                    <div
                      key={ind.id}
                      onClick={() => setIndustry(ind.name)}
                      className={`cursor-pointer p-3 sm:p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 select-none ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-100 border-zinc-200/80 text-zinc-700'
                          }`}
                        >
                          <IconComp size={15} strokeWidth={2} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {ind.name}
                          </p>
                          <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {ind.desc}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-zinc-900'
                            : 'border-zinc-300 bg-zinc-50 text-transparent'
                        }`}
                      >
                        <Check size={9} strokeWidth={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 3: COMPANY TEAM SIZE ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <Users className="w-4 h-4 text-zinc-800" />
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                  3. Company Team Scale
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {COMPANY_SIZES.map((size) => {
                  const isSelected = companySize === size.label;
                  return (
                    <div
                      key={size.id}
                      onClick={() => setCompanySize(size.label)}
                      className={`cursor-pointer p-2.5 sm:p-3 rounded-xl border text-center transition-all select-none ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{size.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>{size.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 4: ESTIMATED MONTHLY SPONSORSHIP BUDGET ──────────── */}
            <div className="bg-white rounded-2xl border border-zinc-200/90 p-4.5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-zinc-800" />
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-900">
                    4. Estimated Monthly Sponsorship Budget
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400">Flexible anytime</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BUDGET_TIERS.map((tier) => {
                  const isSelected = approxBudget === tier.label;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setApproxBudget(tier.label)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all select-none flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                          {tier.label}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white text-zinc-900'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {tier.badge}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {tier.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── STICKY PROFESSIONAL BOTTOM ACTION BAR ──────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Dynamic Status Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                {isFormValid
                  ? `${companyName} • ${industry} • ${approxBudget}`
                  : 'Enter company name to continue'}
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block mt-0.5">
              Verified YouTube creator sponsorships, smart escrow &amp; direct deal flow
            </p>
          </div>

          {/* Right: Tactile Action CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={!isFormValid || isSubmitting}
            className={`!h-11 sm:!h-11.5 !px-6 sm:!px-8 !text-xs sm:!text-sm !font-semibold !tracking-wide flex items-center gap-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isFormValid
                ? '!bg-zinc-950 hover:!bg-zinc-800 !text-white shadow-xs active:scale-[0.98]'
                : '!bg-zinc-100 !text-zinc-400 cursor-not-allowed border border-zinc-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
