import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Check,
  Building2,
  Globe,
  Briefcase,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setTempSignupData } from '../store/slices/onboardingSlice';
import type { RootState } from '../store';
import { selectUser } from '../store/slices/authSlice';
import logo from '../assets/whitebglogo.png';

// ── INDUSTRY CATALOG ────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: 'tech_saas', name: 'Tech & SaaS', icon: '💻' },
  { id: 'ecommerce_d2c', name: 'E-Commerce & D2C', icon: '🛍️' },
  { id: 'gaming_esports', name: 'Gaming & Esports', icon: '🎮' },
  { id: 'fintech_crypto', name: 'FinTech & Web3', icon: '💳' },
  { id: 'fashion_lifestyle', name: 'Fashion & Lifestyle', icon: '✨' },
  { id: 'health_fitness', name: 'Health & Wellness', icon: '🏋️' },
  { id: 'media_agency', name: 'Agency & Media', icon: '📢' },
  { id: 'edtech', name: 'Education & EdTech', icon: '📚' },
  { id: 'other', name: 'Other Business', icon: '🌐' },
];

const COMPANY_SIZES = [
  { id: 'seed', label: '1 - 10', desc: 'Startup' },
  { id: 'growth', label: '11 - 50', desc: 'Growing' },
  { id: 'mid', label: '51 - 200', desc: 'Mid-Market' },
  { id: 'large', label: '201 - 1000', desc: 'Enterprise' },
  { id: 'corp', label: '1000+', desc: 'Global Corp' },
];

const BUDGET_TIERS = [
  { id: 'starter', label: '< $1K', desc: 'Test Campaigns' },
  { id: 'growth', label: '$1K - $5K', desc: 'Monthly Sponsoring' },
  { id: 'scale', label: '$5K - $25K', desc: 'Dedicated Creator Roster' },
  { id: 'enterprise', label: '$25K+', desc: 'Omni-Channel Scale' },
];

const STATIC_PARTICLES = [
  { id: 1, x: '15%', y: '25%', duration: 18, scale: 0.8, opacity: 0.4 },
  { id: 2, x: '80%', y: '20%', duration: 22, scale: 1.1, opacity: 0.5 },
  { id: 3, x: '30%', y: '70%', duration: 16, scale: 0.7, opacity: 0.3 },
  { id: 4, x: '75%', y: '65%', duration: 24, scale: 1.0, opacity: 0.4 },
  { id: 5, x: '50%', y: '45%', duration: 20, scale: 0.9, opacity: 0.3 },
];

