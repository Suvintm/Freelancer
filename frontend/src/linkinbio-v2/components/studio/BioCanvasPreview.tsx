import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { BlockRenderer } from '../blocks/BlockRenderer';
import type { Theme } from '../../types/theme.types';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  EyeOff, 
  Lock 
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

  // Background styling computation
  const getThemeBackgroundStyle = (themeObj: Theme): React.CSSProperties => {
    const bg = themeObj.background;
    if (!bg) return { backgroundColor: '#ffffff' };

    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.value || '#ffffff' };
      case 'gradient':
        return { backgroundImage: bg.value || 'linear-gradient(135deg, #111827 0%, #000000 100%)' };
      case 'image':
        return {
          backgroundImage: `url(${bg.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  const backgroundStyle = getThemeBackgroundStyle(theme);
  const liveUrl = `suvix.me/${page.slug === 'main' ? 'creator' : `creator/${page.slug}`}`;

  // ── 1. SMARTPHONE VIEWPORT (Mobile 375px) ──
  const renderMobileFrame = () => (
    <div className="w-[360px] sm:w-[375px] my-auto transition-all duration-300 select-none">
      {/* Outer Phone Shell */}
      <div className="rounded-[48px] p-3 bg-zinc-900 border-4 border-zinc-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative flex flex-col">
        
        {/* Dynamic Island */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2.5 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-zinc-800" />
          <div className="w-2 h-2 rounded-full bg-zinc-900 ring-1 ring-zinc-700" />
        </div>

        {/* Screen Bezel Frame */}
        <div 
          style={backgroundStyle}
          className="w-full min-h-[620px] rounded-[38px] overflow-y-auto no-scrollbar pt-10 pb-8 px-4 flex flex-col relative transition-all"
        >
          {/* Blocks Stream */}
          <div className="w-full space-y-3 relative z-10">
            {renderBlockItems()}
          </div>

          {/* iOS Home Indicator */}
          <div className="w-28 h-1 bg-black/30 dark:bg-white/30 rounded-full mx-auto mt-6 shrink-0" />
        </div>

      </div>
    </div>
  );

  // ── 2. TABLET VIEWPORT (Tablet 768px) ──
  const renderTabletFrame = () => (
    <div className="w-[620px] sm:w-[680px] my-auto transition-all duration-300 select-none">
      {/* Outer Tablet Shell */}
      <div className="rounded-[36px] p-3.5 bg-zinc-900 border-4 border-zinc-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative flex flex-col">
        
        {/* Top Webcam Dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700 mx-auto mb-2" />

        {/* Tablet Screen */}
        <div 
          style={backgroundStyle}
          className="w-full min-h-[560px] rounded-[24px] overflow-y-auto no-scrollbar py-8 px-8 sm:px-16 flex flex-col relative transition-all"
        >
          {/* Max-width container for tablet reading */}
          <div className="w-full max-w-md mx-auto space-y-3.5 relative z-10">
            {renderBlockItems()}
          </div>
        </div>

      </div>
    </div>
  );

  // ── 3. DESKTOP VIEWPORT (Desktop 100%) ──
  const renderDesktopFrame = () => (
    <div className="w-full max-w-3xl my-auto transition-all duration-300 select-none">
      {/* Desktop Browser Shell */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Browser Top Chrome */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-400/80 border border-red-500/30" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-500/30" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 border border-emerald-500/30" />
          </div>

          {/* URL Pill */}
          <div className="flex-1 max-w-sm mx-auto px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 text-[11px] font-mono text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-1.5 truncate shadow-2xs">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{liveUrl}</span>
          </div>

          <div className="w-12 shrink-0" />
        </div>

        {/* Browser Content Area */}
        <div 
          style={backgroundStyle}
          className="w-full min-h-[540px] max-h-[70vh] overflow-y-auto no-scrollbar py-10 px-4 sm:px-12 flex flex-col items-center relative transition-all"
        >
          <div className="w-full max-w-md space-y-3.5 relative z-10">
            {renderBlockItems()}
          </div>
        </div>

      </div>
    </div>
  );

  // ── BLOCK ITEMS RENDERER WITH IN-CANVAS ACTION TOOLBAR ──
  const renderBlockItems = () => {
    return blocks.map((block, idx) => {
      const isSelected = selectedBlockId === block.id;
      const isHovered = hoveredBlockId === block.id && !isSelected;
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
          className={`relative rounded-2xl transition-all duration-150 group cursor-pointer ${
            isSelected
              ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-black z-20 shadow-md'
              : isHovered
              ? 'ring-1.5 ring-slate-400/80 dark:ring-zinc-500 ring-offset-1 z-10'
              : 'hover:ring-1 hover:ring-slate-300/60 dark:hover:ring-zinc-700'
          } ${!block.isVisible ? 'opacity-40 grayscale' : 'opacity-100'}`}
        >
          {/* Floating Hover Block Type Pill */}
          {isHovered && !isSelected && (
            <div className="absolute -top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-black text-[9px] font-bold uppercase tracking-wider shadow-sm pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100">
              {block.type.replace('-', ' ')}
            </div>
          )}

          {/* Floating Active Selection In-Canvas Toolbar */}
          {isSelected && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute -top-3.5 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg z-30 animate-in fade-in slide-in-from-bottom-1 duration-150"
            >
              {/* Type Badge */}
              <span className="text-[9px] font-bold uppercase tracking-wider px-1 opacity-70">
                {block.type.replace('-', ' ')}
              </span>

              <div className="w-px h-2.5 bg-white/20 dark:bg-black/20 mx-0.5" />

              {/* Move Up */}
              <button
                disabled={isFirst}
                onClick={() => moveBlock(idx, idx - 1)}
                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${
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
                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${
                  isLast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Move Down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Duplicate */}
              <button
                onClick={() => duplicateBlock(block.id)}
                className="p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors cursor-pointer"
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
            <div className="absolute inset-0 rounded-2xl bg-black/10 dark:bg-white/5 border border-dashed border-slate-400 dark:border-zinc-600 flex items-center justify-center pointer-events-none z-10">
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
      className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100/70 dark:bg-zinc-950 flex flex-col items-center justify-center relative no-scrollbar"
    >
      {previewDevice === 'mobile' && renderMobileFrame()}
      {previewDevice === 'tablet' && renderTabletFrame()}
      {previewDevice === 'desktop' && renderDesktopFrame()}
    </main>
  );
};
