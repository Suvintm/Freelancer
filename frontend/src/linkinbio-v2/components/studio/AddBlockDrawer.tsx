import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLOCK_REGISTRY } from '../../registry/blockRegistry';
import type { BlockType } from '../../types/block.types';
import { 
  X, 
  Search, 
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
  Sparkles, 
  Plus 
} from 'lucide-react';

interface AddBlockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  'profile-header': <User className="w-5 h-5" />,
  'link-button': <Link2 className="w-5 h-5" />,
  'social-bar': <Share2 className="w-5 h-5" />,
  'product-grid': <ShoppingBag className="w-5 h-5" />,
  'video-embed': <Video className="w-5 h-5" />,
  'audio-player': <Music className="w-5 h-5" />,
  'email-capture': <Mail className="w-5 h-5" />,
  'image-gallery': <Image className="w-5 h-5" />,
  'text': <Type className="w-5 h-5" />,
  'divider': <Minus className="w-5 h-5" />,
};

const CATEGORIES = [
  { id: 'all', label: 'All Blocks' },
  { id: 'essentials', label: 'Essentials' },
  { id: 'media', label: 'Media & Content' },
  { id: 'monetization', label: 'Monetization' },
  { id: 'layout', label: 'Layout' },
];

export const AddBlockDrawer: React.FC<AddBlockDrawerProps> = ({
  isOpen,
  onClose,
  onAddBlock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const registeredBlocks = useMemo(() => Object.values(BLOCK_REGISTRY), []);

  const filteredBlocks = useMemo(() => {
    return registeredBlocks.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [registeredBlocks, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none font-sans"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />

        {/* Drawer Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', duration: 0.28 }}
          data-lenis-prevent="true"
          className="relative z-50 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        >
          {/* Top Bar Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Add a New Block
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Select a block component to add to your bio page.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-[#111114] shrink-0">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Block Cards Grid */}
          <div 
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/40 dark:bg-zinc-950/40 no-scrollbar"
          >
            {filteredBlocks.map((blockDef) => {
              const icon = BLOCK_ICONS[blockDef.type] || <Sparkles className="w-5 h-5" />;

              return (
                <button
                  key={blockDef.type}
                  onClick={() => {
                    onAddBlock(blockDef.type);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 text-left flex items-start gap-3 transition-all hover:shadow-sm active:scale-[0.98] group cursor-pointer"
                >
                  {/* Icon Badge */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 shrink-0 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                    {icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {blockDef.name}
                      </h4>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                        {blockDef.category}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                      {blockDef.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredBlocks.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <Search className="w-6 h-6 text-slate-300 dark:text-zinc-700 mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  No matching blocks
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Try searching with different terms.
                </span>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
