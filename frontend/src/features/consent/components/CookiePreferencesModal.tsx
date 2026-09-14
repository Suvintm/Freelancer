import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Users,
  BarChart2,
  Megaphone,
  Sliders,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ConsentCategories } from '../types/consent.types';
import { CONSENT_CATEGORIES_INFO } from '../constants/consentConfig';
import roleMobileBg from '../../../assets/rolemobilebg.png';
import blackLogo from '../../../assets/blackbglogo.png';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategories?: ConsentCategories;
  onSave: (categories: Partial<ConsentCategories>, isMinor?: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  currentCategories,
  onSave,
  onAcceptAll,
  onRejectAll,
}) => {
  const [categories, setCategories] = useState<ConsentCategories>({
    necessary: true,
    analytics: currentCategories?.analytics ?? false,
    functional: currentCategories?.functional ?? false,
    marketing: currentCategories?.marketing ?? false,
  });

  const [isMinor, setIsMinor] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Body Scroll Lock & Lenis Scroll Protection when Modal is Open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && currentCategories) {
      setCategories({
        necessary: true,
        analytics: currentCategories.analytics,
        functional: currentCategories.functional,
        marketing: currentCategories.marketing,
      });
    }
  }, [isOpen, currentCategories]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleCategory = (id: keyof ConsentCategories) => {
    if (id === 'necessary') return; // Cannot toggle strictly necessary
    setCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCustom = () => {
    onSave(categories, isMinor);
    onClose();
  };

  // Icon mapping for categories
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'necessary':
        return <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
      case 'analytics':
        return <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
      case 'marketing':
        return <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
      case 'functional':
        return <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
      default:
        return <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 dark:text-zinc-200 shrink-0" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden overscroll-contain"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container — Matching Image 2 with Mobile Optimizations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col md:flex-row rounded-[24px] sm:rounded-[28px] border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl shadow-black/80 overflow-hidden z-10 overscroll-contain"
          >
            {/* ── LEFT PANEL: Dark Branding Hero with rolemobilebg.png ──────────────── */}
            <div className="w-full md:w-[310px] lg:w-[340px] shrink-0 bg-black text-white relative flex flex-col justify-between p-4 sm:p-5 md:p-7 overflow-hidden">
              {/* Background Image: rolemobilebg.png */}
              <img
                src={roleMobileBg}
                alt="SuviX background"
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none mix-blend-screen scale-105"
              />
              {/* Dark Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/95 pointer-events-none" />

              {/* Top Branding (Condensed on mobile, full on desktop) */}
              <div className="relative z-10">
                <div className="flex items-center justify-between md:block">
                  <img
                    src={blackLogo}
                    alt="SuviX"
                    className="h-6 sm:h-7 md:h-9 w-auto object-contain mb-1.5 md:mb-6 drop-shadow-md"
                  />
                  <p className="md:hidden text-[9px] tracking-widest text-zinc-400 uppercase font-bold">
                    YOUR DATA. YOUR CHOICE.
                  </p>
                </div>

                <p className="hidden md:block text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
                  YOUR DATA. YOUR CHOICE.
                </p>

                <h2 className="text-sm sm:text-base md:text-3xl font-bold md:font-extrabold text-white leading-tight md:leading-[1.15] mt-1 md:mt-2 mb-1 md:mb-3 tracking-tight">
                  <span className="hidden md:inline">Privacy<br />Builds<br />Stronger<br />Communities</span>
                  <span className="md:hidden">Privacy Builds Stronger Communities</span>
                </h2>

                <p className="text-[11px] md:text-xs text-zinc-300/90 leading-snug md:leading-relaxed line-clamp-1 sm:line-clamp-2 md:line-clamp-none mb-1 md:mb-6 font-normal">
                  We're committed to being transparent about how we use data, so you can have a
                  safer, better, and more personalized experience on SuviX.
                </p>

                {/* Feature Highlights (Hidden on mobile to keep category controls immediately visible) */}
                <div className="hidden md:flex flex-col space-y-3.5 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                      <Shield size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Secure &amp; Compliant</h4>
                      <p className="text-[11px] text-zinc-400">India DPDP Act 2023 / 2025</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                      <Lock size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Your Control</h4>
                      <p className="text-[11px] text-zinc-400">Manage anytime</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                      <Users size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">A Better Experience</h4>
                      <p className="text-[11px] text-zinc-400">Relevant and meaningful</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Script Signature (Hidden on mobile) */}
              <div className="hidden md:block relative z-10 pt-6 mt-4 border-t border-white/10">
                <p className="font-['Caveat',cursive] text-lg sm:text-xl text-white/95 tracking-wide transform -rotate-2">
                  Creators Build a Brighter Tomorrow
                </p>
              </div>
            </div>

            {/* ── RIGHT PANEL: Preferences & Categories ─────────────────────────── */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 flex flex-col justify-between overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overscroll-contain"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 md:p-7 pb-2.5 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate sm:text-wrap">
                    SuviX Privacy &amp; Cookie Preferences
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    Compliant with India DPDP Act 2023 / 2025 &amp; GDPR
                  </p>
                  <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none">
                    We use cookies and similar technologies to provide, protect, and improve SuviX.
                    You can choose which categories you allow and update your preferences anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Categories Body (Isolated scrolling with overscroll-contain & data-lenis-prevent) */}
              <div
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-7 space-y-3 text-xs overscroll-contain"
              >
                {CONSENT_CATEGORIES_INFO.map((cat) => {
                  const isChecked = categories[cat.id];
                  const isLocked = cat.required;
                  const isExpanded = expandedCategoryId === cat.id;

                  const displayTitle =
                    cat.id === 'functional' ? 'Personalization & Preferences' : cat.name;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 sm:p-4 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          {getCategoryIcon(cat.id)}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                              {displayTitle}
                            </span>
                            {cat.required && (
                              <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                Always Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Toggle Switch & Chevron */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {/* Switch */}
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => toggleCategory(cat.id)}
                            aria-label={`Toggle ${cat.name}`}
                            className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isLocked
                                ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed opacity-70'
                                : isChecked
                                ? 'bg-zinc-900 dark:bg-emerald-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isLocked || isChecked
                                  ? 'translate-x-4 sm:translate-x-5'
                                  : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Expand Details Chevron */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCategoryId(isExpanded ? null : cat.id)
                            }
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </div>

                      <p className="mt-1.5 text-[11px] sm:text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {cat.description}
                      </p>

                      {/* Collapsible Examples Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 text-[10.5px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 overflow-hidden"
                          >
                            <p className="font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                              Active cookies &amp; data elements:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {cat.examples.map((ex, i) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Notice for users under 18 */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3 sm:p-4 text-[11px] sm:text-[11.5px] leading-relaxed">
                  <div className="flex items-start gap-2 sm:gap-2.5 text-zinc-800 dark:text-zinc-200 font-medium">
                    <Info size={15} className="shrink-0 mt-0.5 text-zinc-600 dark:text-zinc-400" />
                    <div>
                      <span className="font-bold">Notice for users under 18:</span> Under India DPDP
                      Rules, tracking cookies and targeted advertising are strictly prohibited for minors.
                      <label className="flex items-center gap-2 mt-1.5 font-medium cursor-pointer text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={isMinor}
                          onChange={(e) => {
                            setIsMinor(e.target.checked);
                            if (e.target.checked) {
                              setCategories((prev) => ({
                                ...prev,
                                analytics: false,
                                marketing: false,
                              }));
                            }
                          }}
                          className="rounded accent-black dark:accent-white"
                        />
                        I am under 18 years of age (automatically disables tracking &amp; advertising)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Row */}
              <div className="p-3.5 sm:p-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col lg:flex-row items-center justify-between gap-3">
                {/* Left Links */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    className="hover:text-zinc-900 dark:hover:text-white underline inline-flex items-center gap-0.5 transition-colors"
                  >
                    Privacy Policy <ExternalLink size={10} />
                  </Link>
                  <span>•</span>
                  <Link
                    to="/terms"
                    target="_blank"
                    className="hover:text-zinc-900 dark:hover:text-white underline inline-flex items-center gap-0.5 transition-colors"
                  >
                    Terms &amp; Conditions <ExternalLink size={10} />
                  </Link>
                  <span>•</span>
                  <span>Audit: 7 years</span>
                </div>

                {/* Right Action Buttons */}
                <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRejectAll();
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Reject Non-Essential
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Save Preferences
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAcceptAll();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
