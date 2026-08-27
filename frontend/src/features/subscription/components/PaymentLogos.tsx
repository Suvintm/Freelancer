import React from 'react';

// ── 1. RAZORPAY OFFICIAL LOGO ────────────────────────────────────────────────
export const RazorpayLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 200 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M17.4 38.6L24.8 24.3H11.5L14.6 18.2H32.2L35.3 12.1H8.3L0 28.3H13.3L6 42.6L17.4 38.6Z"
      fill="#0C2340"
    />
    <path
      d="M13.3 28.3L6 42.6L17.4 38.6L24.8 24.3H13.3Z"
      fill="#0284C7"
    />
    <path
      d="M14.6 18.2L11.5 24.3H24.8L17.4 38.6L35.3 12.1H14.6Z"
      fill="#38BDF8"
    />
    <text x="42" y="32" fill="#0C2340" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="26" letterSpacing="-0.5">
      Razorpay
    </text>
  </svg>
);

// ── 2. STRIPE OFFICIAL LOGO ──────────────────────────────────────────────────
export const StripeLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <text x="6" y="34" fill="#635BFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="34" letterSpacing="-1">
      stripe
    </text>
  </svg>
);

// ── 3. GOOGLE PAY (GPAY) LOGO ────────────────────────────────────────────────
export const GooglePayLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* G */}
    <path
      d="M18.8 20.3c0-.7-.1-1.4-.2-2h-8.8v3.9h5.1c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.2z"
      fill="#4285F4"
    />
    <path
      d="M9.8 29.5c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 1-3.2 1-2.5 0-4.6-1.7-5.3-3.9H1.3v2.5c1.6 3.1 4.9 5.1 8.5 5.1z"
      fill="#34A853"
    />
    <path
      d="M4.5 21.9c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2v-2.5H1.3C.5 17 0 18.5 0 20.1s.5 3.1 1.3 4.7l3.2-2.9z"
      fill="#FBBC04"
    />
    <path
      d="M9.8 14.5c1.4 0 2.7.5 3.7 1.4l2.8-2.8c-1.7-1.6-3.9-2.6-6.5-2.6-3.6 0-6.9 2-8.5 5.1l3.2 2.5c.7-2.3 2.8-3.6 5.3-3.6z"
      fill="#EA4335"
    />
    {/* Pay text */}
    <text x="24" y="27" fill="#3c4043" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600" fontSize="21">
      Pay
    </text>
  </svg>
);

// ── 4. PHONEPE LOGO ──────────────────────────────────────────────────────────
export const PhonePeLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="36" height="36" rx="18" fill="#5F259F" />
    <path
      d="M23 10.5h-5.2c-4 0-6.8 2.8-6.8 6.8v9.7h4v-5.2h2.8c4 0 6.8-2.8 6.8-6.8s-2.8-4.5-6.8-4.5h-.8v-4.5h6v4.5zm-4 7.2h-2.8v-3.7h2.8c1.8 0 3 1 3 2.1s-1.2 1.6-3 1.6z"
      fill="#FFFFFF"
    />
    <text x="44" y="25" fill="#5F259F" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="17">
      PhonePe
    </text>
  </svg>
);

// ── 5. PAYTM LOGO ────────────────────────────────────────────────────────────
export const PaytmLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 90 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <text x="2" y="24" fill="#00BAF2" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="24">
      pay<tspan fill="#002970">tm</tspan>
    </text>
  </svg>
);

// ── 6. UPI LOGO ──────────────────────────────────────────────────────────────
export const UpiLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L2 22h12l4-8h10l-4 8h12L46 2H12z" fill="#097939" />
    <path d="M32 2L22 22h12l4-8h10l-4 8h12L66 2H32z" fill="#ED752E" />
    <text x="38" y="24" fill="#2D3748" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="18" fontStyle="italic">
      UPI
    </text>
  </svg>
);

// ── 7. VISA LOGO ─────────────────────────────────────────────────────────────
export const VisaLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <text x="2" y="20" fill="#1A1F71" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="22" fontStyle="italic" letterSpacing="1">
      VISA
    </text>
  </svg>
);

// ── 8. MASTERCARD LOGO ───────────────────────────────────────────────────────
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 54 34" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="17" r="15" fill="#EB001B" />
    <circle cx="36" cy="17" r="15" fill="#F79E1B" fillOpacity="0.9" />
  </svg>
);

// ── 9. RUPAY LOGO ────────────────────────────────────────────────────────────
export const RupayLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <text x="2" y="20" fill="#097939" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="20">
      Ru<tspan fill="#ED752E">Pay</tspan>
    </text>
  </svg>
);

// ── 10. APPLE PAY LOGO ───────────────────────────────────────────────────────
export const ApplePayLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 90 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M13.7 13.8c-.8 1-2.1 1.6-3.2 1.6-.2-1.2.4-2.5 1.1-3.3.8-1 2.1-1.6 3.1-1.7.2 1.2-.3 2.4-1 3.4zm1.1 1.8c-1.7-.1-3.2 1-4 1s-2.1-1-3.5-1c-1.8 0-3.5 1-4.4 2.6-1.9 3.3-.5 8.2 1.3 10.9.9 1.3 2 2.7 3.4 2.6 1.4-.1 1.9-.9 3.5-.9s2.1.9 3.5.9c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.9-4.4 0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-1.9-3.9-1.9z"
      fill="#000000"
    />
    <text x="24" y="26" fill="#000000" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600" fontSize="20">
      Pay
    </text>
  </svg>
);

// ── 11. CRED LOGO ────────────────────────────────────────────────────────────
export const CredLogo: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="28" height="28" rx="8" fill="#1B1C1E" />
    <path d="M14 6v16M8 14h12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <text x="34" y="22" fill="#1B1C1E" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16">
      CRED
    </text>
  </svg>
);

// ── 12. BANK BADGES ──────────────────────────────────────────────────────────
export const BankEmblem: React.FC<{ code: 'hdfc' | 'icici' | 'sbi' | 'axis' | 'kotak' | 'pnb'; name: string }> = ({
  code,
  name,
}) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    hdfc: { bg: '#004c8f', text: '#FFFFFF', label: 'HDFC' },
    icici: { bg: '#b82928', text: '#FFFFFF', label: 'ICICI' },
    sbi: { bg: '#280071', text: '#FFFFFF', label: 'SBI' },
    axis: { bg: '#97144d', text: '#FFFFFF', label: 'AXIS' },
    kotak: { bg: '#e01e26', text: '#FFFFFF', label: 'KOTAK' },
    pnb: { bg: '#a20a3a', text: '#FFFFFF', label: 'PNB' },
  };
  const cfg = configs[code] || { bg: '#333333', text: '#FFFFFF', label: 'BANK' };

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[9px] shadow-xs shrink-0"
        style={{ backgroundColor: cfg.bg, color: cfg.text }}
      >
        {cfg.label.substring(0, 3)}
      </div>
      <span className="text-xs font-semibold text-zinc-900 truncate">{name}</span>
    </div>
  );
};
