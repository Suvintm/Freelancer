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

import { UnlinkedChannelBanner } from '../yt_creator/UnlinkedChannelBanner';
import { UnlinkedChannelModal } from '../yt_creator/UnlinkedChannelModal';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isHomePage = location.pathname === '/home';
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
  const isFullPage = isExplorePage || isNotificationsPage || isChatPage || isCreatorToolsPage || isCommunityPage || isLinkInBioPage || isLinkInBioStudio || isSubscriptionPage;
  const isNoPaddingMobile = isFullPage || isProfilePage || isNearbyPage || isHomePage;
  const { isDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`h-screen w-full ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} flex flex-col font-sans overflow-hidden`}>
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
        <div className={`hidden lg:block w-[80px] h-full flex-shrink-0 relative z-[60] ${isDarkMode ? 'bg-[#000000]' : 'bg-white'}`}>
          <RightSidebar />
        </div>

        {/* 2. Middle Column: Main Feed Container with Rounded Outer Frame */}
        <div className={`flex-1 min-w-0 h-full flex flex-col relative ${isDarkMode ? 'bg-[#000000]' : 'bg-white'} ${isLinkInBioStudio ? 'p-0' : 'lg:p-2'}`}>
          <div className={`flex-1 min-w-0 h-full flex flex-col relative ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'} ${isLinkInBioStudio ? 'rounded-none p-0' : 'lg:rounded-[52px] lg:p-3.5'} overflow-hidden transition-colors duration-300`}>
            {/* Real-time background sync progress tracker */}
            <SyncProgressBar />
            
            <GlobalUploadProgress />

            {/* Floating Canvas with Rounded Corners */}
            <div className={`w-full h-full ${isLinkInBioStudio ? 'rounded-none border-none shadow-none' : 'lg:rounded-[40px] border-b lg:border border-border-main shadow-xl dark:shadow-2xl'} flex flex-col relative overflow-hidden transition-colors duration-300 ${isFullPage || location.pathname === '/home' ? (isDarkMode ? 'bg-[#000000]' : 'bg-white') : 'bg-container'}`}>
              {location.pathname === '/nearby' || location.pathname === '/communication-hub' || location.pathname.startsWith('/community/') || isLinkInBioPage || isLinkInBioStudio ? (
                <div className="w-full h-full relative overflow-hidden">
                  {children}
                </div>
              ) : (
                <ReactLenis className="flex-1 overflow-y-auto scrollbar-hide">
                  <main className="w-full h-full">
                    <div className={
                      location.pathname === '/home' || isSubscriptionPage
                        ? "w-full min-h-full pb-32"
                        : (isNoPaddingMobile ? "w-full min-h-full lg:max-w-4xl lg:mx-auto lg:px-0 lg:pt-0 lg:pb-32 pb-32" : "max-w-4xl mx-auto px-4 pt-5 lg:pt-6 lg:px-8 lg:pb-32 pb-32")
                    }>
                      {children}
                    </div>
                  </main>
                </ReactLenis>
              )}

              {/* Premium Aesthetic Overlays */}
              {!isLinkInBioStudio && (
                <>
                  <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[40px] ring-1 ring-inset ring-text-main/5" />
                  <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[40px] shadow-inner opacity-20 dark:opacity-50" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Right Column: Identity Sidebar (Desktop Only) */}
        {!isFullPage && (
          <div className={`hidden xl:flex w-[320px] h-full flex-shrink-0 border-l border-border-main/60 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'}`}>
            <Sidebar />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Persistent) */}
      {!(isChatPage && hasActiveChat) && !isLinkInBioStudio && <BottomNav />}
    </div>
  );
};
