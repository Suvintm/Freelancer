import { ReactLenis } from 'lenis/react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isExplorePage = location.pathname === '/explore';

  return (
    <div className="h-screen w-full bg-page flex flex-col font-sans overflow-hidden">
      {/* Global Top Navbar (Fixed) - Hidden on Explore */}
      {!isExplorePage && <GlobalHeader />}

      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Column: Identity Sidebar (Desktop Only) - Hidden on Explore */}
        {!isExplorePage && (
          <div className="hidden xl:flex w-[400px] h-full flex-shrink-0">
            <Sidebar />
          </div>
        )}

        {/* 2. Middle Column: Main Feed Container */}
        <div className="flex-1 min-w-0 h-full flex flex-col relative lg:py-4 lg:px-2">
          {/* 
              MOBILE: Edge-to-edge (no margins, no rounded corners)
              DESKTOP: Floating canvas (margins + rounded corners)
          */}
          <div className="w-full h-full bg-container lg:rounded-[48px] border-b lg:border border-border-main shadow-xl dark:shadow-2xl flex flex-col relative overflow-hidden">
            <ReactLenis className="flex-1 overflow-y-auto scrollbar-hide bg-page/30">
              <main className="w-full h-full">
                <div className={isExplorePage ? "w-full min-h-full" : "max-w-screen-2xl mx-auto px-4 pt-1 lg:pt-3 lg:px-6 lg:pb-32 pb-32"}>
                  {children}
                </div>
              </main>
            </ReactLenis>

            {/* Premium Aesthetic Overlays (Only visible on Desktop canvas) */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] ring-1 ring-inset ring-text-main/5" />
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] shadow-inner opacity-20 dark:opacity-50" />
          </div>
        </div>

        {/* 3. Right Column: Navigation Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-[280px] h-full flex-shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Persistent) */}
      <BottomNav />
    </div>
  );
};
