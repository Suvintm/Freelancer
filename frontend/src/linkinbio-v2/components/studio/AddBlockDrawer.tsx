import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Heart,
  HelpCircle,
  Clock,
} from 'lucide-react';

import { HeaderVariantPreviewCard, HEADER_VARIANTS_METADATA } from './HeaderVariantPreviewCard';
import { ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../store/slices/authSlice';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';

interface AddBlockDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (type: BlockType, configOverrides?: Record<string, any>) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  'profile-header': <User className="w-5 h-5 text-sky-500" />,
  'link-button': <Link2 className="w-5 h-5 text-emerald-500" />,
  'social-bar': <Share2 className="w-5 h-5 text-purple-500" />,
  'tip-jar': <Heart className="w-5 h-5 text-rose-500" />,
  'music-embed': <Music className="w-5 h-5 text-emerald-400" />,
  'email-capture': <Mail className="w-5 h-5 text-sky-400" />,
  'faq-accordion': <HelpCircle className="w-5 h-5 text-amber-500" />,
  'countdown': <Clock className="w-5 h-5 text-amber-400" />,
  'product-card': <ShoppingBag className="w-5 h-5 text-indigo-500" />,
  'product-grid': <ShoppingBag className="w-5 h-5 text-indigo-400" />,
  'video-embed': <Video className="w-5 h-5 text-red-500" />,
  'text-block': <Type className="w-5 h-5 text-slate-400" />,
  'image-gallery': <Image className="w-5 h-5 text-teal-400" />,
  'divider': <Minus className="w-5 h-5 text-zinc-400" />,
};

const CATEGORIES = [
  { id: 'all', label: 'All Blocks' },
  { id: 'core', label: 'Essentials' },
  { id: 'media', label: 'Media & Audio' },
  { id: 'commerce', label: 'Monetization' },
  { id: 'growth', label: 'Growth & Leads' },
  { id: 'layout', label: 'Layout' },
];

export const AddBlockDrawer: React.FC<AddBlockDrawerProps> = ({
  isOpen,
  onClose,
  onAddBlock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [variantStepBlock, setVariantStepBlock] = useState<'profile-header' | null>(null);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-lenis-prevent', 'true');

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.removeAttribute('data-lenis-prevent');
      };
    }
  }, [isOpen]);

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

  const currentUser = useSelector(selectUser);
  const bioPage = useBioEditorStore((s) => s.page);

  const previewName = bioPage?.title || currentUser?.name || 'Your Name';
  const previewHandle = currentUser?.username 
    ? `@${currentUser.username}` 
    : bioPage?.slug 
    ? `@${bioPage.slug}` 
    : '@yourhandle';
  const previewAvatar = currentUser?.profilePicture || (currentUser as any)?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
  const previewBio = (currentUser as any)?.bio || 'Your bio and description will appear here...';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none font-sans"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setVariantStepBlock(null);
            onClose();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99998]"
        />

        {/* Drawer Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.28 }}
          data-lenis-prevent="true"
          className={`relative z-[99999] w-full ${variantStepBlock ? 'max-w-4xl' : 'max-w-2xl'} max-h-[86vh] flex flex-col rounded-3xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all duration-300 overscroll-contain my-auto`}
        >
          {/* Top Bar Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2.5">
              {variantStepBlock ? (
                <button
                  type="button"
                  onClick={() => setVariantStepBlock(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Blocks</span>
                </button>
              ) : (
                <div className="p-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Plus className="w-4 h-4" />
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {variantStepBlock === 'profile-header' ? 'Choose Profile Header Style' : 'Add a New Block'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {variantStepBlock === 'profile-header'
                    ? 'Select your preferred layout variant. You can customize details anytime.'
                    : 'Select a block component to add to your bio page.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setVariantStepBlock(null);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Category Filter Bar (Only on root block view) */}
          {!variantStepBlock && (
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
          )}

          {/* ── CONDITIONAL BODY ── */}
          {variantStepBlock === 'profile-header' ? (
            /* 1. Header Variant Selection Gallery */
            <div 
              data-lenis-prevent="true"
              className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/40 dark:bg-zinc-950/40 no-scrollbar"
            >
              {HEADER_VARIANTS_METADATA.map((meta) => (
                <HeaderVariantPreviewCard
                  key={meta.id}
                  variantMeta={meta}
                  isSelected={false}
                  avatarUrl={previewAvatar}
                  name={previewName}
                  handle={previewHandle}
                  bio={previewBio}
                  onSelect={(v) => {
                    onAddBlock('profile-header', { 
                      variant: v,
                      title: previewName,
                      subtitle: previewHandle,
                      bio: previewBio,
                      avatarUrl: previewAvatar,
                    });
                    setVariantStepBlock(null);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            /* 2. Standard Block Cards Grid */
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
                      if (blockDef.type === 'profile-header') {
                        // Open Visual Variant Selector Step
                        setVariantStepBlock('profile-header');
                      } else {
                        onAddBlock(blockDef.type);
                        onClose();
                      }
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
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
