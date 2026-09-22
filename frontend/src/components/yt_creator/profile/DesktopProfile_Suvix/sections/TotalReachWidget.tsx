import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, TrendingUp } from 'lucide-react';

export const TotalReachWidget: React.FC = () => {
  const [timeframe, setTimeframe] = useState('Last 30 days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 24 simulated bar heights for the mini trend chart
  const barHeights = [
    25, 38, 45, 30, 55, 60, 40, 70, 65, 80, 75, 90, 
    85, 65, 70, 60, 85, 95, 80, 75, 90, 85, 100, 92
  ];

  return (
    <div className="w-full bg-black text-white rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-colors border border-zinc-900">
      
      {/* Top Header: Total Reach & Timeframe */}
      <div className="flex items-center justify-between mb-2.5">
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <span>Total Reach</span>
          <ArrowUpRight size={11} strokeWidth={2.5} />
        </button>

        {/* Timeframe Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors cursor-pointer"
          >
            <span>{timeframe}</span>
            <ChevronDown size={10} strokeWidth={2.5} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-28 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl z-30">
              {['Last 7 days', 'Last 30 days', 'Last 90 days', 'This Year'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setTimeframe(opt);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Big Metric & Growth Badge */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-black tracking-tight text-white leading-none">
          48.2K
        </span>
        <div className="flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-400">
          <TrendingUp size={11} strokeWidth={2.5} />
          <span>12%</span>
        </div>
      </div>

      {/* Mini Bar Chart Distribution */}
      <div className="flex items-end justify-between gap-1 h-9 w-full mb-3 pt-1">
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t-xs transition-all duration-300 ${
              i === barHeights.length - 2 || i === barHeights.length - 1
                ? 'bg-white'
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>

      {/* 3 Bottom Summary Stats */}
      <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-zinc-850/80 text-left">
        <div>
          <span className="text-[11px] font-bold text-white leading-none block">
            12.4K
          </span>
          <span className="text-[9px] text-zinc-500 font-medium leading-none mt-0.5 block">
            Views
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-white leading-none block">
            4.8K
          </span>
          <span className="text-[9px] text-zinc-500 font-medium leading-none mt-0.5 block">
            Engagement
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-emerald-400 leading-none block">
            +320
          </span>
          <span className="text-[9px] text-zinc-500 font-medium leading-none mt-0.5 block">
            Followers
          </span>
        </div>
      </div>

    </div>
  );
};
