import React from 'react';
import { Eye, MousePointerClick, TrendingUp, ArrowUpRight } from 'lucide-react';

interface AnalyticsTeaserProps {
  totalViews: number;
  totalClicks: number;
  averageCtr: number;
  topLink?: {
    title: string;
    clicks: number;
  } | null;
  onViewDetailedAnalytics?: () => void;
}

export const AnalyticsTeaser: React.FC<AnalyticsTeaserProps> = ({
  totalViews = 0,
  totalClicks = 0,
  averageCtr = 0,
  topLink,
  onViewDetailedAnalytics,
}) => {
  return (
    <div className="w-full rounded-xl bg-slate-50 dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Total Page Views</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalViews.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              ↑ 18% this week
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Total Link Clicks</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalClicks.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              ↑ 24% this week
            </span>
          </div>

          <div className="flex flex-col col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Average CTR</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {averageCtr}%
            </div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
              Industry avg: 8.5%
            </span>
          </div>
        </div>

        {/* Right Top Performing Link Highlight */}
        {topLink && (
          <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                Top Performing Link
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] mt-0.5">
                "{topLink.title}"
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                {topLink.clicks.toLocaleString()} clicks recorded
              </span>
            </div>

            {onViewDetailedAnalytics && (
              <button
                onClick={onViewDetailedAnalytics}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors shrink-0"
              >
                Analytics
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
