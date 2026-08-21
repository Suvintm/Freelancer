import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { resolveBackgroundStyle } from '../../utils/themeResolver';
import whiteBgLogo from '../../../assets/whitebglogo.png';
import officialLogo from '../../../assets/officiallogo.png';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  EyeOff, 
  Lock,
  Wifi,
  Battery
} from 'lucide-react';

export const BioCanvasPreview: React.FC = () => {
  const page = useBioEditorStore((s) => s.page);
  const previewDevice = useBioEditorStore((s) => s.previewDevice);
  const selectedBlockId = useBioEditorStore((s) => s.selectedBlockId);
  const hoveredBlockId = useBioEditorStore((s) => s.hoveredBlockId);
  
  const setSelectedBlockId = useBioEditorStore((s) => s.setSelectedBlockId);
  const setHoveredBlockId = useBioEditorStore((s) => s.setHoveredBlockId);
  const moveBlock = useBioEditorStore((s) => s.moveBlock);
  const duplicateBlock = useBioEditorStore((s) => s.duplicateBlock);
  const removeBlock = useBioEditorStore((s) => s.removeBlock);

  if (!page) return null;

  const blocks = page.draftBlocks || [];
  const theme = page.draftTheme;

  // Single canonical background resolver
  const resolvedBg = resolveBackgroundStyle(theme);
  const liveUrl = `suvix.me/${page.slug === 'main' ? 'creator' : `creator/${page.slug}`}`;

  // ── 1. EXACT FLAGSHIP SMARTPHONE VIEWPORT (Standard 9:19.5 Ratio with Titanium Frame) ──
  const renderMobileFrame = () => (
    <div className="relative my-auto transition-all duration-300 select-none flex items-center justify-center shrink-0">
      
      {/* Outer Side Hardware Buttons (Left volume buttons & Right power button) */}
      <div className="absolute -left-1.5 top-24 w-1.5 h-7 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -left-1.5 top-34 w-1.5 h-11 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -left-1.5 top-48 w-1.5 h-11 bg-zinc-700 rounded-l-sm" />
      <div className="absolute -right-1.5 top-32 w-1.5 h-14 bg-zinc-700 rounded-r-sm" />

      {/* Main Titanium Chassis (Locked 9:16 Aspect Ratio) */}
      <div 
        style={{ aspectRatio: '9 / 16' }}
        className="h-[calc(100vh-130px)] max-h-[740px] min-h-[480px] w-auto rounded-[46px] p-[6px] bg-slate-950 border-[3px] border-zinc-700/90 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.65)] relative flex flex-col overflow-hidden ring-1 ring-white/15"
      >
        
        {/* Top Dynamic Island Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-40 flex items-center justify-between px-2 shadow-sm border border-white/10 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Screen Bezel Frame with Multi-Layer Wallpaper & Overlay */}
        <div 
          style={resolvedBg.containerStyle}
          className="w-full h-full rounded-[40px] overflow-hidden relative flex flex-col transition-all"
        >
          {/* Wallpaper Image Layer with Blur */}
          {resolvedBg.isImage && (
            <div 
              style={resolvedBg.bgImageLayerStyle}
              className="absolute inset-0 z-0 pointer-events-none transition-all"
            />
          )}

          {/* Overlay Tint Layer */}
          {resolvedBg.overlayStyle.opacity ? (
            <div 
              style={resolvedBg.overlayStyle}
              className="absolute inset-0 z-0 pointer-events-none transition-all"
            />
          ) : null}

          {/* Scrollable Screen Content */}
          <div 
            data-lenis-prevent="true"
            className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar pt-5 pb-5 px-3 flex flex-col relative z-10"
          >
            {/* iOS Status Bar (Clock & Signals) */}
            <div className="w-full flex items-center justify-between px-2 pt-1 pb-1 text-[8.5px] font-bold text-white/80 z-20 shrink-0 select-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-2.5 h-2.5" />
                <span className="text-[7.5px]">5G</span>
                <Battery className="w-3 h-3" />
              </div>
            </div>

            {/* Top Brand Bar in Preview */}
            <div className="w-full flex items-center justify-between pt-1 pb-2 px-1 z-20 shrink-0">
              <img src={whiteBgLogo} alt="SuviX" className="h-4 w-auto object-contain" />
              <div className="px-2 py-0.5 rounded-full bg-white text-slate-900 font-bold text-[7px] shadow-xs flex items-center gap-0.5 pointer-events-none">
                <span>Join SuviX</span>
                <span className="text-[8px]">→</span>
              </div>
            </div>

            {/* Blocks Stream */}
            <div className="w-full space-y-2 relative z-10 flex-1 py-1">
              {renderBlockItems()}
            </div>

            {/* Brand Footer */}
            <div className="mt-4 pt-3 border-t border-white/20 flex flex-col items-center text-center shrink-0">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-1">
                <img src={officialLogo} alt="SuviX" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              </div>
              <span className="text-[9px] font-bold text-white">Created with SuviX</span>
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-3 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );

  // ── 2. TABLET VIEWPORT (Tablet 640px) ──
  const renderTabletFrame = () => (
    <div className="w-[580px] sm:w-[640px] h-[680px] sm:h-[720px] max-h-[calc(100vh-110px)] my-auto transition-all duration-300 select-none flex flex-col shrink-0">
      <div className="w-full h-full rounded-[36px] p-3.5 bg-zinc-950 border-[4px] border-zinc-700/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] relative flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Top Webcam Dot */}
        <div className="w-2 h-2 rounded-full bg-zinc-800 ring-1 ring-zinc-700 mx-auto mb-1.5 shrink-0" />

        {/* Tablet Screen */}
        <div 
          style={resolvedBg.containerStyle}
          className="w-full h-full rounded-[24px] overflow-hidden flex flex-col relative transition-all"
        >
          {/* Wallpaper Image Layer */}
          {resolvedBg.isImage && (
            <div 
              style={resolvedBg.bgImageLayerStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          )}

          {/* Overlay Tint */}
          {resolvedBg.overlayStyle.opacity ? (
            <div 
              style={resolvedBg.overlayStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          ) : null}

          {/* Scrollable Content */}
          <div 
            data-lenis-prevent="true"
            className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar py-6 px-8 sm:px-12 flex flex-col relative z-10"
          >
            {/* Top Brand Bar */}
            <div className="w-full max-w-xl mx-auto flex items-center justify-between pb-3 z-20 shrink-0">
              <img src={whiteBgLogo} alt="SuviX" className="h-5 w-auto object-contain" />
              <div className="px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-bold text-xs shadow-xs flex items-center gap-0.5 pointer-events-none">
                <span>Join SuviX</span>
                <span className="text-xs">→</span>
              </div>
            </div>

            <div className="w-full max-w-xl mx-auto space-y-3.5 relative z-10 flex-1">
              {renderBlockItems()}
            </div>

            {/* Brand Footer */}
            <div className="mt-6 pt-3 border-t border-white/20 flex flex-col items-center text-center shrink-0">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-1">
                <img src={officialLogo} alt="SuviX" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
              </div>
              <span className="text-xs font-bold text-white">Created with SuviX</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // ── 3. DESKTOP VIEWPORT (Desktop Browser Window) ──
  const renderDesktopFrame = () => (
    <div className="w-full max-w-4xl h-[680px] sm:h-[720px] max-h-[calc(100vh-110px)] my-auto transition-all duration-300 select-none flex flex-col shrink-0">
      <div className="w-full h-full rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Browser Top Chrome */}
        <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-400/80 border border-red-500/30" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-500/30" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-500/30" />
          </div>

          {/* URL Pill */}
          <div className="flex-1 max-w-sm mx-auto px-3 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 font-mono flex items-center justify-center gap-1.5 border border-zinc-700">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="truncate">{liveUrl}</span>
          </div>

          <div className="w-12 shrink-0" />
        </div>

        {/* Browser Viewport Screen */}
        <div 
          style={resolvedBg.containerStyle}
          className="w-full h-full overflow-hidden flex flex-col relative transition-all"
        >
          {/* Wallpaper Image Layer */}
          {resolvedBg.isImage && (
            <div 
              style={resolvedBg.bgImageLayerStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          )}

          {/* Overlay Tint */}
          {resolvedBg.overlayStyle.opacity ? (
            <div 
              style={resolvedBg.overlayStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          ) : null}

          {/* Scrollable Content */}
          <div 
            data-lenis-prevent="true"
            className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar py-8 px-6 flex flex-col relative z-10"
          >
            {/* Top Brand Bar */}
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between pb-4 z-20 shrink-0">
              <img src={whiteBgLogo} alt="SuviX" className="h-6 w-auto object-contain" />
              <div className="px-3 py-1 rounded-full bg-white text-slate-900 font-bold text-xs shadow-xs flex items-center gap-1 pointer-events-none">
                <span>Join SuviX</span>
                <span className="text-xs">→</span>
              </div>
            </div>

            <div className="w-full max-w-2xl mx-auto space-y-4 relative z-10 flex-1">
              {renderBlockItems()}
            </div>

            {/* Brand Footer */}
            <div className="mt-8 pt-4 border-t border-white/20 flex flex-col items-center text-center shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
                <img src={officialLogo} alt="SuviX" className="w-4 h-4 object-contain brightness-0 invert" />
              </div>
              <span className="text-xs font-bold text-white">Created with SuviX</span>
              <span className="text-[10.5px] text-white/70">Connect. Collaborate. Grow.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // ── BLOCK ITEM LOOP & HOVER TOOLBAR ──
  const renderBlockItems = () => {
    return blocks.map((block, idx) => {
      const isSelected = selectedBlockId === block.id;
      const isHovered = hoveredBlockId === block.id;
      const isFirst = idx === 0;
      const isLast = idx === blocks.length - 1;

      return (
        <div
          key={block.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBlockId(block.id);
          }}
          onMouseEnter={() => setHoveredBlockId(block.id)}
          onMouseLeave={() => setHoveredBlockId(null)}
          className={`relative group transition-all duration-150 rounded-2xl cursor-pointer ${
            isSelected 
              ? 'ring-2 ring-sky-500 shadow-md ring-offset-2 ring-offset-black/40' 
              : isHovered 
              ? 'ring-1 ring-sky-400/60' 
              : ''
          } ${!block.isVisible ? 'opacity-40 grayscale-40' : ''}`}
        >
          {/* Quick Hover Action Toolbar (Move, Duplicate, Delete) */}
          {(isSelected || isHovered) && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute -top-7 right-2 z-40 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/90 text-white text-xs backdrop-blur-md shadow-lg border border-zinc-700 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Move Up */}
              <button
                disabled={isFirst}
                onClick={() => moveBlock(idx, idx - 1)}
                className={`p-1 rounded hover:bg-white/20 transition-colors ${
                  isFirst ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Move Up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>

              {/* Move Down */}
              <button
                disabled={isLast}
                onClick={() => moveBlock(idx, idx + 1)}
                className={`p-1 rounded hover:bg-white/20 transition-colors ${
                  isLast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Move Down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Duplicate */}
              <button
                onClick={() => duplicateBlock(block.id)}
                className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                title="Duplicate Block"
              >
                <Copy className="w-3 h-3" />
              </button>

              {/* Delete */}
              <button
                onClick={() => removeBlock(block.id)}
                className="p-1 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                title="Delete Block"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Hidden Block Watermark */}
          {!block.isVisible && (
            <div className="absolute inset-0 rounded-2xl bg-black/10 border border-dashed border-slate-400 flex items-center justify-center pointer-events-none z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
                <EyeOff className="w-3 h-3" />
                Hidden from visitors
              </span>
            </div>
          )}

          {/* Block Component View */}
          <BlockRenderer 
            block={block}
            theme={theme}
          />
        </div>
      );
    });
  };

  return (
    <main 
      data-lenis-prevent="true"
      onClick={() => setSelectedBlockId(null)}
      className="flex-1 h-full overflow-hidden p-3 sm:p-5 lg:p-6 bg-slate-900/60 dark:bg-zinc-950 flex flex-col items-center justify-center relative select-none"
    >
      {previewDevice === 'mobile' && renderMobileFrame()}
      {previewDevice === 'tablet' && renderTabletFrame()}
      {previewDevice === 'desktop' && renderDesktopFrame()}
    </main>
  );
};

export default BioCanvasPreview;
