import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ComplianceConsentProps {
  billingCycle: 'monthly' | 'annual';
  planName: string;
  amount: number;
  currencySymbol?: string;
  isUsd?: boolean;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  isDarkMode?: boolean;
}

export const ComplianceConsent: React.FC<ComplianceConsentProps> = ({
  billingCycle,
  planName,
  amount,
  currencySymbol = '₹',
  isUsd = false,
  isChecked,
  onChange,
  isDarkMode: _isDarkMode = false,
}) => {
  const [showRbiDetails, setShowRbiDetails] = useState(false);

  return (
    <div
      className={`p-2.5 rounded-xl border transition-all text-xs bg-black ${
        isChecked
          ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
          : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <label className="relative flex items-center cursor-pointer mt-0.5 select-none shrink-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
              isChecked
                ? 'bg-emerald-500 border-emerald-500 text-black'
                : 'border-zinc-700 bg-zinc-900'
            }`}
          >
            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
        </label>

        <div className="flex-1 leading-snug">
          <p
            onClick={() => onChange(!isChecked)}
            className="cursor-pointer text-[11px] font-normal text-zinc-300"
          >
            I authorize recurring billing for <strong>{planName}</strong> at{' '}
            <strong className="text-white">{currencySymbol}{amount.toFixed(2)}</strong>/{billingCycle === 'annual' ? 'yr' : 'mo'}. Pause or cancel anytime.
          </p>

          <button
            type="button"
            onClick={() => setShowRbiDetails(!showRbiDetails)}
            className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <span>{isUsd ? 'Subscription Protection & Cancellation Policy' : 'RBI e-mandate protection policy'}</span>
            {showRbiDetails ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>

      {showRbiDetails && (
        <div className="mt-2 pt-2 border-t border-zinc-800 text-[10px] leading-relaxed space-y-1 text-zinc-400">
          <p>• A pre-debit alert will be sent 24 hours prior to each charge.</p>
          <p>• 1-click subscription pause and cancellation with zero exit fee.</p>
          <p>• 14-day refund guarantee applicable on annual plans.</p>
        </div>
      )}
    </div>
  );
};
