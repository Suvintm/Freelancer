import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import whiteBgLogo from '../../../assets/whitebglogo.png';
import { useConsent } from '../hooks/useConsent';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { CookieRenewalBadge } from './CookieRenewalBadge';
import { initGoogleConsentModeDefaults } from '../services/scriptLoader';

export const CookieConsentBanner: React.FC = () => {
  const {
    consent,
    isBannerVisible,
    isPreferencesModalOpen,
    isSoftRenewalDue,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    openPreferences,
    closePreferences,
  } = useConsent();

  const [isDismissedTemporarily, setIsDismissedTemporarily] = useState(false);

  // Initialize Google Consent Mode with denied defaults on first mount
  useEffect(() => {
    initGoogleConsentModeDefaults();
  }, []);

  const showBanner = isBannerVisible && !isDismissedTemporarily;

  return (
    <>
      {/* 1. Main Bottom Consent Banner (Matching Design from Image 1) */}
      <AnimatePresence>
        {showBanner && (
          <motion.aside
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 sm:bottom-6 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
            aria-label="Cookie consent banner"
          >
            <div className="relative w-full max-w-4xl bg-[#111113]/95 border border-zinc-800/90 rounded-[22px] p-4 sm:p-5 shadow-2xl shadow-black/70 backdrop-blur-xl pointer-events-auto text-white">
              {/* Close 'X' Button at top-right corner */}
              <button
                type="button"
                onClick={() => setIsDismissedTemporarily(true)}
                className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pr-6 sm:pr-0">
                {/* Left Side: SuviX Logo + Content */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {/* Top Logo & Label */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={whiteBgLogo}
                      alt="SuviX"
                      className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      • WE VALUE YOUR PRIVACY
                    </span>
                  </div>

                  {/* Text Block */}
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Your data, your choice
                    </h3>
                    <p className="text-[11.5px] sm:text-[12px] text-zinc-400 leading-relaxed max-w-xl">
                      SuviX uses cookies to ensure a better experience, analyze platform performance,
                      and support creator discovery. You can accept all cookies or manage your preferences.{' '}
                      <Link
                        to="/privacy-policy"
                        className="text-zinc-300 hover:text-white underline inline-flex items-center gap-0.5 font-medium transition-colors"
                      >
                        Learn more <ExternalLink size={10} className="inline ml-0.5 opacity-80" />
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Right Side: Action Buttons (Customize, Reject All, Accept All) */}
                <div className="w-full lg:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0 pt-2 lg:pt-0">
                  {/* Customize */}
                  <button
                    type="button"
                    onClick={openPreferences}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Customize</span>
                  </button>

                  {/* Reject Non-Essential / Only Essential Cookies */}
                  <button
                    type="button"
                    onClick={() => rejectNonEssential()}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Only Essential Cookies
                  </button>

                  {/* Accept All */}
                  <button
                    type="button"
                    onClick={() => acceptAll()}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. Soft 150-Day Renewal Reminder Badge */}
      {!showBanner && isSoftRenewalDue && (
        <CookieRenewalBadge onOpenPreferences={openPreferences} />
      )}

      {/* 3. Detailed Preferences Modal */}
      <CookiePreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={closePreferences}
        currentCategories={consent?.categories}
        onSave={(cats, isMinor) => saveCustomPreferences(cats, consent?.userRole, isMinor)}
        onAcceptAll={() => acceptAll(consent?.userRole)}
        onRejectAll={() => rejectNonEssential(consent?.userRole)}
      />
    </>
  );
};
