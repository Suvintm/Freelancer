import React from 'react';

interface LaptopFrameProps {
  children: React.ReactNode;
  url?: string;
}

export const LaptopFrame: React.FC<LaptopFrameProps> = ({ children, url = 'suvix.link/profile' }) => {
  return (
    <div className="relative w-[760px] h-[520px] bg-zinc-900 rounded-2xl p-2.5 shadow-2xl ring-1 ring-white/10 flex flex-col shrink-0 select-none">
      {/* Laptop Screen Bezel */}
      <div className="w-full h-full rounded-xl overflow-hidden relative flex flex-col bg-zinc-950 border border-zinc-800">
        {/* Browser Top Navigation Bar */}
        <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* URL Search Bar */}
          <div className="px-3 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 max-w-xs w-full text-center truncate">
            https://{url}
          </div>

          <div className="w-8" />
        </div>

        {/* Scrollable Browser Canvas */}
        <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col">
          {children}
        </div>
      </div>

      {/* Laptop Base Stand */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[820px] h-3 bg-zinc-800 rounded-b-xl border-t border-zinc-700 shadow-md flex items-center justify-center">
        <div className="w-20 h-1 bg-zinc-600 rounded-full" />
      </div>
    </div>
  );
};

export default LaptopFrame;
