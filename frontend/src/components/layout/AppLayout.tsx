import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-full bg-page flex flex-col overflow-hidden font-sans">
      {/* Global Top Navbar (Responsive Mobile/Desktop modes) */}
      <GlobalHeader />

      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Column: Identity Sidebar (Desktop Only) */}
        <div className="hidden xl:flex w-72 h-full flex-shrink-0">
          <Sidebar />
        </div>

        {/* 2. Middle Column: Main Feed Container */}
        <div className="flex-1 h-full flex flex-col overflow-hidden relative lg:py-4 lg:px-2">
          {/* 
              MOBILE: Edge-to-edge (no margins, no rounded corners)
              DESKTOP: Floating canvas (margins + rounded corners)
          */}
          <div className="w-full h-full bg-container lg:rounded-[48px] border-b lg:border border-border-main shadow-xl dark:shadow-2xl flex flex-col overflow-hidden relative">
            <main className="flex-1 overflow-y-auto scrollbar-hide bg-page/30">
              <div className="max-w-screen-2xl mx-auto p-4 lg:p-12 pb-32">
                {children}
              </div>
            </main>

            {/* Premium Aesthetic Overlays (Only visible on Desktop canvas) */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] ring-1 ring-inset ring-text-main/5" />
            <div className="hidden lg:block absolute inset-0 pointer-events-none rounded-[48px] shadow-inner opacity-20 dark:opacity-50" />
          </div>
        </div>

        {/* 3. Right Column: Navigation Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-64 h-full flex-shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile Bottom Navigation (Persistent) */}
      <BottomNav />
    </div>
  );
};
