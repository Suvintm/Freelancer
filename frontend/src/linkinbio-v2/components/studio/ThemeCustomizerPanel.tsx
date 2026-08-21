import React, { useState } from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { WALLPAPER_PRESETS, type WallpaperPreset } from '../../constants/wallpapers';
import { resolveBackgroundStyle } from '../../utils/themeResolver';
import { 
  Palette, 
  Type, 
  Square, 
  Check,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Wand2
} from 'lucide-react';

const SOLID_PRESETS = [
  { label: 'Signature Olive', value: '#4D6234' },
  { label: 'Pure Black', value: '#000000' },
  { label: 'Obsidian Night', value: '#09090b' },
  { label: 'Slate Midnight', value: '#0f172a' },
  { label: 'Clean White', value: '#ffffff' },
  { label: 'Deep Emerald', value: '#064e3b' },
  { label: 'Royal Violet', value: '#3b0764' },
  { label: 'Velvet Rose', value: '#881337' },
];

const GRADIENT_PRESETS = [
  { label: 'Neon Cyber', value: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #000000 100%)' },
  { label: 'Sunset Glow', value: 'linear-gradient(135deg, #431407 0%, #18181b 100%)' },
  { label: 'Emerald Deep', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
  { label: 'Purple Haze', value: 'linear-gradient(135deg, #3b0764 0%, #09090b 100%)' },
  { label: 'Rose Gold', value: 'linear-gradient(135deg, #881337 0%, #2e1065 100%)' },
  { label: 'Frosted Glass', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { label: 'Electric Blue', value: 'linear-gradient(135deg, #0369a1 0%, #082f49 100%)' },
  { label: 'Autumn Amber', value: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)' },
];

const PRESET_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Modern Pro)', style: 'Plus Jakarta Sans, sans-serif' },
  { id: 'Inter', name: 'Inter (Clean Tech)', style: 'Inter, sans-serif' },
  { id: 'Syne', name: 'Syne (Avant-Garde & Luxury)', style: 'Syne, sans-serif' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech & Web3)', style: 'Space Grotesk, sans-serif' },
  { id: 'Outfit', name: 'Outfit (Sleek Minimal)', style: 'Outfit, sans-serif' },
  { id: 'Playfair Display', name: 'Playfair Display (Editorial Serif)', style: 'Playfair Display, serif' },
  { id: 'Figtree', name: 'Figtree (SuviX Sans)', style: 'Figtree, sans-serif' },
  { id: 'Oregano', name: 'Oregano Script (Handcrafted)', style: 'Oregano, cursive' },
  { id: 'Bubblegum Sans', name: 'Bubblegum Sans (Playful)', style: 'Bubblegum Sans, cursive' },
];

const BUTTON_ROUNDNESS = [
  { id: 'none', label: 'Sharp', radius: 4 },
  { id: 'medium', label: 'Rounded', radius: 14 },
  { id: 'full', label: 'Pill', radius: 9999 },
];

const CARD_VARIANTS = [
  { id: 'solid', label: 'Solid Card', desc: 'Classic clean white' },
  { id: 'glass', label: 'Glassmorphism', desc: 'Frosted blur effect' },
  { id: 'outline', label: 'Neon Outline', desc: 'Sleek border ring' },
  { id: 'shadow', label: 'Hard Shadow', desc: '90s Retro style' },
];

export const ThemeCustomizerPanel: React.FC = () => {
  const page = useBioEditorStore((s) => s.page);
  const updateTheme = useBioEditorStore((s) => s.updateTheme);

  const [bgTab, setBgTab] = useState<'solid' | 'gradient' | 'wallpaper' | 'custom'>('solid');
  const [customHex, setCustomHex] = useState('#4D6234');
  const [customImageUrl, setCustomImageUrl] = useState('');

  if (!page) return null;

  const theme = page.draftTheme;
  const currentBg = theme.background || { type: 'solid', value: '#4D6234' };
  
  // Resolve contrast metrics
  const resolved = resolveBackgroundStyle(theme);

  const handleApplySolid = (hex: string) => {
    updateTheme({
      background: {
        ...currentBg,
        type: 'solid',
        value: hex,
        color: hex,
      },
      colors: {
        ...theme.colors,
        background: hex,
      },
    });
  };

  const handleApplyGradient = (gradientCss: string) => {
    updateTheme({
      background: {
        ...currentBg,
        type: 'gradient',
        value: gradientCss,
      },
    });
  };

  const handleApplyWallpaper = (wp: WallpaperPreset) => {
    updateTheme({
      background: {
        ...currentBg,
        type: 'image',
        value: wp.url,
        imageUrl: wp.url,
        dominantColor: wp.dominantColor,
        overlay: currentBg.overlay || { enabled: true, color: '#000000', opacity: 0.4 },
      },
      colors: {
        ...theme.colors,
        background: wp.dominantColor,
      },
    });
  };

  const handleApplyCustomUrl = (url: string) => {
    if (!url.trim()) return;
    updateTheme({
      background: {
        ...currentBg,
        type: 'image',
        value: url.trim(),
        imageUrl: url.trim(),
        overlay: currentBg.overlay || { enabled: true, color: '#000000', opacity: 0.4 },
      },
    });
  };

  const handleAutoFixContrast = () => {
    const recommended = resolved.recommendedOverlayOpacity || 0.45;
    updateTheme({
      background: {
        ...currentBg,
        overlay: {
          enabled: true,
          color: '#000000',
          opacity: recommended,
        },
      },
    });
  };

  return (
    <div 
      data-lenis-prevent="true"
      className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar font-sans select-none"
    >
      {/* ── 1. CANVAS MASTER: BACKGROUND STUDIO ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-sky-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Canvas Background
            </h4>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            Master Layer
          </span>
        </div>

        {/* Subtabs for Background Types */}
        <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-semibold mb-3">
          <button
            onClick={() => setBgTab('solid')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
              bgTab === 'solid' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Solid Color
          </button>
          <button
            onClick={() => setBgTab('gradient')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
              bgTab === 'gradient' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gradients
          </button>
          <button
            onClick={() => setBgTab('wallpaper')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
              bgTab === 'wallpaper' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wallpapers
          </button>
          <button
            onClick={() => setBgTab('custom')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
              bgTab === 'custom' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Custom
          </button>
        </div>

        {/* SUBTAB 1: SOLID PRESETS & CUSTOM COLOR PICKER */}
        {bgTab === 'solid' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {SOLID_PRESETS.map((p) => {
                const isSelected = currentBg.type === 'solid' && currentBg.value === p.value;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleApplySolid(p.value)}
                    className={`h-11 rounded-xl p-1 relative border transition-all cursor-pointer flex flex-col justify-end overflow-hidden ${
                      isSelected ? 'ring-2 ring-sky-500 border-white shadow-md' : 'border-slate-300 dark:border-zinc-800 hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.value }}
                    title={p.label}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                        <Check className="w-2 h-2" />
                      </div>
                    )}
                    <span className="text-[8.5px] font-semibold text-white bg-black/60 backdrop-blur-xs px-1 py-0.5 rounded-xs truncate w-full text-center">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={currentBg.value?.startsWith('#') ? currentBg.value : '#4D6234'}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  handleApplySolid(e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-zinc-700 bg-transparent"
                title="Pick Custom Color"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleApplySolid(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  placeholder="#4D6234"
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: GRADIENTS */}
        {bgTab === 'gradient' && (
          <div className="grid grid-cols-4 gap-2">
            {GRADIENT_PRESETS.map((g) => {
              const isSelected = currentBg.type === 'gradient' && currentBg.value === g.value;
              return (
                <button
                  key={g.label}
                  onClick={() => handleApplyGradient(g.value)}
                  className={`h-12 rounded-xl p-1 relative border transition-all cursor-pointer flex flex-col justify-end overflow-hidden ${
                    isSelected ? 'ring-2 ring-sky-500 border-white shadow-md' : 'border-slate-300 dark:border-zinc-800 hover:scale-105'
                  }`}
                  style={{ backgroundImage: g.value }}
                  title={g.label}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                      <Check className="w-2 h-2" />
                    </div>
                  )}
                  <span className="text-[8.5px] font-semibold text-white bg-black/60 backdrop-blur-xs px-1 py-0.5 rounded-xs truncate w-full text-center">
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* SUBTAB 3: CURATED WALLPAPERS */}
        {bgTab === 'wallpaper' && (
          <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
            {WALLPAPER_PRESETS.map((wp) => {
              const isSelected = currentBg.type === 'image' && (currentBg.value === wp.url || currentBg.value === wp.thumbnailUrl);
              return (
                <button
                  key={wp.id}
                  onClick={() => handleApplyWallpaper(wp)}
                  className={`h-20 rounded-xl relative border transition-all cursor-pointer overflow-hidden group flex flex-col justify-end p-1 ${
                    isSelected ? 'ring-2 ring-sky-500 border-white shadow-md' : 'border-slate-300 dark:border-zinc-800 hover:scale-105'
                  }`}
                  style={{
                    backgroundImage: `url(${wp.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  title={wp.name}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                  <span className="text-[8px] font-bold text-white bg-black/70 backdrop-blur-xs px-1 py-0.5 rounded-xs truncate w-full text-center">
                    {wp.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* SUBTAB 4: CUSTOM IMAGE URL */}
        {bgTab === 'custom' && (
          <div className="space-y-2 text-xs">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              Wallpaper Image URL
            </label>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                placeholder="https://images.unsplash.com/..."
              />
              <button
                onClick={() => handleApplyCustomUrl(customImageUrl)}
                className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* ── READABILITY, OVERLAY TINT & FROSTED BLUR CONTROLS ── */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              Overlay & Readability Engine
            </span>
            <span className="text-[10px] text-slate-500">
              Opacity: {Math.round((currentBg.overlay?.opacity ?? 0.4) * 100)}%
            </span>
          </div>

          {/* Opacity Slider */}
          <div>
            <input
              type="range"
              min="0"
              max="0.80"
              step="0.05"
              value={currentBg.overlay?.opacity ?? 0.4}
              onChange={(e) => {
                const opacity = parseFloat(e.target.value);
                updateTheme({
                  background: {
                    ...currentBg,
                    overlay: {
                      enabled: opacity > 0,
                      color: currentBg.overlay?.color || '#000000',
                      opacity,
                    },
                  },
                });
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Blur Slider (Capped at 12px for Mobile Performance) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>Frosted Blur</span>
              <span>{currentBg.blur || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={currentBg.blur || 0}
              onChange={(e) => {
                const blur = parseInt(e.target.value, 10);
                updateTheme({
                  background: {
                    ...currentBg,
                    blur,
                  },
                });
              }}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* WCAG Accessibility & Contrast Gauge */}
          <div className={`p-2 rounded-xl flex items-center justify-between border ${
            resolved.isContrastLow
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              {resolved.isContrastLow ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              )}
              <span>
                {resolved.isContrastLow ? 'Low Contrast' : 'WCAG AA Pass'} ({resolved.contrastRatio} : 1)
              </span>
            </div>

            {resolved.isContrastLow && (
              <button
                onClick={handleAutoFixContrast}
                className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-bold text-[10px] flex items-center gap-1 hover:bg-amber-400 transition-all cursor-pointer shadow-xs"
              >
                <Wand2 className="w-2.5 h-2.5" />
                <span>Auto-Fix</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. TYPOGRAPHY SELECTOR ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Type className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Google Fonts & Typography
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

      {/* ── 4. CARD STYLING & GLASSMORPHISM ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Card Container Style
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CARD_VARIANTS.map((card) => {
            const isSelected = (theme as any).cardVariant === card.id || (!((theme as any).cardVariant) && card.id === 'solid');

            return (
              <button
                key={card.id}
                onClick={() => updateTheme({ cardVariant: card.id } as any)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">{card.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-sky-500" />}
                </div>
                <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  {card.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerPanel;
