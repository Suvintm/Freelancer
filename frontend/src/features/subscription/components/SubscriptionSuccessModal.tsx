import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PlanCardPresenter, WorkspaceRole } from '../rolePlanConfig';

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanCardPresenter;
  billingCycle: 'monthly' | 'annual';
  role: WorkspaceRole;
  amountPaid?: number;
  paymentId?: string;
  isDarkMode?: boolean;
}

export const SubscriptionSuccessModal: React.FC<SubscriptionSuccessModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  role,
  amountPaid = 0,
  paymentId,
  isDarkMode = false,
}) => {
  const navigate = useNavigate();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const nextRenewalDate = new Date();
  if (billingCycle === 'annual') {
    nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
  } else {
    nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
  }

  const formattedRenewal = nextRenewalDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans"
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? 'bg-[#121216] border-white/15 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${
            isDarkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 text-center space-y-4">
          {/* Animated Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-1">
            <div
              className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-sm ${
                isDarkMode
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Subscription Activated!
            </h2>
            <p className={`text-xs mt-1 font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Welcome to <strong className={isDarkMode ? 'text-white' : 'text-zinc-900'}>{plan.name}</strong>. Your account has been upgraded with all premium platform entitlements.
            </p>
          </div>

          {/* Receipt Snapshot Card */}
          <div
            className={`p-4 rounded-2xl border text-left text-xs space-y-2 font-normal ${
              isDarkMode
                ? 'bg-white/[0.03] border-white/10 text-zinc-300'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}
          >
            <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{plan.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Tier {plan.tierLevel}
                </span>
              </div>
              <span className="font-bold text-emerald-400 text-sm">₹{amountPaid.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className={`block text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Billing Schedule</span>
                <span className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
                  {billingCycle === 'annual' ? 'Annual (20% Off)' : 'Monthly'}
                </span>
              </div>
              <div>
                <span className={`block text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Next Renewal</span>
                <span className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{formattedRenewal}</span>
              </div>
              {paymentId && (
                <div className="col-span-2">
                  <span className={`block text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Payment Reference</span>
                  <span className={`font-mono text-[10px] truncate block ${isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}`}>
                    {paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Unlocked Privileges List */}
          <div className="text-left space-y-2">
            <h4 className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Unlocked Entitlements & Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.features.slice(0, 4).map((feat, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-normal ${
                    isDarkMode
                      ? 'bg-white/[0.02] border-white/10 text-zinc-200'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                if (role === 'creator') navigate('/creator');
                else if (role === 'editor') navigate('/dashboard');
                else if (role === 'brand') navigate('/dashboard');
                else navigate('/link-in-bio');
              }}
              className="w-full py-2.5 rounded-full text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Workspace Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                isDarkMode
                  ? 'border-white/15 text-zinc-300 hover:bg-white/5'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              View Subscription Hub
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
