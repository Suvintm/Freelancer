import React from 'react';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  presets = ['#111111', '#ffffff', '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] font-mono text-text-muted uppercase">{value}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-xl border border-border-main overflow-hidden shrink-0 shadow-sm cursor-pointer">
          <input
            type="color"
            value={value.startsWith('#') && value.length === 7 ? value : '#111111'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer opacity-0"
          />
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full h-9 px-3 rounded-xl text-xs font-mono bg-surface border border-border-main text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 active:scale-95 ${
                value.toLowerCase() === preset.toLowerCase()
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                  : 'border-black/10 dark:border-white/10'
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPickerField;
