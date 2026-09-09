import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  ArrowUp,
  Calculator,
  Calendar,
  Zap,
  Clock,
  Wallet,
  Coins,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PlanCardPresenter } from '../rolePlanConfig';
import type { ProrationQuote } from '../../../api/services/subscription.service';
import { round2 } from '../../../utils/money';

interface UpgradeStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout?: () => void;
  targetPlan?: PlanCardPresenter | null;
  activePlan?: any | null;
  plans?: PlanCardPresenter[] | null;
  user?: any | null;
  prorationQuote?: ProrationQuote | null;
  billingCycle?: 'monthly' | 'annual';
  isDarkMode?: boolean;
}

export const UpgradeStoryModal: React.FC<UpgradeStoryModalProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  targetPlan,
  activePlan,
  plans,
  user,
  prorationQuote,
  billingCycle = 'monthly',
  isDarkMode = true,
}) => {
  // 5-Minute Reading Timer (300 seconds)
  const [secondsLeft, setSecondsLeft] = useState<number>(292);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(292);
      setIsFaqOpen(false);
      setShowCalculationDetails(false);
    }
  }, [isOpen]);

  // 5-minute auto-close countdown timer
  useEffect(() => {
    if (!isOpen) return;

    if (secondsLeft <= 0) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsLeft, onClose]);

  // Format seconds as MM:SS
  const formattedTimeLeft = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Currency
  const currencySymbol = (targetPlan?.currency || activePlan?.currency || prorationQuote?.currency || '').toUpperCase() === 'USD' ? '$' : '₹';

  // Dynamic user name (displays Full Name, @username, or both "Name (@username)")
  const userName = useMemo(() => {
    const full = (user?.name || user?.fullName || user?.displayName || '').trim();
    const handle = (user?.username || '').trim();
    if (full && handle && full.toLowerCase() !== handle.toLowerCase()) {
      return `${full} (@${handle})`;
    }
    if (full) return full;
    if (handle) return `@${handle}`;
    if (user?.email) return user.email.split('@')[0];
    return 'Creator';
  }, [user]);

  // Match current active plan from catalog if available
  const matchedActiveCard = useMemo(() => {
    if (!plans || !activePlan) return null;
    return (
      plans.find((p) => p.id === activePlan.planId) ||
      plans.find((p) => p.tierLevel === activePlan.tierLevel) ||
      null
    );
  }, [plans, activePlan]);

  // Dynamic Plan Details
  const currentPlanName = useMemo(() => {
    if (prorationQuote?.currentPlanName) return prorationQuote.currentPlanName;
    if (activePlan?.planName) return activePlan.planName;
    if (matchedActiveCard?.name) return matchedActiveCard.name;
    if (activePlan?.name) return activePlan.name;
    return 'Current Plan';
  }, [prorationQuote, activePlan, matchedActiveCard]);

  const targetPlanName = useMemo(() => {
    if (prorationQuote?.targetPlanName) return prorationQuote.targetPlanName;
    if (targetPlan?.name) return targetPlan.name;
    return 'Target Plan';
  }, [prorationQuote, targetPlan]);

  const currentPlanPrice = useMemo(() => {
    if (prorationQuote?.currentPlanPrice !== undefined && prorationQuote.currentPlanPrice !== null && prorationQuote.currentPlanPrice > 0) {
      return round2(prorationQuote.currentPlanPrice);
    }
    if (matchedActiveCard?.priceMonthly) return Math.round(matchedActiveCard.priceMonthly);
    const raw = activePlan?.priceMonthly || activePlan?.amount || 0;
    return Math.round(Number(raw));
  }, [prorationQuote, matchedActiveCard, activePlan]);

  const targetPlanPrice = useMemo(() => {
    if (prorationQuote?.targetPlanPrice !== undefined && prorationQuote.targetPlanPrice !== null && prorationQuote.targetPlanPrice > 0) {
      return round2(prorationQuote.targetPlanPrice);
    }
    if (targetPlan) {
      if (billingCycle === 'annual') {
        return Math.round(Number(targetPlan.priceAnnual || targetPlan.priceMonthly || 0));
      }
      return Math.round(Number(targetPlan.priceMonthly || 0));
    }
    return 0;
  }, [prorationQuote, targetPlan, billingCycle]);

  // Robust Dynamic Dates & Exact Day Calculations
  const {
    totalDays,
    usedDays,
    remainingDays,
    startDateFormatted,
    endDateFormatted,
  } = useMemo(() => {
    const rawStart =
      activePlan?.currentPeriodStart ||
      activePlan?.periodStart ||
      activePlan?.startDate ||
      activePlan?.createdAt;

    const rawEnd =
      activePlan?.currentPeriodEnd ||
      activePlan?.periodEnd ||
      activePlan?.expiresAt ||
      activePlan?.validUntil;

    if (rawStart && rawEnd) {
      const start = new Date(rawStart);
      const end = new Date(rawEnd);
      const now = new Date();

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const totalMs = Math.max(1000 * 60 * 60 * 24, end.getTime() - start.getTime());
        let totalCycleDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
        if (prorationQuote?.totalDays) {
          totalCycleDays = prorationQuote.totalDays;
        }

        const remainingMs = Math.max(0, end.getTime() - now.getTime());
        let remDays = Math.max(1, Math.min(totalCycleDays, Math.ceil(remainingMs / (1000 * 60 * 60 * 24))));

        // If backend proration quote specifically provided remainingDays, prioritize it
        if (
          prorationQuote?.remainingDays !== undefined &&
          prorationQuote.remainingDays !== null
        ) {
          remDays = prorationQuote.remainingDays;
        }

        let elapsedDays = Math.max(0, totalCycleDays - remDays);
        if (prorationQuote?.usedDays !== undefined && prorationQuote.usedDays !== null) {
          elapsedDays = prorationQuote.usedDays;
        }

        const startFmt = start.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const endFmt = end.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        return {
          totalDays: totalCycleDays,
          usedDays: elapsedDays,
          remainingDays: remDays,
          startDateFormatted: startFmt,
          endDateFormatted: endFmt,
        };
      }
    }

    // Dynamic fallback if no active subscription dates exist
    const totalCycleFallback = prorationQuote?.totalDays || 1;
    const remainingFallback = prorationQuote?.remainingDays || totalCycleFallback;
    const usedFallback = prorationQuote?.usedDays || Math.max(0, totalCycleFallback - remainingFallback);

    const now = new Date();
    const mockStart = new Date(now.getTime() - usedFallback * 24 * 60 * 60 * 1000);
    const mockEnd = new Date(now.getTime() + remainingFallback * 24 * 60 * 60 * 1000);

    return {
      totalDays: totalCycleFallback,
      usedDays: usedFallback,
      remainingDays: remainingFallback,
      startDateFormatted: mockStart.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      endDateFormatted: mockEnd.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [activePlan, prorationQuote]);

  // Proration Financial Math
  const priceDelta = Math.max(0, targetPlanPrice - currentPlanPrice);

  const creditedCurrentPlanValue = useMemo(() => {
    if (
      prorationQuote?.unusedCredit !== undefined &&
      prorationQuote.unusedCredit !== null &&
      prorationQuote.unusedCredit > 0
    ) {
      return round2(prorationQuote.unusedCredit);
    }
    return round2(currentPlanPrice * (remainingDays / Math.max(1, totalDays)));
  }, [prorationQuote, currentPlanPrice, remainingDays, totalDays]);

  const actualPayableAmount = useMemo(() => {
    if (
      prorationQuote &&
      prorationQuote.totalAmount !== undefined &&
      prorationQuote.totalAmount !== null &&
      prorationQuote.totalAmount > 0
    ) {
      return round2(prorationQuote.totalAmount);
    }
    return Math.max(0, round2(priceDelta * (remainingDays / Math.max(1, totalDays))));
  }, [prorationQuote, priceDelta, remainingDays, totalDays]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`relative w-full max-w-4xl max-h-[92vh] rounded-[28px] border shadow-2xl flex flex-col overflow-hidden ${
          isDarkMode
            ? 'bg-[#101014] border-zinc-800 text-white shadow-black/80'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* ── TOP HEADER BAR ── */}
        <div
          className={`flex items-center justify-between px-6 sm:px-8 py-5 border-b shrink-0 ${
            isDarkMode ? 'border-zinc-800/80 bg-[#101014]' : 'border-zinc-100 bg-white'
          }`}
        >
          {/* Left: Icon + Title + Subtitle */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dcfce7] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <ArrowUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white leading-tight">
                Review Your Upgrade
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">
                Here's a clear breakdown of your plan transition and charges.
              </p>
            </div>
          </div>

          {/* Right: Countdown Pill + Close Button */}
          <div className="flex items-center gap-3">
            <div
              className={`px-3.5 py-1.5 rounded-xl border flex flex-col items-center justify-center ${
                isDarkMode
                  ? 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
                  : 'bg-white border-zinc-200 text-zinc-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{formattedTimeLeft}</span>
              </div>
              <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium">
                Offer expires soon
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-black shadow-xs'
              }`}
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 sm:py-6 space-y-4 text-xs">
          
          {/* 1. User & Plan Overview Card */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              isDarkMode
                ? 'bg-[#141418] border-zinc-800 text-zinc-200'
                : 'bg-white border-zinc-200/90 text-zinc-800 shadow-xs'
            }`}
          >
            {/* Left Column: Personalized Plan Story */}
            <div className="space-y-2.5 flex-1 leading-relaxed text-[13px]">
              <div className="text-base font-bold text-zinc-950 dark:text-white">
                Hey {userName},
              </div>

              <div className="text-zinc-600 dark:text-zinc-300">
                You're currently on{' '}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black text-white dark:bg-white dark:text-black mx-1">
                  {currentPlanName}
                </span>{' '}
                ({currencySymbol}{currentPlanPrice}/month).
              </div>

              <div className="text-zinc-600 dark:text-zinc-300">
                You've used{' '}
                <span className="font-bold text-zinc-900 dark:text-white">{usedDays} days</span>{' '}
                of your{' '}
                <span className="font-bold text-zinc-900 dark:text-white">{totalDays}-day cycle</span>{' '}
                (started on {startDateFormatted}) with{' '}
                <span className="font-bold text-zinc-900 dark:text-white">{remainingDays} days</span>{' '}
                remaining.
              </div>

              <div className="text-zinc-600 dark:text-zinc-300">
                You're upgrading to{' '}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black text-white dark:bg-white dark:text-black mx-1">
                  {targetPlanName}
                </span>{' '}
                ({currencySymbol}{targetPlanPrice}/month) to unlock higher quotas, advanced AI tools, and more.
              </div>
            </div>

            {/* Right Column: Growth Stepped Graph Illustration */}
            <div className="hidden md:flex flex-col items-center justify-center pl-6 border-l border-zinc-200 dark:border-zinc-800 shrink-0 min-w-[140px]">
              <div className="flex items-end gap-1.5 h-12 mb-2.5">
                <div className="w-2.5 h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-xs" />
                <div className="w-2.5 h-6 bg-zinc-300 dark:bg-zinc-600 rounded-xs" />
                <div className="w-2.5 h-8.5 bg-zinc-400 dark:bg-zinc-500 rounded-xs" />
                <div className="w-2.5 h-12 bg-zinc-800 dark:bg-zinc-200 rounded-xs" />
              </div>
              <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 text-center font-medium leading-tight">
                <div>Higher Tools.</div>
                <div>Greater Growth.</div>
                <div>Same Journey.</div>
              </div>
            </div>
          </div>

          {/* 2. "Concerned about double charges?" Accordion Banner */}
          <div
            className={`rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-emerald-950/20 border-emerald-900/40 text-zinc-200'
                : 'bg-[#f0fdf4] border-[#bbf7d0] text-zinc-900 shadow-xs'
            }`}
          >
            <div
              onClick={() => setIsFaqOpen((prev) => !prev)}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#047857] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  ?
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Concerned about double charges?
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 italic mt-0.5">
                    "I already paid {currencySymbol}{currentPlanPrice} on {startDateFormatted}. If I upgrade today, will I be charged again or lose my money?"
                  </div>
                </div>
              </div>

              <div className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors shrink-0">
                {isFaqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <AnimatePresence>
              {isFaqOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-emerald-200/60 dark:border-emerald-900/30 px-5 py-3.5 text-xs text-zinc-700 dark:text-zinc-300 space-y-2 bg-emerald-50/40 dark:bg-emerald-950/30"
                >
                  <p>
                    <strong>No, you will not lose anything.</strong> Your subscription uses exact industry-standard daily proration.
                  </p>
                  <p>
                    The {remainingDays} unused days of your existing {currentPlanName} plan ({currencySymbol}{creditedCurrentPlanValue.toFixed(2)}) are 100% credited against your upgrade cost today. You only pay the difference, and your billing renewal date remains locked on <strong>{endDateFormatted}</strong>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Three Key Guarantee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Card 1 */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode
                  ? 'bg-emerald-950/15 border-emerald-900/30'
                  : 'bg-[#f0fdf4] border-[#dcfce7] shadow-xs'
              }`}
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#dcfce7] dark:bg-emerald-900/50 text-[#047857] dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#047857] dark:text-emerald-400">
                  100% Unused Value Credited
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  Your remaining {remainingDays} days ({currencySymbol}{creditedCurrentPlanValue.toFixed(2)} value) will be fully deducted from today's upgrade cost.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode
                  ? 'bg-emerald-950/15 border-emerald-900/30'
                  : 'bg-[#f0fdf4] border-[#dcfce7] shadow-xs'
              }`}
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#dcfce7] dark:bg-emerald-900/50 text-[#047857] dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Coins className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#047857] dark:text-emerald-400">
                  You Only Pay the Difference
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  Instead of {currencySymbol}{targetPlanPrice}, you'll only pay the exact prorated amount of{' '}
                  <strong className="text-zinc-900 dark:text-white font-semibold">
                    {currencySymbol}{actualPayableAmount.toFixed(2)}
                  </strong>{' '}
                  for the remaining {remainingDays} days.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode
                  ? 'bg-emerald-950/15 border-emerald-900/30'
                  : 'bg-[#f0fdf4] border-[#dcfce7] shadow-xs'
              }`}
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#dcfce7] dark:bg-emerald-900/50 text-[#047857] dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#047857] dark:text-emerald-400">
                  Same Renewal Date
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  Your renewal date stays{' '}
                  <strong className="text-zinc-900 dark:text-white font-semibold">
                    {endDateFormatted}
                  </strong>
                  , so your billing cycle never changes.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Upgrade Calculation Section */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-zinc-900 dark:text-white" />
                <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white">
                  Upgrade Calculation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculationDetails((prev) => !prev)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline cursor-pointer"
              >
                {showCalculationDetails ? 'Hide details' : 'How this is calculated?'}
              </button>
            </div>

            {/* Calculation Equation Grid */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 ${
                isDarkMode ? 'bg-[#141418] border-zinc-800' : 'bg-zinc-50/70 border-zinc-200/90'
              }`}
            >
              {/* Item 1: Target Plan */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex-1 w-full text-left ${
                  isDarkMode
                    ? 'bg-[#101014] border-zinc-800'
                    : 'bg-white border-zinc-100 shadow-xs'
                }`}
              >
                <div className="text-[11px] text-zinc-400 font-medium">Target Plan</div>
                <div className="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white mt-0.5">
                  {targetPlanName}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {currencySymbol}{targetPlanPrice} / month
                </div>
              </div>

              {/* Minus Operator */}
              <div className="text-zinc-400 font-light text-xl px-1 shrink-0 select-none">
                —
              </div>

              {/* Item 2: Current Plan Credit */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex-1 w-full text-left ${
                  isDarkMode
                    ? 'bg-[#101014] border-zinc-800'
                    : 'bg-white border-zinc-100 shadow-xs'
                }`}
              >
                <div className="text-[11px] text-zinc-400 font-medium">Current Plan Credit</div>
                <div className="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white mt-0.5">
                  {remainingDays} days ({currencySymbol}{currentPlanPrice})
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  - {currencySymbol}{creditedCurrentPlanValue.toFixed(2)}
                </div>
              </div>

              {/* Equals Operator */}
              <div className="text-zinc-400 font-light text-xl px-1 shrink-0 select-none">
                =
              </div>

              {/* Item 3: Amount to Pay Today (Green Highlight Card) */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex-1 w-full text-left ${
                  isDarkMode
                    ? 'bg-emerald-950/30 border-emerald-800/50'
                    : 'bg-[#f0fdf4] border-[#bbf7d0] shadow-xs'
                }`}
              >
                <div className="text-[11px] text-[#047857] dark:text-emerald-400 font-semibold">
                  Amount to Pay Today
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-[#047857] dark:text-emerald-400 font-mono">
                    {currencySymbol}{actualPayableAmount.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#047857] dark:text-emerald-400 font-normal">
                    (for {remainingDays} days)
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable Calculation Proof */}
            <AnimatePresence>
              {showCalculationDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`overflow-hidden p-4 rounded-xl border text-xs font-mono space-y-2 ${
                    isDarkMode
                      ? 'bg-zinc-900/70 border-zinc-800 text-zinc-300'
                      : 'bg-zinc-100/90 border-zinc-200 text-zinc-700'
                  }`}
                >
                  <div className="font-bold text-zinc-900 dark:text-white font-sans text-xs">
                    Exact Mathematical Breakdown:
                  </div>
                  <div>
                    1. Remaining Cycle Proportion = {remainingDays} remaining days / {totalDays} total cycle days = {(remainingDays / Math.max(1, totalDays)).toFixed(4)}
                  </div>
                  <div>
                    2. Unused Credit = {currencySymbol}{currentPlanPrice} × {(remainingDays / Math.max(1, totalDays)).toFixed(4)} = {currencySymbol}{creditedCurrentPlanValue.toFixed(2)}
                  </div>
                  <div>
                    3. Prorated New Plan = {currencySymbol}{targetPlanPrice} × {(remainingDays / Math.max(1, totalDays)).toFixed(4)} = {currencySymbol}{round2(targetPlanPrice * (remainingDays / Math.max(1, totalDays))).toFixed(2)}
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    Net Charge = {currencySymbol}{round2(targetPlanPrice * (remainingDays / Math.max(1, totalDays))).toFixed(2)} - {currencySymbol}{creditedCurrentPlanValue.toFixed(2)} = {currencySymbol}{actualPayableAmount.toFixed(2)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. What Happens Next? Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-950 dark:text-white fill-zinc-950 dark:fill-white" />
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white">
                What Happens Next?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-1">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  1
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Payment Successful
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your plan will be upgraded instantly.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  2
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Features Unlocked
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    All {targetPlanName} features will be available immediately.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  3
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white">
                    Next Renewal
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your next billing date remains {endDateFormatted}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-t shrink-0 gap-4 ${
            isDarkMode ? 'border-zinc-800/80 bg-[#101014]' : 'border-zinc-100 bg-white'
          }`}
        >
          {/* Trust / Gateway Badge */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Secure & encrypted payment</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-1 font-semibold italic text-blue-600 dark:text-sky-400">
              <span>Razorpay®</span>
            </div>
          </div>

          {/* Buttons & Sub-Caption */}
          <div className="flex flex-col items-center sm:items-end gap-1 w-full sm:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                }`}
              >
                Maybe later
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onProceedToCheckout) {
                    onProceedToCheckout();
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
              >
                <span>Proceed to Upgrade</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 text-center sm:text-right font-medium">
              You'll be charged {currencySymbol}{actualPayableAmount.toFixed(2)} now (prorated)
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
