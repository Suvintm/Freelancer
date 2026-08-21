import React from 'react';
import type { BioPageSummary } from '../../types/page.types';
import { BioPageCard } from './BioPageCard';
import { Plus, Layers, Sparkles } from 'lucide-react';

interface BioPageGridProps {
  pages: BioPageSummary[];
  maxPages?: number;
  username?: string;
  onCreateNew: () => void;
  onEdit: (pageId: string) => void;
  onSetActive: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

export const BioPageGrid: React.FC<BioPageGridProps> = ({
  pages,
  maxPages = 4,
  username = 'creator',
  onCreateNew,
  onEdit,
  onSetActive,
  onDuplicate,
  onDelete,
}) => {
  const isLimitReached = pages.length >= maxPages;

  return (
    <div className="w-full space-y-6">
      {/* Header Bar with Usage Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              All Bio Pages
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Manage your active primary link and secondary campaign pages
            </p>
          </div>
        </div>

        {/* Usage Badge & New Button */}
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white font-mono">{pages.length}</span>
            <span className="text-slate-400 dark:text-zinc-600">/</span>
            <span className="font-mono text-slate-600 dark:text-zinc-400">{maxPages}</span>
            <span className="text-slate-500 dark:text-zinc-500 text-[11px]">used</span>
          </div>

          <button
            onClick={onCreateNew}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
              isLimitReached
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-zinc-700'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Page
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pages.map((page) => (
          <BioPageCard
            key={page.id}
            page={page}
            username={username}
            onEdit={onEdit}
            onSetActive={onSetActive}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}

        {/* Add New Page Dashed Slot */}
        {!isLimitReached && (
          <button
            onClick={onCreateNew}
            className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-900/20 hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-all duration-200 min-h-[180px] text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">
              Create New Bio Page
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 max-w-[180px] mt-0.5">
              Start with a template or blank design
            </p>
          </button>
        )}
      </div>

      {/* Limit Notice if applicable */}
      {isLimitReached && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-zinc-300 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                You’ve reached the 4-page free tier limit
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Upgrade to create unlimited bio pages and connect custom domains.
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold text-xs transition-colors shrink-0">
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
};
