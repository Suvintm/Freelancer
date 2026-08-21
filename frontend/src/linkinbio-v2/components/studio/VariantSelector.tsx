import React from 'react';
import { Check } from 'lucide-react';

export interface VariantOption<T extends string = string> {
  id: T;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

interface VariantSelectorProps<T extends string = string> {
  label?: string;
  value: T;
  options: VariantOption<T>[];
  onChange: (newValue: T) => void;
  columns?: 2 | 3 | 4 | 5;
}

export function VariantSelector<T extends string = string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
}: VariantSelectorProps<T>) {
  const gridColsClass =
    columns === 5
      ? 'grid-cols-5'
      : columns === 4
      ? 'grid-cols-4'
      : columns === 3
      ? 'grid-cols-3'
      : 'grid-cols-2';

  return (
    <div className="space-y-1.5 font-sans">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300">
            {label}
          </label>
        </div>
      )}

      <div className={`grid ${gridColsClass} gap-1.5`}>
        {options.map((opt) => {
          const isSelected = value === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800 shadow-xs ring-1 ring-sky-500/20'
                  : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                {opt.icon && <div className="text-current">{opt.icon}</div>}
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 ml-auto shrink-0" />}
              </div>

              <div>
                <span className="text-[11px] font-bold block truncate leading-tight">
                  {opt.label}
                </span>
                {opt.desc && (
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                    {opt.desc}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
