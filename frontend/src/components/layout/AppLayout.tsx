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
  const isFullPage = isExplorePage || isNotificationsPage || isChatPage || isCreatorToolsPage;
  const isNoPaddingMobile = isFullPage || isProfilePage || isNearbyPage || isHomePage;
  const { isDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-page flex flex-col font-sans overflow-hidden">
      {/* Global Top Navbar (Fixed) - Hidden on Mobile for Explore/Notifications/Profile/Nearby */}
      <div className={(isFullPage || isProfilePage || isNearbyPage) ? "hidden lg:block" : "block"}>
        <GlobalHeader onMenuPress={() => setIsMobileMenuOpen(true)} />
      </div>

      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Column: Identity Sidebar (Desktop Only) */}
        <div className="hidden xl:flex w-[320px] h-full flex-shrink-0 border-r border-border-main/60 bg-page">
          <Sidebar />
        </div>

        {/* 2. Middle Column: Main Feed Container */}
        <div className="flex-1 min-w-0 h-full flex flex-col relative bg-page lg:py-4 lg:px-2">
          {/* Real-time background sync progress tracker */}
          <SyncProgressBar />
          
          <GlobalUploadProgress />

          {/* Floating Canvas with Rounded Corners */}
          <div className={`w-full h-full lg:rounded-[48px] border-b lg:border border-border-main shadow-xl dark:shadow-2xl flex flex-col relative overflow-hidden transition-colors duration-300 ${isFullPage || location.pathname === '/home' ? (isDarkMode ? 'bg-[#000000]' : 'bg-white') : 'bg-container'}`}>
            {location.pathname === '/nearby' || location.pathname === '/communication-hub' ? (
              <div className="w-full h-full relative overflow-hidden">
                {children}
              </div>
            ) : (
              <ReactLenis className="flex-1 overflow-y-auto scrollbar-hide">
                <main className="w-full h-full">
                  <div className={isNoPaddingMobile ? "w-full min-h-full lg:max-w-4xl lg:mx-auto lg:px-0 lg:pt-0 lg:pb-32 pb-32" : "max-w-4xl mx-auto px-4 pt-5 lg:pt-6 lg:px-8 lg:pb-32 pb-32"}>
                    {children}
                  </div>
                </main>
              </ReactLenis>
            )}

            {/* Premium Aesthetic Overlays */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] ring-1 ring-inset ring-text-main/5" />
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] shadow-inner opacity-20 dark:opacity-50" />
          </div>
        </div>

        {/* 3. Right Column: Navigation Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-[280px] h-full flex-shrink-0 border-l border-border-main/60 bg-page">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Persistent) */}
      {!(isChatPage && hasActiveChat) && <BottomNav />}
    </div>
  );
};
