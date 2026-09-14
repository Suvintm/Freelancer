import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, SlidersHorizontal, X } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';

interface CookieRenewalBadgeProps {
  onOpenPreferences: () => void;
}

export const CookieRenewalBadge: React.FC<CookieRenewalBadgeProps> = ({ onOpenPreferences }) => {
  const { isDarkMode } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 z-40 max-w-xs"
      >
        <div
          className={`flex items-center gap-2 p-2.5 rounded-2xl border shadow-lg text-xs ${
            isDarkMode
              ? 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200 backdrop-blur-md shadow-black/50'
              : 'bg-white/95 border-zinc-300 text-zinc-800 backdrop-blur-md shadow-zinc-400/30'
          }`}
        >
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Clock size={14} />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <p className="font-semibold text-[11px] truncate">Consent expiring soon</p>
            <p className={`text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Renew choices for DPDP compliance
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPreferences}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors shrink-0"
            title="Review Preferences"
          >
            <SlidersHorizontal size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className={`p-1 rounded-lg transition-colors shrink-0 ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'
            }`}
            title="Dismiss reminder"
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
