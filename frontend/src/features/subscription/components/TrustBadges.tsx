import React from 'react';
import { ShieldCheck, Lock, RotateCcw } from 'lucide-react';

interface TrustBadgesProps {
  isDarkMode?: boolean;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ isDarkMode = false }) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 pt-2 text-[10px] ${
        isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
      }`}
    >
      <div className="flex items-center gap-1">
        <RotateCcw className="w-3 h-3 text-zinc-400 shrink-0" />
        <span>14-day refund guarantee</span>
      </div>

      <div className="flex items-center gap-1">
        <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
        <span>256-bit encryption</span>
      </div>

      <div className="flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-zinc-400 shrink-0" />
        <span>RBI & PCI-DSS compliant</span>
      </div>
    </div>
  );
};
