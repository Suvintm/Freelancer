import React from 'react';
import { Plus, Layers, Smartphone, Globe } from 'lucide-react';

interface EmptyBioStateProps {
  onCreateClick: () => void;
}

export const EmptyBioState: React.FC<EmptyBioStateProps> = ({ onCreateClick }) => {
  return (
    <div className="w-full py-16 px-6 rounded-2xl bg-slate-50/60 dark:bg-[#111114] border border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-xs">
      
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center shadow-xs mb-4">
        <Smartphone className="w-7 h-7 text-slate-800 dark:text-zinc-200" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
        Create Your Link in Bio
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
        One simple, clean link to showcase your videos, music, products, newsletters, and social profiles.
      </p>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full mb-6 text-left">
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-slate-600 dark:text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Block Editor</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-slate-600 dark:text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Live Device View</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-slate-600 dark:text-zinc-400 shrink-0" />
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Custom Slugs</span>
        </div>
      </div>

      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
      >
        <Plus className="w-4 h-4" />
        Create Your First Bio Page
      </button>
    </div>
  );
};
