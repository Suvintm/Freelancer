import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight,
  X 
} from 'lucide-react';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle?: string;
  username: string;
  slug?: string;
  onNavigateToDashboard?: () => void;
}

export const PublishSuccessModal: React.FC<PublishSuccessModalProps> = ({
  isOpen,
  onClose,
  pageTitle: _pageTitle,
  username,
  slug,
  onNavigateToDashboard,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
  const path = `/u/${username}${slug && slug !== 'main' ? `/${slug}` : ''}`;
  const brandedUrl = `suvix.in${path}`;
  const liveHref = isLocalhost ? path : `https://${brandedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${brandedUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 select-none font-sans text-slate-900 dark:text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Icon & Glow */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-950 shadow-sm animate-bounce">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Your Bio Page is Live!
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Your modifications and customized design have been saved and published. Visitors will now see this latest version.
            </p>

            {/* Live URL Pill Box */}
            <div className="w-full mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                  Public Live URL
                </span>
                <span className="text-xs font-mono font-semibold text-slate-900 dark:text-zinc-200 truncate">
                  {brandedUrl}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-zinc-700 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions Grid */}
            <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
              <a
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer no-underline"
              >
                <span>View Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onNavigateToDashboard || onClose}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Pro Tip */}
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-4">
              Tip: Any future edits in the Studio can be saved as a draft or published instantly with zero downtime.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PublishSuccessModal;
