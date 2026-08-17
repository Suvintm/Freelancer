import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Template } from '../../types/template.types';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { X, Smartphone, Laptop, ArrowRight } from 'lucide-react';

interface TemplatePreviewModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [device, setDevice] = useState<'mobile' | 'laptop'>('mobile');

  // Prevent background body scroll when preview modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        onWheel={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
        />

        {/* Modal Window (Fixed Height, No outer scroll) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          data-lenis-prevent="true"
          className="relative z-50 w-full max-w-3xl h-[88vh] max-h-[660px] flex flex-col rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Top Bar Header */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-zinc-900/70 shrink-0">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {template.name}
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {template.defaultBlocks?.length || 0} blocks • Live Device Simulation
                </span>
              </div>
            </div>

            {/* Device Switcher (Mobile vs Laptop) */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/70 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  device === 'mobile'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>

              <button
                onClick={() => setDevice('laptop')}
                className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  device === 'laptop'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Laptop View"
              >
                <Laptop className="w-3 h-3" />
                <span>Laptop</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[11px] font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Device Preview Canvas Area (Overflow-hidden, Internal scroll only) */}
          <div 
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 overflow-hidden p-4 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center relative"
          >
            {device === 'mobile' ? (
              /* ── EXACT SMARTPHONE MOCKUP (Internal Scroll Only) ── */
              <div className="relative w-[230px] sm:w-[245px] h-[450px] sm:h-[475px] rounded-[38px] bg-black p-[5.5px] shadow-2xl border-[3px] border-zinc-700/90 flex flex-col shrink-0">
                
                {/* Outer Screen */}
                <div className="w-full h-full rounded-[32px] bg-white dark:bg-[#09090b] overflow-hidden relative flex flex-col">
                  
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full z-40 shadow-xs flex items-center justify-end px-1.5 pointer-events-none">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                  </div>

                  {/* Top Status Bar */}
                  <div className="absolute top-1.5 left-4 right-4 flex justify-between items-center text-[7.5px] font-bold text-slate-400 dark:text-zinc-500 z-30 pointer-events-none">
                    <span>9:41</span>
                    <span>5G</span>
                  </div>

                  {/* Internal Scrollable Content (User scrolls inside phone) */}
                  <div 
                    data-lenis-prevent="true"
                    onWheel={(e) => e.stopPropagation()}
                    className="w-full h-full overflow-y-auto no-scrollbar pt-7 px-3 pb-8 flex flex-col space-y-2 overscroll-contain"
                  >
                    {template.defaultBlocks?.map((block) => (
                      <BlockRenderer
                        key={block.id}
                        block={block}
                        theme={template.defaultTheme}
                      />
                    ))}
                  </div>

                  {/* Bottom iOS Home Indicator Bar */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-400/80 dark:bg-zinc-600 rounded-full z-40 pointer-events-none" />

                </div>
              </div>
            ) : (
              /* ── REALISTIC LAPTOP MOCKUP (Internal Scroll Only) ── */
              <div className="flex flex-col items-center shrink-0">
                
                {/* Laptop Screen Bezel Lid */}
                <div className="w-[450px] sm:w-[510px] h-[280px] sm:h-[310px] rounded-t-2xl bg-zinc-950 p-[5px] pb-0 border-[2.5px] border-zinc-700/90 shadow-2xl flex flex-col">
                  
                  {/* Laptop Web Screen */}
                  <div className="w-full h-full rounded-t-xl bg-white dark:bg-[#09090b] overflow-hidden flex flex-col">
                    
                    {/* Browser Chrome Header */}
                    <div className="h-6 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-2.5 shrink-0">
                      {/* Window Traffic Dots */}
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>

                      {/* Mock URL Bar */}
                      <div className="px-3 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[8.5px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                        <span>🔒 suvix.me/{template.category}</span>
                      </div>

                      <div className="w-8" />
                    </div>

                    {/* Internal Scrollable Laptop Screen */}
                    <div 
                      data-lenis-prevent="true"
                      onWheel={(e) => e.stopPropagation()}
                      className="flex-1 overflow-y-auto no-scrollbar p-3.5 flex flex-col items-center overscroll-contain"
                    >
                      <div className="w-full max-w-[280px] space-y-2">
                        {template.defaultBlocks?.map((block) => (
                          <BlockRenderer
                            key={block.id}
                            block={block}
                            theme={template.defaultTheme}
                          />
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Laptop Aluminum Base & Notch */}
                <div className="w-[490px] sm:w-[550px] h-[9px] bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 rounded-b-md shadow-xl flex items-center justify-center relative">
                  <div className="w-12 h-1 bg-zinc-700 rounded-b-sm" />
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
