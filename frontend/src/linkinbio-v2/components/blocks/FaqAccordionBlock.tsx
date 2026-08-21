import React, { useState } from 'react';
import type { FaqAccordionConfig, FaqItem } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqAccordionBlockProps {
  config: FaqAccordionConfig;
  theme?: Theme;
}

export const FaqAccordionBlock: React.FC<FaqAccordionBlockProps> = ({ config, theme: _theme }) => {
  const {
    heading = 'Frequently Asked Questions',
    items = [
      {
        id: 'faq_1',
        question: 'How do I book a 1-on-1 collaboration?',
        answer: 'You can reach out via my email or WhatsApp link above for sponsorships, brand partnerships, or mentorship.',
      },
      {
        id: 'faq_2',
        question: 'Where can I find your free resources?',
        answer: 'Check out the links above for my free starter templates, design kits, and GitHub repositories!',
      },
    ],
  } = config;

  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full my-2 p-3 sm:p-4 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-100 dark:border-white/10 select-none overflow-hidden font-sans text-left">
      
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <HelpCircle className="w-4 h-4 text-[#4D6234]" />
        <h4 className="font-extrabold text-xs text-slate-900 tracking-tight">
          {heading}
        </h4>
      </div>

      {/* Accordion Stack */}
      <div className="space-y-1.5">
        {items.map((item: FaqItem) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="w-full p-2.5 flex items-center justify-between text-left gap-2 cursor-pointer hover:bg-slate-100/60 transition-colors"
              >
                <span className="font-bold text-[10.5px] text-slate-800 leading-snug">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-slate-900' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 pb-2.5 pt-0.5 text-[9.5px] text-slate-600 leading-relaxed border-t border-slate-200/50">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default FaqAccordionBlock;
