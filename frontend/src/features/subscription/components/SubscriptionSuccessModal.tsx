import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  Star,
  Calendar,
  Receipt,
  Copy,
  CheckCircle2,
  Shield,
  Link2,
  Palette,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import LottieComponent from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import type { PlanCardPresenter, WorkspaceRole } from '../rolePlanConfig';
import subscriptionSuccessLottie from '../../../assets/lottie/subscription_success.json';
import blackbglogoImg from '../../../assets/blackbglogo.png';
import whitebglogoImg from '../../../assets/whitebglogo.png';

// Handle ESM/CJS interop for lottie-react
const Lottie: any = (LottieComponent as any)?.default || LottieComponent;

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanCardPresenter;
  billingCycle: 'monthly' | 'annual';
  role: WorkspaceRole;
  amountPaid?: number;
  paymentId?: string;
  currency?: string;
  currencySymbol?: string;
  currentPeriodEnd?: string | Date | null;
  isDarkMode?: boolean;
}

export const SubscriptionSuccessModal: React.FC<SubscriptionSuccessModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  role: _role,
  amountPaid = 0,
  paymentId,
  currency,
  currencySymbol,
  currentPeriodEnd,
  isDarkMode = false,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const isUsd = (currency || plan?.currency || '').toUpperCase() === 'USD';
  const sym = currencySymbol || (isUsd ? '$' : '₹');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  // Next Renewal Calculation - prioritize server's currentPeriodEnd
  const formattedRenewal = (() => {
    if (currentPeriodEnd) {
      const serverDate = new Date(currentPeriodEnd);
      if (!isNaN(serverDate.getTime())) {
        return serverDate.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
    const nextRenewalDate = new Date();
    if (billingCycle === 'annual') {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    } else {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    }
    return nextRenewalDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  // Payment reference ID formatter
  const rawPaymentRef =
    paymentId || `pay_${Math.random().toString(36).substring(2, 9).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  
  const displayPaymentId =
    rawPaymentRef.length > 16
      ? `${rawPaymentRef.slice(0, 8)}...${rawPaymentRef.slice(-4)}`
      : rawPaymentRef;

  const handleCopyPaymentRef = async () => {
    try {
      await navigator.clipboard.writeText(rawPaymentRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const PlanIcon = typeof plan.icon === 'function' ? plan.icon : Sparkles;

  // Unlocked items for 2x2 grid
  const unlockedFeatures = [
    {
      title: 'Verified Badge on Profile ⭐',
      icon: <Shield className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />,
    },
    {
      title: 'Unlimited Bio Links & Blocks',
      icon: <Link2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />,
    },
    {
      title: 'Custom Bio Themes & CSS Styles',
      icon: <Palette className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />,
    },
    {
      title: 'Priority AI Script & Caption Generator',
      icon: <BarChart3 className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />,
    },
  ];

  // Dynamic fallback if plan has specific feature strings
  if (plan.features && plan.features.length >= 4) {
    unlockedFeatures[0].title = plan.features[0];
    unlockedFeatures[1].title = plan.features[1];
    unlockedFeatures[2].title = plan.features[2];
    unlockedFeatures[3].title = plan.features[3];
  }

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      data-lenis-prevent="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans"
    >
      <div
        className={`relative w-full max-w-[490px] rounded-3xl border shadow-2xl overflow-hidden p-4 sm:p-5 space-y-2.5 sm:space-y-3 transition-all duration-200 my-auto ${
          isDarkMode
            ? 'bg-[#0e0e11] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* ── TOP HEADER BAR (Logo + Close) ────────── */}
        <div className="flex items-center justify-between">
          <img
            src={isDarkMode ? whitebglogoImg : blackbglogoImg}
            alt="SuviX"
            className="h-12 sm:h-[60px] w-auto object-contain select-none"
          />

          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isDarkMode
                ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── TOP CELEBRATION (Lottie Animation + Title + Subtitle) ────────── */}
        <div className="text-center space-y-1">
          {/* Lottie Animation */}
          <div className="flex justify-center -my-2.5 sm:-my-3.5">
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center pointer-events-none select-none">
              <Lottie
                animationData={subscriptionSuccessLottie}
                loop={true}
                autoPlay={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{
                  preserveAspectRatio: 'xMidYMid meet',
                }}
                className="w-full h-full transform-gpu will-change-transform"
              />
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Subscription Activated!
          </h2>

          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-tight">
            Welcome to <strong className="text-zinc-900 dark:text-white font-semibold">{plan.name}!</strong> Your account has been upgraded and your premium features are ready to use.
          </p>
        </div>

        {/* ── PLAN & PAYMENT INFO CARD ────────── */}
        <div
          className={`rounded-2xl border p-2.5 sm:p-3 space-y-2 ${
            isDarkMode
              ? 'bg-[#121215] border-zinc-800'
              : 'bg-zinc-50/80 border-zinc-200 shadow-xs'
          }`}
        >
          {/* Top Row: Plan Icon + Name + Tier + Price */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
                <PlanIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                    {plan.name}
                  </span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-none">
                  Tier {plan.tierLevel} Plan &bull; {plan.subtitle || 'For serious creators'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-bold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white font-mono leading-none">
                {sym}
                {amountPaid > 0
                  ? amountPaid.toFixed(2)
                  : billingCycle === 'annual'
                  ? (plan.priceAnnualTotal || (plan.priceAnnual ? plan.priceAnnual * 12 : 0)).toFixed(2)
                  : (plan.priceMonthly || 0).toFixed(2)}
              </div>
              <div className="text-[9.5px] font-medium text-zinc-500 pt-0.5">
                {billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}
              </div>
            </div>
          </div>

          {/* Middle Row: Metrics Grid (Billing Cycle & Next Renewal) */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-[#18181c] border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Calendar className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[8.5px] font-medium text-zinc-500 uppercase tracking-wide leading-none">
                  Billing Cycle
                </div>
                <div className="text-[11px] font-semibold text-zinc-900 dark:text-white truncate pt-0.5 leading-none">
                  {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-[#18181c] border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Calendar className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[8.5px] font-medium text-zinc-500 uppercase tracking-wide leading-none">
                  Next Renewal
                </div>
                <div className="text-[11px] font-semibold text-zinc-900 dark:text-white truncate pt-0.5 leading-none">
                  {formattedRenewal}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Payment Reference & Paid Successfully */}
          <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/80 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Receipt className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
                  Ref:
                </span>
                <button
                  type="button"
                  onClick={handleCopyPaymentRef}
                  className="flex items-center gap-1 font-mono text-[10.5px] font-semibold text-zinc-900 dark:text-white hover:opacity-80 cursor-pointer"
                  title="Click to copy payment reference"
                >
                  <span className="truncate">{displayPaymentId}</span>
                  <Copy className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                  {copied && (
                    <span className="text-[8.5px] text-emerald-500 font-sans font-bold ml-0.5">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500/20 shrink-0" />
              <span>Paid Successfully</span>
            </div>
          </div>
        </div>

        {/* ── WHAT'S NOW UNLOCKED SECTION ────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-white">
              What's now unlocked
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Features</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {unlockedFeatures.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl border flex items-center gap-2 text-[10.5px] font-medium leading-tight ${
                  isDarkMode
                    ? 'bg-[#121215] border-zinc-800 text-zinc-200'
                    : 'bg-white border-zinc-200 text-zinc-800 shadow-xs'
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTION BUTTONS ────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {/* Button 1 (Primary): Redirects to Home Page */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Workspace Features</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Button 2 (Secondary): Closes modal & stays on subscription hub */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
              isDarkMode
                ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300'
                : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            View Subscription Hub
          </button>
        </div>

        {/* ── FOOTER NOTE ────────── */}
        <p className="text-center text-[9.5px] text-zinc-400 dark:text-zinc-500 pt-0.5 select-none">
          Let's create bigger, together. —{' '}
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">SuviX</span>
        </p>
      </div>
    </div>,
    document.body
  );
};
