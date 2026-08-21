import React, { useState } from 'react';
import type { EmailCaptureConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { Mail, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailCaptureBlockProps {
  config: EmailCaptureConfig;
  theme?: Theme;
}

export const EmailCaptureBlock: React.FC<EmailCaptureBlockProps> = ({ config, theme: _theme }) => {
  const {
    title = 'Join My VIP Newsletter',
    subtitle = 'Get exclusive content, early access, and secret tips directly to your inbox.',
    buttonText = 'Subscribe',
    successMessage = 'You’re on the list! Check your inbox soon. ✨',
  } = config;

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubmitted(true);
  };

  return (
    <div className="w-full my-2 p-3.5 sm:p-4 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-100 dark:border-white/10 select-none overflow-hidden relative font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 text-left">
        <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Mail className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[9px] text-slate-500 line-clamp-2 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-3 px-2 text-center flex flex-col items-center justify-center bg-sky-50 rounded-xl border border-sky-200 mt-2"
          >
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-sky-900">
              {successMessage}
            </span>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="mt-2.5 flex items-center gap-1.5"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
            <button
              type="submit"
              className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmailCaptureBlock;
