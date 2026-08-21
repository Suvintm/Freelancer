import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileVariant } from '../../types/block.types';
import { 
  HeaderVariantPreviewCard, 
  HEADER_VARIANTS_METADATA 
} from './HeaderVariantPreviewCard';
import { X, Sparkles, Wand2 } from 'lucide-react';

interface HeaderVariantGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVariant?: ProfileVariant;
  onSelectVariant: (variant: ProfileVariant) => void;
  avatarUrl?: string;
  name?: string;
  handle?: string;
  bio?: string;
}

export const HeaderVariantGalleryModal: React.FC<HeaderVariantGalleryModalProps> = ({
  isOpen,
  onClose,
  currentVariant = 'centered',
  onSelectVariant,
  avatarUrl,
  name,
  handle,
  bio,
}) => {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-lenis-prevent', 'true');

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.removeAttribute('data-lenis-prevent');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none font-sans"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99998]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.28 }}
          data-lenis-prevent="true"
          className="relative z-[99999] w-full max-w-4xl max-h-[86vh] flex flex-col rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden overscroll-contain my-auto"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Choose Profile Header Style
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                    Figma / Canva Switcher
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Select a layout structure. Your name, avatar, bio, and social links are 100% preserved.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cards Grid */}
          <div 
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/40 dark:bg-zinc-950/40 no-scrollbar overscroll-contain"
          >
            {HEADER_VARIANTS_METADATA.map((meta) => {
              const isSelected = currentVariant === meta.id;

              return (
                <HeaderVariantPreviewCard
                  key={meta.id}
                  variantMeta={meta}
                  isSelected={isSelected}
                  onSelect={(v) => {
                    onSelectVariant(v);
                    onClose();
                  }}
                  avatarUrl={avatarUrl}
                  name={name}
                  handle={handle}
                  bio={bio}
                />
              );
            })}
          </div>

          {/* Bottom Footer Info */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111114] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>All variants support circular, squircle, and custom banner imagery.</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
