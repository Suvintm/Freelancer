import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { 
  Palette, 
  Type, 
  Square, 
  Check 
} from 'lucide-react';

const PRESET_BACKGROUNDS = [
  { label: 'Pure Black', type: 'solid' as const, value: '#000000' },
  { label: 'Clean White', type: 'solid' as const, value: '#ffffff' },
  { label: 'Midnight Slate', type: 'solid' as const, value: '#0f172a' },
  { label: 'Cyber Dark', type: 'solid' as const, value: '#09090b' },
  { label: 'Neon Cyber', type: 'gradient' as const, value: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #000000 100%)' },
  { label: 'Sunset Glow', type: 'gradient' as const, value: 'linear-gradient(135deg, #431407 0%, #18181b 100%)' },
  { label: 'Emerald Deep', type: 'gradient' as const, value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
  { label: 'Purple Haze', type: 'gradient' as const, value: 'linear-gradient(135deg, #3b0764 0%, #09090b 100%)' },
];

const PRESET_FONTS = [
  { id: 'Bubblegum Sans', name: 'Bubblegum Sans', style: 'Bubblegum Sans, cursive' },
  { id: 'Figtree', name: 'Figtree (SuviX Sans)', style: 'Figtree, sans-serif' },
  { id: 'Inter', name: 'Inter Clean', style: 'Inter, sans-serif' },
  { id: 'Outfit', name: 'Outfit Modern', style: 'Outfit, sans-serif' },
  { id: 'Oregano', name: 'Oregano Script', style: 'Oregano, cursive' },
  { id: 'Pangolin', name: 'Pangolin Playful', style: 'Pangolin, cursive' },
];

const BUTTON_ROUNDNESS = [
  { id: 'none', label: 'Sharp', radius: 0 },
  { id: 'medium', label: 'Rounded', radius: 14 },
  { id: 'full', label: 'Pill', radius: 9999 },
];

export const ThemeCustomizerPanel: React.FC = () => {
  const page = useBioEditorStore((s) => s.page);
  const updateTheme = useBioEditorStore((s) => s.updateTheme);

  if (!page) return null;

  const theme = page.draftTheme;

  return (
    <div 
      data-lenis-prevent="true"
      className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar font-sans select-none"
    >
      {/* ── 1. BACKGROUND PRESET PALETTES ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Palette className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Background Theme
          </h4>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PRESET_BACKGROUNDS.map((bg) => {
            const isSelected = theme.background?.value === bg.value;

            return (
              <button
                key={bg.label}
                onClick={() => updateTheme({ background: { type: bg.type, value: bg.value } })}
                className={`h-12 rounded-xl p-1 relative border transition-all cursor-pointer group flex flex-col justify-end overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-sky-500 border-white shadow-md'
                    : 'border-slate-300 dark:border-zinc-800 hover:scale-105'
                }`}
                style={bg.type === 'solid' ? { backgroundColor: bg.value } : { backgroundImage: bg.value }}
                title={bg.label}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <span className="text-[9px] font-semibold text-white bg-black/60 backdrop-blur-xs px-1 py-0.5 rounded-sm truncate w-full text-center">
                  {bg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. TYPOGRAPHY SELECTOR ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Type className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Font Family
          </h4>
        </div>

        <div className="space-y-1.5">
          {PRESET_FONTS.map((font) => {
            const isSelected = theme.typography?.fontFamily === font.id;

            return (
              <button
                key={font.id}
                onClick={() => updateTheme({ typography: { ...theme.typography, fontFamily: font.id } })}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                style={{ fontFamily: font.style }}
              >
                <span>{font.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. BUTTON CORNERS STYLING ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Square className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Button Corner Shapes
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {BUTTON_ROUNDNESS.map((btn) => {
            const isSelected = theme.buttons?.borderRadius === btn.radius;

            return (
              <button
                key={btn.id}
                onClick={() => updateTheme({ buttons: { ...theme.buttons, borderRadius: btn.radius } })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerPanel;
