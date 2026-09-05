import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
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
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden transition-all duration-200 bg-white text-zinc-900"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 text-center space-y-4">
          {/* Animated Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-1">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Subscription Activated!</h2>
            <p className="text-xs text-zinc-500 mt-1 font-normal">
              Welcome to <strong className="text-zinc-900">{plan.name}</strong>. Your account has been upgraded with all premium platform entitlements.
            </p>
          </div>

          {/* Receipt Snapshot Card */}
          <div
            className="p-4 rounded-2xl border border-zinc-200 text-left text-xs space-y-2 font-normal bg-zinc-50 text-zinc-700"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">{plan.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tier {plan.tierLevel}
                </span>
              </div>
              <span className="font-bold text-emerald-600 text-sm">₹{amountPaid.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-zinc-500 block text-[10px]">Billing Schedule</span>
                <span className="font-medium text-zinc-900">{billingCycle === 'annual' ? 'Annual (20% Off)' : 'Monthly'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Next Renewal</span>
                <span className="font-medium text-zinc-900">{formattedRenewal}</span>
              </div>
              {paymentId && (
                <div className="col-span-2">
                  <span className="text-zinc-500 block text-[10px]">Payment Reference</span>
                  <span className="font-mono text-[10px] text-zinc-700 truncate block">{paymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Unlocked Privileges List */}
          <div className="text-left space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Unlocked Entitlements & Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.features.slice(0, 4).map((feat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-zinc-200 flex items-center gap-2 text-xs font-normal bg-zinc-50 text-zinc-800"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
              className="w-full py-2.5 rounded-full text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Explore Workspace Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full text-xs font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              View Subscription Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
