import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="relative w-[340px] h-[680px] bg-zinc-950 rounded-[48px] p-3 shadow-2xl ring-1 ring-white/10 flex flex-col shrink-0 select-none">
      {/* Outer Phone Bezel Details */}
      <div className="absolute -left-[2px] top-24 w-[3px] h-7 bg-zinc-800 rounded-l-md" />
      <div className="absolute -left-[2px] top-36 w-[3px] h-10 bg-zinc-800 rounded-l-md" />
      <div className="absolute -left-[2px] top-48 w-[3px] h-10 bg-zinc-800 rounded-l-md" />
      <div className="absolute -right-[2px] top-28 w-[3px] h-12 bg-zinc-800 rounded-r-md" />

      {/* Screen Container */}
      <div className="w-full h-full rounded-[38px] overflow-hidden relative flex flex-col bg-black">
        {/* Dynamic Island / Top Camera Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/60" />
        </div>

        {/* Scrollable Inner Viewport */}
        <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-3">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full pointer-events-none z-50" />
      </div>
    </div>
  );
};

export default MobileFrame;
