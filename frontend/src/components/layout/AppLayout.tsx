import { ReactLenis } from 'lenis/react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';
import { MobileSidebar } from './MobileSidebar';
import { useTheme } from '../../hooks/useTheme';
import { useState } from 'react';
import { SyncProgressBar } from './SyncProgressBar';
import { GlobalUploadProgress } from './GlobalUploadProgress';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AskSuvixProvider, useAskSuvix } from '../../context/AskSuvixContext';
import { useUserRole } from '../../hooks/useUserRole';
import { ExpandedAskSuvixPanel } from './ExpandedAskSuvixPanel';

import { UnlinkedChannelBanner } from '../yt_creator/UnlinkedChannelBanner';
import { UnlinkedChannelModal } from '../yt_creator/UnlinkedChannelModal';

const AppLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isCreator } = useUserRole();

  const isHomePage = location.pathname === '/home' || location.pathname.startsWith('/stories');
  const isExplorePage = location.pathname === '/explore';
  const isNotificationsPage = location.pathname === '/notifications';
  const isProfilePage = location.pathname === '/profile';
  const isNearbyPage = location.pathname === '/nearby';
  const isChatPage = location.pathname === '/communication-hub';
  const hasActiveChat = searchParams.has('userId');
  const isCreatorToolsPage = location.pathname === '/creator-tools';
  const isLinkInBioStudio = location.pathname.startsWith('/link-in-bio/studio') || location.pathname.startsWith('/link-in-bio/design');
  const isLinkInBioPage = location.pathname === '/link-in-bio';
  const isCommunityPage = location.pathname.startsWith('/community');
  const isSubscriptionPage = location.pathname === '/subscription';
  const isConnectedAppsPage = location.pathname === '/connected-apps' || location.pathname === '/connected-accounts';

  // Specifically detect creator profile URLs (including /creator/:userId, /channel/:channelId, and /profile when user is creator)
  const isCreatorProfileUrl =
    location.pathname.startsWith('/creator/') ||
    location.pathname.startsWith('/channel/') ||
    (isProfilePage && isCreator);

  const isFullPage = isExplorePage || isNotificationsPage || isChatPage || isCreatorToolsPage || isCommunityPage || isLinkInBioPage || isLinkInBioStudio || isSubscriptionPage;
  const isNoPaddingMobile = isFullPage || isProfilePage || isNearbyPage || isHomePage;
  const { isDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isExpanded: isAskSuvixExpanded, closeAskSuvix } = useAskSuvix();

  return (
    <div className={`h-screen w-full ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} flex flex-col font-sans overflow-hidden relative`}>
      {/* ── Global Fullscreen Lock Overlay (covering left 50% & entire workspace) ── */}
      <AnimatePresence>
        {isAskSuvixExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={closeAskSuvix}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2.5px] cursor-pointer select-none flex items-center"
          >
            {/* Centered Lock Badge in the dimmed left 50% area */}
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center lg:pr-[50vw]">
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center pointer-events-auto max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Circular Lock Icon Badge with Glow */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border border-white/30 bg-black/50 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                  <Lock size={26} className="text-white" strokeWidth={2.2} />
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Ask SuviX is open
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-300 text-center max-w-[280px] sm:max-w-xs mt-1.5 leading-relaxed font-medium">
                  The rest of the page is locked while you chat with SuviX. Close the assistant to continue.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 50% Full-Height Edge-to-Edge Expanded Ask SuviX Slide Panel ── */}
      <AnimatePresence>
        {isAskSuvixExpanded && (
          <motion.div
            initial={{ x: '100%', opacity: 0.7 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '100%', opacity: 0.7 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[85vw] md:w-[65vw] lg:w-[50vw] xl:w-[50vw] 2xl:w-[50vw] h-screen z-[60] p-2 sm:p-3 lg:p-3.5 xl:p-4 pointer-events-none flex justify-end items-center"
            data-lenis-prevent="true"
          >
            <div className="w-full h-full pointer-events-auto">
              <ExpandedAskSuvixPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlinked Creator Persistent Lock Modal */}
      <UnlinkedChannelModal />

      {/* Global Top Navbar (Fixed) - Hidden on Studio & Mobile */}
      <div className={isLinkInBioStudio ? "hidden" : (isFullPage || isProfilePage || isNearbyPage) ? "hidden lg:block" : "block"}>
        <GlobalHeader onMenuPress={() => setIsMobileMenuOpen(true)} />
      </div>

      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Unlinked Creator Warning Banner */}
      {!isLinkInBioStudio && <UnlinkedChannelBanner />}

      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Column: Navigation Sidebar (Desktop Only) */}
        <div className={`hidden lg:block w-[204px] xl:w-[224px] h-full flex-shrink-0 relative z-[30] p-2 xl:p-2.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <RightSidebar />
        </div>

        {/* 2. Middle Column: Main Feed Container (Direct, borderless, zero unwanted padding/margin) */}
        <div className={`flex-1 min-w-0 h-full flex flex-col relative ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} p-0 overflow-hidden`}>
          <div className="flex-1 min-w-0 h-full flex flex-col relative p-0 overflow-hidden">
            {/* Real-time background sync progress tracker */}
            <SyncProgressBar />
            
            <GlobalUploadProgress />

            {/* Main Page Canvas */}
            <div className={`w-full h-full flex flex-col relative overflow-hidden transition-colors duration-300 ${isFullPage || isHomePage ? (isDarkMode ? 'bg-[#000000]' : 'bg-white') : 'bg-container'}`}>
              {location.pathname === '/nearby' || location.pathname === '/communication-hub' || location.pathname.startsWith('/community/') || isLinkInBioPage || isLinkInBioStudio || isCreatorProfileUrl || isProfilePage ? (
                <div className="w-full h-full relative overflow-hidden flex flex-col">
                  {children}
                </div>
              ) : (
                <ReactLenis 
                  root={false} 
                  className="flex-1 overflow-y-auto scrollbar-hide"
                  options={{
                    lerp: 0.1,
                    wheelMultiplier: 1.0,
                    touchMultiplier: 1.2,
                    smoothWheel: true,
                    syncTouch: false,
                    autoResize: true,
                  }}
                >
                  <main className="w-full h-full">
                    <div className={
                      isHomePage || isSubscriptionPage || isCreatorProfileUrl || isConnectedAppsPage
                        ? "w-full min-h-full pb-20 sm:pb-32"
                        : (isNoPaddingMobile ? "w-full min-h-full lg:max-w-4xl lg:mx-auto lg:px-0 lg:pt-0 lg:pb-32 pb-32" : "max-w-4xl mx-auto px-4 pt-5 lg:pt-6 lg:px-8 lg:pb-32 pb-32")
                    }>
                      {children}
                    </div>
                  </main>
                </ReactLenis>
              )}
            </div>
          </div>
        </div>

        {/* 3. Right Column: Identity Sidebar (Desktop Only) - Disabled on Creator Profile URLs */}
        {!isFullPage && !isCreatorProfileUrl && (
          <div className={`hidden xl:flex w-[320px] 2xl:w-[330px] h-full flex-shrink-0 border-none relative z-20 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'}`}>
            <Sidebar />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Persistent) */}
      {!(isChatPage && hasActiveChat) && !isLinkInBioStudio && <BottomNav />}
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AskSuvixProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AskSuvixProvider>
  );
};

