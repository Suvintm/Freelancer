import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import type { Block } from '../../types/block.types';
import { 
  Layers, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  User, 
  Link2, 
  Share2, 
  ShoppingBag, 
  Video, 
  Music, 
  Mail, 
  Image, 
  Type, 
  Minus,
  Sparkles
} from 'lucide-react';

interface BlockListPanelProps {
  onOpenAddDrawer: () => void;
}

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  'profile-header': <User className="w-3.5 h-3.5" />,
  'link-button': <Link2 className="w-3.5 h-3.5" />,
  'social-bar': <Share2 className="w-3.5 h-3.5" />,
  'product-grid': <ShoppingBag className="w-3.5 h-3.5" />,
  'video-embed': <Video className="w-3.5 h-3.5" />,
  'audio-player': <Music className="w-3.5 h-3.5" />,
  'email-capture': <Mail className="w-3.5 h-3.5" />,
  'image-gallery': <Image className="w-3.5 h-3.5" />,
  'text': <Type className="w-3.5 h-3.5" />,
  'divider': <Minus className="w-3.5 h-3.5" />,
};

// Extract a preview label from block config
const getBlockLabel = (block: Block): string => {
  const config = block.config as any;
  if (!config) return block.type.replace('-', ' ');

  switch (block.type) {
    case 'profile-header':
      return config.displayName || config.username || 'Profile Header';
    case 'link-button':
      return config.title || 'Link Button';
    case 'social-bar':
      return `Socials (${config.platforms?.length || 0})`;
    case 'product-grid':
      return config.heading || `Products (${config.products?.length || 0})`;
    case 'video-embed':
      return config.title || 'Video Player';
    case 'countdown':
      return config.title || 'Countdown Timer';
    case 'email-capture':
      return config.heading || 'Newsletter Box';
    case 'image-gallery':
      return config.heading || `Gallery (${config.images?.length || 0})`;
    case 'text-block':
      return config.content?.slice(0, 20) || 'Text Block';
    case 'divider':
      return config.style ? `${config.style} Divider` : 'Divider';
    default:
      return (block.type as string).replace('-', ' ');
  }
};

export const BlockListPanel: React.FC<BlockListPanelProps> = ({
  onOpenAddDrawer,
}) => {
  const page = useBioEditorStore((s) => s.page);
  const selectedBlockId = useBioEditorStore((s) => s.selectedBlockId);
  
  const setSelectedBlockId = useBioEditorStore((s) => s.setSelectedBlockId);
  const moveBlock = useBioEditorStore((s) => s.moveBlock);
  const toggleBlockVisibility = useBioEditorStore((s) => s.toggleBlockVisibility);
  const duplicateBlock = useBioEditorStore((s) => s.duplicateBlock);
  const removeBlock = useBioEditorStore((s) => s.removeBlock);

  const blocks = page?.draftBlocks || [];

  return (
    <aside 
      data-lenis-prevent="true"
      className="w-72 lg:w-80 h-full bg-white dark:bg-[#111114] border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 z-20 select-none font-sans"
    >
      {/* ── TOP HEADER: Layers title + Count ── */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-sky-500/10 text-sky-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Block Layers
          </span>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
          {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
        </span>
      </div>

      {/* ── MIDDLE: Scrollable Block Layers List ── */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
        {blocks.map((block, idx) => {
          const isSelected = selectedBlockId === block.id;
          const isFirst = idx === 0;
          const isLast = idx === blocks.length - 1;
          const icon = BLOCK_TYPE_ICONS[block.type] || <Sparkles className="w-3.5 h-3.5" />;
          const label = getBlockLabel(block);

          return (
            <div
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              className={`w-full rounded-xl p-2 transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-[#16161a] text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
              } ${!block.isVisible ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Left: Reorder Up/Down & Index & Icon */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Up/Down buttons */}
                <div 
                  className="flex flex-col items-center shrink-0 -space-y-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={isFirst}
                    onClick={() => moveBlock(idx, idx - 1)}
                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors ${
                      isFirst ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Move up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => moveBlock(idx, idx + 1)}
                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/20 transition-colors ${
                      isLast ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Icon badge */}
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  isSelected 
                    ? 'bg-white/10 text-white dark:bg-black/10 dark:text-black' 
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}>
                  {icon}
                </div>

                {/* Title & Type */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate capitalize leading-tight">
                    {label}
                  </span>
                  <span className={`text-[9px] font-mono truncate capitalize ${
                    isSelected ? 'opacity-70' : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {block.type.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Right: Quick Action Icons (Visibility, Duplicate, Delete) */}
              <div 
                className="flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visibility */}
                <button
                  onClick={() => toggleBlockVisibility(block.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/20 text-white dark:text-black dark:hover:bg-black/20'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                  title={block.isVisible ? 'Hide from live page' : 'Show on live page'}
                >
                  {block.isVisible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => duplicateBlock(block.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/20 text-white dark:text-black dark:hover:bg-black/20'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Duplicate block"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeBlock(block.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'hover:bg-red-500 hover:text-white text-white dark:text-black'
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                  }`}
                  title="Delete block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}

        {blocks.length === 0 && (
          <div className="py-12 px-4 text-center">
            <Layers className="w-6 h-6 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              No blocks on this page
            </p>
            <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 mt-1">
              Click below to add your first block component.
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM CTA: + Add Block Trigger ── */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 shrink-0">
        <button
          onClick={onOpenAddDrawer}
          className="w-full py-2.5 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Block</span>
        </button>
      </div>

    </aside>
  );
};
