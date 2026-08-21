import React from 'react';
import type { Template } from '../../types/template.types';
import { Eye, ArrowRight, Layers, Check } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  isSelected?: boolean;
  onPreview: (template: Template) => void;
  onSelect: (template: Template) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  creator: 'Creator',
  commerce: 'Commerce',
  agency: 'Agency',
  podcast: 'Podcast',
  music: 'Music',
  blank: 'Blank Canvas',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected = false,
  onPreview,
  onSelect,
}) => {
  const isBlank = template.id === 'blank';
  const categoryName = CATEGORY_LABELS[template.category] || template.category;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden bg-white dark:bg-[#111114] ${
        isSelected
          ? 'border-slate-900 dark:border-white shadow-sm ring-2 ring-slate-900/10 dark:ring-white/20'
          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
      }`}
    >
      {/* Compact Visual Preview Frame */}
      <div className="relative h-[115px] sm:h-[125px] w-full overflow-hidden bg-slate-100 dark:bg-zinc-900 flex items-center justify-center p-2">
        {isBlank ? (
          <div className="w-full h-full rounded-lg border border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center p-2 bg-white/50 dark:bg-zinc-800/30">
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 mb-1">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
              Blank Slate
            </span>
            <span className="text-[9px] text-slate-400 dark:text-zinc-500">
              Clean canvas
            </span>
          </div>
        ) : (
          <div className="w-[105px] h-[135px] rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-xs p-1.5 flex flex-col items-center justify-between pointer-events-none group-hover:scale-105 transition-transform duration-200">
            {/* Mini Profile Mock */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 ring-1 ring-slate-300 dark:ring-zinc-700 mt-0.5" />
            <div className="w-full space-y-0.5">
              <div className="h-1 w-9 mx-auto rounded-full bg-slate-300 dark:bg-zinc-700" />
              <div className="h-0.5 w-12 mx-auto rounded-full bg-slate-200 dark:bg-zinc-800" />
            </div>
            {/* Mini Buttons Mock */}
            <div className="w-full space-y-0.5 mb-0.5">
              <div className="h-2 w-full rounded bg-slate-900 dark:bg-white/90" />
              <div className="h-2 w-full rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700" />
              <div className="h-2 w-full rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700" />
            </div>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 p-2">
          {!isBlank && (
            <button
              onClick={() => onPreview(template)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-semibold text-[10px] shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => onSelect(template)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-[10px] shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>Select</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Category Pill */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-slate-200 dark:border-zinc-800 text-[9px] font-semibold text-slate-700 dark:text-zinc-300">
          {categoryName}
        </div>

        {/* Block Count */}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-slate-200 dark:border-zinc-800 text-[9px] font-mono text-slate-600 dark:text-zinc-400">
          {template.defaultBlocks?.length || 0} blocks
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
            {template.name}
          </h3>
          <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
            {template.description}
          </p>
        </div>

        {/* Footer with Tags and Selection Action */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            {template.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1 py-0.5 rounded text-[8px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => onSelect(template)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-2.5 h-2.5" />
                <span>Selected</span>
              </>
            ) : (
              <>
                <span>Use</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
