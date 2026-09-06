import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { ImSpinner2 } from 'react-icons/im';

interface SmartCouponInputProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: { code: string; discountPercent: number } | null;
  onApply: (codeToApply?: string) => Promise<void>;
  onRemove: () => void;
  validating: boolean;
  error: string | null;
  isDarkMode?: boolean;
}

const POPULAR_COUPONS = [
  { code: 'CREATOR20', label: '20% OFF' },
  { code: 'LAUNCH50', label: '50% OFF' },
  { code: 'SUVIPRO', label: '15% OFF' },
];

export const SmartCouponInput: React.FC<SmartCouponInputProps> = ({
  couponCode,
  setCouponCode,
  appliedCoupon,
  onApply,
  onRemove,
  validating,
  error,
  isDarkMode: _isDarkMode = false,
}) => {
  // Auto-apply from URL params
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCoupon = searchParams.get('coupon') || searchParams.get('promo');
      if (urlCoupon && !appliedCoupon) {
        const clean = urlCoupon.trim().toUpperCase();
        setCouponCode(clean);
        onApply(clean);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    onApply(couponCode.trim().toUpperCase());
  };

  const handleChipClick = (code: string) => {
    setCouponCode(code);
    onApply(code);
  };

  return (
    <div className="space-y-1.5">
      {appliedCoupon ? (
        <div
          className="p-2 rounded-xl border border-emerald-500/40 bg-black text-emerald-400 flex items-center justify-between text-xs transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-500" />
            </div>
            <span className="font-mono font-semibold uppercase tracking-wider text-[11px]">
              {appliedCoupon.code}
            </span>
            <span className="text-[10.5px] opacity-80">
              ({appliedCoupon.discountPercent}% discount applied)
            </span>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md transition-colors hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
            title="Remove Promo Code"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Promo code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs uppercase font-mono tracking-wider placeholder:normal-case placeholder:tracking-normal border outline-none transition-all bg-black border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={validating || !couponCode.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer bg-white text-black hover:bg-zinc-200"
            >
              {validating ? <ImSpinner2 className="animate-spin w-3 h-3" /> : 'Apply'}
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-500">
              Available:
            </span>
            {POPULAR_COUPONS.map((chip) => (
              <button
                key={chip.code}
                type="button"
                onClick={() => handleChipClick(chip.code)}
                disabled={validating}
                className="text-[9.5px] px-2 py-0.5 rounded-md border font-mono transition-all cursor-pointer border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              >
                {chip.code} <span className="opacity-60 font-sans">({chip.label})</span>
              </button>
            ))}
          </div>
        </>
      )}

      {error && <div className="text-[10.5px] text-rose-500 font-medium">{error}</div>}
    </div>
  );
};