export default function BrandDetails() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tempSignupData = useSelector((state: RootState) => state.onboarding.tempSignupData);
  const user = useSelector(selectUser);

  const [companyName, setCompanyName] = useState(tempSignupData?.companyName || '');
  const [companyWebsite, setCompanyWebsite] = useState(tempSignupData?.companyWebsite || '');
  const [designation, setDesignation] = useState(tempSignupData?.designation || '');
  const [industry, setIndustry] = useState(tempSignupData?.industry || '');
  const [companySize, setCompanySize] = useState(tempSignupData?.companySize || '11 - 50');
  const [approxBudget, setApproxBudget] = useState<string>(
    typeof tempSignupData?.approxBudget === 'string' ? tempSignupData.approxBudget : '$1K - $5K'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔐 PRODUCTION GUARD: Requires Brand role selection
  useEffect(() => {
    const isAuthed = !!user?.id;
    if (isAuthed && user.isOnboarded) {
      navigate('/home', { replace: true });
      return;
    }

    const categoryId = tempSignupData?.categoryId;
    const categorySlug = tempSignupData?.categorySlug;
    const isBrand = categorySlug === 'brand' || categorySlug === 'social_promoter';

    if (!categoryId && !isBrand) {
      navigate('/role-selection', { replace: true });
    }
  }, [tempSignupData, user, navigate]);

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    setCompanyWebsite(val);
  };

  const handleContinue = () => {
    if (!companyName.trim() || !industry) return;
    setIsSubmitting(true);

    let normalizedWebsite = companyWebsite.trim();
    if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
      normalizedWebsite = `https://${normalizedWebsite}`;
    }

    dispatch(
      setTempSignupData({
        companyName: companyName.trim(),
        companyWebsite: normalizedWebsite,
        designation: designation.trim() || 'Brand Representative',
        industry,
        companySize,
        approxBudget,
        onboardingStep: 'brand',
      })
    );

    setTimeout(() => {
      setIsSubmitting(false);
      const isSocial = tempSignupData?.isSocialSignup;
      if (isSocial) {
        navigate('/complete-profile');
      } else {
        navigate('/signup');
      }
    }, 400);
  };

  const isFormValid = companyName.trim().length >= 2 && !!industry;

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* ── BACKGROUND ACCENTS ────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-gradient-to-b from-cyan-600/[0.10] to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {STATIC_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: p.opacity, scale: p.scale }}
            animate={{ y: [null, '-25%', '25%', '-10%'], x: [null, '12%', '-12%', '6%'], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px]"
          />
        ))}
        <motion.div animate={{ scale: [1, 1.15, 1], x: ['-4%', '4%', '-4%'] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute -top-[10%] -left-[10%] w-[90%] h-[60%] bg-zinc-900/15 rounded-full blur-[140px]" />
        <motion.div animate={{ scale: [1.15, 1, 1.15], x: ['4%', '-4%', '4%'] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute -top-[5%] -right-[10%] w-[90%] h-[60%] bg-cyan-900/[0.08] rounded-full blur-[140px]" />
      </div>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-[100] p-4 md:p-6 lg:p-8 flex items-center justify-between pointer-events-none">
        {/* Logo */}
        <div className="pointer-events-auto">
          <img src={logo} alt="SuviX" className="h-6 md:h-7 lg:h-9" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pointer-events-none">
          {[
            { label: 'Role', done: true },
            { label: 'Company', done: false, active: true },
            { label: 'Details', done: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${
                s.done   ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                s.active ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20' :
                           'bg-zinc-900/60 border-zinc-800 text-zinc-600'
              }`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black ${
                  s.done   ? 'bg-green-500 text-black' :
                  s.active ? 'bg-cyan-400 text-black' :
                             'bg-zinc-800 text-zinc-600'
                }`}>
                  {s.done ? <Check size={7} strokeWidth={3} /> : i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className={`w-4 h-px ${s.done ? 'bg-green-500/30' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/role-selection')}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-zinc-800 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto group active:scale-95 transition-transform"
        >
          <ChevronLeft size={15} className="text-zinc-400 group-hover:text-white" />
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto z-10 pt-20 md:pt-24 pb-28 px-4 md:px-8 max-w-4xl mx-auto w-full scrollbar-none">
        {/* Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Enterprise & Sponsor Onboarding
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Tell us about your brand or agency
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-lg mx-auto">
            Connect directly with verified creators and top video editors tailored to your industry and scale.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* ── SECTION 1: COMPANY IDENTITY ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-5 md:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                1. Organization Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 flex items-center justify-between">
                  <span>Company / Brand Name <span className="text-cyan-400">*</span></span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Nike, Notion, Apex Media"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Company Website</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyWebsite}
                    onChange={handleWebsiteChange}
                    placeholder="e.g. company.com"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400">Your Role / Designation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Founder, Head of Influencer Marketing, Talent Director"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── SECTION 2: INDUSTRY VERTICAL ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-5 md:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  2. Industry Vertical <span className="text-cyan-400">*</span>
                </h2>
              </div>
              <span className="text-xs text-zinc-500">Pick primary industry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INDUSTRIES.map((ind) => {
                const isSelected = industry === ind.name;
                return (
                  <div
                    key={ind.id}
                    onClick={() => setIndustry(ind.name)}
                    className={`cursor-pointer group p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/70 shadow-md shadow-cyan-500/10'
                        : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg select-none">{ind.icon}</span>
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {ind.name}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-cyan-400 border-cyan-300 text-black'
                        : 'border-zinc-700 bg-zinc-800/50 text-transparent'
                    }`}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── SECTION 3: COMPANY SIZE & CAMPAIGN SCALE ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-5 md:p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-6"
          >
            {/* Company Size */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Company Team Size
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {COMPANY_SIZES.map((size) => {
                  const isSelected = companySize === size.label;
                  return (
                    <div
                      key={size.id}
                      onClick={() => setCompanySize(size.label)}
                      className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/70 text-cyan-300 shadow-sm shadow-cyan-500/20'
                          : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <p className="text-xs font-black text-white">{size.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{size.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campaign Budget Tier */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Estimated Monthly Creator Budget
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-500">Flexible anytime</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUDGET_TIERS.map((tier) => {
                  const isSelected = approxBudget === tier.label;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setApproxBudget(tier.label)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/70 shadow-sm shadow-cyan-500/20'
                          : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs font-black text-white">{tier.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{tier.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-black/80 backdrop-blur-lg border-t border-zinc-800/80 p-4 md:py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">
              {isFormValid
                ? `${companyName} (${industry})`
                : 'Enter your company name & industry to proceed'}
            </p>
            <p className="text-[10px] text-zinc-500 hidden sm:block">
              Tailoring creator matchmaking algorithms to your vertical
            </p>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!isFormValid || isSubmitting}
            className={`!h-11 !px-6 !text-xs !font-black !uppercase !tracking-wider flex items-center gap-2 rounded-xl transition-all ${
              isFormValid
                ? '!bg-white hover:!bg-zinc-200 !text-black shadow-lg shadow-white/10'
                : '!bg-zinc-800 !text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
