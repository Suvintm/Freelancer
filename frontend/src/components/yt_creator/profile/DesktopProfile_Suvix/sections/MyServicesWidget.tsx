import React from 'react';
import { useNavigate } from 'react-router-dom';

export const MyServicesWidget: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white dark:bg-[#121215] rounded-2xl p-3.5 sm:p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight leading-none">
          My Services
        </h3>
        <button
          type="button"
          onClick={() => navigate('/creator-tools')}
          className="text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-colors"
        >
          Manage
        </button>
      </div>

      {/* Service Card */}
      <div 
        onClick={() => navigate('/creator-tools')}
        className="flex items-center gap-3 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-850/60 transition-all cursor-pointer group"
      >
        {/* Thumbnail Image */}
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow-2xs">
          <img
            src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=300"
            alt="Video Editing Service"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 leading-tight">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-[11px] font-bold text-zinc-900 dark:text-white truncate">
              Video Editing
            </h4>
            {/* Status Green Dot */}
            <div className="flex items-center gap-1 shrink-0 text-[9.5px] font-bold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available</span>
            </div>
          </div>

          <p className="text-[9.5px] text-zinc-400 dark:text-zinc-500 leading-snug font-medium line-clamp-1 mt-0.5">
            Professional video editing for YouTube, Reels & more.
          </p>
        </div>
      </div>
    </div>
  );
};
