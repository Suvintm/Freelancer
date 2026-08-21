import React from 'react';

interface FontSelectorProps {
  label?: string;
  value: string;
  options?: string[];
  onChange: (font: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  label = 'Font Family',
  value,
  options = ['Inter', 'Poppins', 'Playfair Display', 'Raleway', 'JetBrains Mono', 'Orbitron'],
  onChange
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
        {label}
      </label>

      <div className="grid grid-cols-2 gap-2">
        {options.map((font) => (
          <button
            key={font}
            type="button"
            onClick={() => onChange(font)}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center justify-between ${
              value === font
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500'
                : 'border-border-main/50 bg-surface text-text-muted hover:border-border-main'
            }`}
          >
            <span style={{ fontFamily: font }}>{font}</span>
            {value === font && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSelector;
