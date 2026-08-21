import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import type { 
  ProfileHeaderConfig, 
  ProfileVariant,
  AvatarShape,
  AvatarSize,
  LinkButtonConfig, 
  SocialBarConfig, 
  ProductGridConfig, 
  ProductCardConfig,
  VideoEmbedConfig, 
  MusicEmbedConfig,
  TextBlockConfig, 
  ImageGalleryConfig, 
  EmailCaptureConfig, 
  TipJarConfig,
  FaqAccordionConfig,
  CountdownConfig,
  DividerConfig,
  SocialLinkItem,
  ProductItem
} from '../../types/block.types';
import { VariantSelector, type VariantOption } from './VariantSelector';
import { HeaderVariantGalleryModal } from './HeaderVariantGalleryModal';
import { 
  Sliders, 
  Trash2, 
  X,
  User,
  Image as ImageIcon,
  Columns,
  Layers,
  Sparkles,
  Circle,
  Square,
  Wand2,
  LayoutGrid
} from 'lucide-react';

export const BlockInspectorPanel: React.FC = () => {
  const page = useBioEditorStore((s) => s.page);
  const selectedBlockId = useBioEditorStore((s) => s.selectedBlockId);
  const updateBlockConfig = useBioEditorStore((s) => s.updateBlockConfig);
  const removeBlock = useBioEditorStore((s) => s.removeBlock);

  if (!page || !selectedBlockId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-500 select-none">
        <Sliders className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
          No Block Selected
        </p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-[200px]">
          Click on any block in the canvas or layers list to customize its properties.
        </p>
      </div>
    );
  }

  const block = page.draftBlocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center">
        Block not found.
      </div>
    );
  }

  const handleConfigChange = (updates: Record<string, any>) => {
    updateBlockConfig(block.id, updates);
  };

  return (
    <div 
      data-lenis-prevent="true"
      className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar font-sans select-none"
    >
      {/* Block Type Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
            Inspector
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
            {block.type.replace('-', ' ')}
          </h3>
        </div>

        <button
          onClick={() => removeBlock(block.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
          title="Delete Block"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Render Dynamic Form Controls Based on Block Type */}
      {block.type === 'profile-header' && (
        <ProfileHeaderForm 
          config={block.config as ProfileHeaderConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'link-button' && (
        <LinkButtonForm 
          config={block.config as LinkButtonConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'social-bar' && (
        <SocialBarForm 
          config={block.config as SocialBarConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'product-grid' && (
        <ProductGridForm 
          config={block.config as ProductGridConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'video-embed' && (
        <VideoEmbedForm 
          config={block.config as VideoEmbedConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'text-block' && (
        <TextBlockForm 
          config={block.config as TextBlockConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'tip-jar' && (
        <TipJarForm 
          config={block.config as TipJarConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'music-embed' && (
        <MusicEmbedForm 
          config={block.config as MusicEmbedConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'faq-accordion' && (
        <FaqAccordionForm 
          config={block.config as FaqAccordionConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'countdown' && (
        <CountdownForm 
          config={block.config as CountdownConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'product-card' && (
        <ProductCardForm 
          config={block.config as ProductCardConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'email-capture' && (
        <EmailCaptureForm 
          config={block.config as EmailCaptureConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'image-gallery' && (
        <ImageGalleryForm 
          config={block.config as ImageGalleryConfig} 
          onChange={handleConfigChange} 
        />
      )}

      {block.type === 'divider' && (
        <DividerForm 
          config={block.config as DividerConfig} 
          onChange={handleConfigChange} 
        />
      )}
    </div>
  );
};

// ── 1. PROFILE HEADER FORM & VARIANTS ENGINE ──
const HEADER_VARIANTS: VariantOption<ProfileVariant>[] = [
  { id: 'centered', label: 'Centered', desc: 'Classic Linktree', icon: <User className="w-3.5 h-3.5 text-sky-500" /> },
  { id: 'banner', label: 'Cover Hero', desc: 'Widescreen banner', icon: <ImageIcon className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'split', label: 'Split Card', desc: 'Side-by-side SaaS', icon: <Columns className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'compact', label: 'Compact', desc: 'Minimal pill', icon: <Layers className="w-3.5 h-3.5 text-indigo-500" /> },
  { id: 'story', label: 'Story Glow', desc: 'Instagram Aura ring', icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" /> },
];

const AVATAR_SHAPES: { id: AvatarShape; label: string; icon: React.ReactNode }[] = [
  { id: 'circle', label: 'Circle', icon: <Circle className="w-3 h-3" /> },
  { id: 'squircle', label: 'Squircle', icon: <Square className="w-3 h-3 rounded-xs" /> },
  { id: 'square', label: 'Square', icon: <Square className="w-3 h-3" /> },
];

const AVATAR_SIZES: { id: AvatarSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const BANNER_PRESETS = [
  { label: 'Abstract Glow', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cyber Grid', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Forest Mist', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Studio Minimal', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80' },
];

const QUICK_LOOKS = [
  { label: '🌟 Signature Pro', variant: 'centered' as const, avatarShape: 'circle' as const, avatarSize: 'medium' as const },
  { label: '🖼️ Cover Hero', variant: 'banner' as const, avatarShape: 'circle' as const, avatarSize: 'medium' as const },
  { label: '📇 Founder Split', variant: 'split' as const, avatarShape: 'squircle' as const, avatarSize: 'small' as const },
  { label: '📱 Minimal Pill', variant: 'compact' as const, avatarShape: 'circle' as const, avatarSize: 'small' as const },
  { label: '💫 Story Glow', variant: 'story' as const, avatarShape: 'circle' as const, avatarSize: 'medium' as const },
];

const ProfileHeaderForm: React.FC<{
  config: ProfileHeaderConfig;
  onChange: (updates: Partial<ProfileHeaderConfig>) => void;
}> = ({ config, onChange }) => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = React.useState(false);
  const currentVariant = config.variant || 'centered';
  const currentShape = config.avatarShape || 'circle';
  const currentSize = config.avatarSize || 'medium';

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* ── BROWSE VISUAL VARIANTS MODAL TRIGGER (Figma / Canva Gallery) ── */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500 text-white shadow-xs">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-tight">
              Header Layout Gallery
            </span>
            <span className="text-[9.5px] text-slate-500 dark:text-zinc-400">
              Browse visual mockup cards
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGalleryModalOpen(true)}
          className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[10.5px] font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          Browse All 🎨
        </button>
      </div>

      {/* ── 1-CLICK QUICK LOOKS ── */}
      <div>
        <div className="flex items-center gap-1 mb-1.5 text-slate-700 dark:text-zinc-300">
          <Wand2 className="w-3 h-3 text-sky-500" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider">
            1-Click Preset Looks
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_LOOKS.map((look) => (
            <button
              key={look.label}
              type="button"
              onClick={() =>
                onChange({
                  variant: look.variant,
                  avatarShape: look.avatarShape,
                  avatarSize: look.avatarSize,
                })
              }
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                currentVariant === look.variant
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {look.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── VISUAL VARIANT SELECTOR (Canva/Figma Switcher) ── */}
      <VariantSelector<ProfileVariant>
        label="Header Layout Style"
        value={currentVariant}
        options={HEADER_VARIANTS}
        onChange={(v) => onChange({ variant: v })}
        columns={2}
      />

      {/* ── HEADER VARIANT GALLERY MODAL ── */}
      <HeaderVariantGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        currentVariant={currentVariant}
        onSelectVariant={(v) => onChange({ variant: v })}
        avatarUrl={config.avatarUrl}
        name={config.title}
        handle={config.subtitle}
        bio={config.bio}
      />

      {/* ── AVATAR SHAPE & SIZE ── */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        <div>
          <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Avatar Shape
          </label>
          <div className="grid grid-cols-3 gap-1">
            {AVATAR_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => onChange({ avatarShape: shape.id })}
                className={`py-1.5 px-1 rounded-lg border text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  currentShape === shape.id
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                }`}
              >
                {shape.icon}
                <span>{shape.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Avatar Size
          </label>
          <div className="grid grid-cols-3 gap-1">
            {AVATAR_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => onChange({ avatarSize: size.id })}
                className={`py-2 px-1 rounded-lg border text-[10px] font-semibold text-center transition-all cursor-pointer ${
                  currentSize === size.id
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTEXTUAL BANNER COVER CONTROLS (Only when Banner variant is active) ── */}
      {currentVariant === 'banner' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <label className="block text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
            Widescreen Cover Photo
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {BANNER_PRESETS.map((bp) => (
              <button
                key={bp.label}
                type="button"
                onClick={() => onChange({ bannerUrl: bp.url })}
                className="h-10 rounded-lg overflow-hidden border border-amber-500/30 hover:scale-105 transition-transform cursor-pointer relative"
                style={{
                  backgroundImage: `url(${bp.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                title={bp.label}
              />
            ))}
          </div>
          <input
            type="text"
            value={config.bannerUrl || ''}
            onChange={(e) => onChange({ bannerUrl: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
            placeholder="Custom Cover Image URL..."
          />
        </div>
      )}

      {/* ── CORE CONTENT FIELDS (Preserved 100% across all variant switches) ── */}
      <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={config.title || (config as any).displayName || ''}
            onChange={(e) => onChange({ title: e.target.value, displayName: e.target.value } as any)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            placeholder="e.g. SuviX Creator"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Sub-headline / Title Badge
          </label>
          <input
            type="text"
            value={(config as any).badgeText || ''}
            onChange={(e) => onChange({ badgeText: e.target.value } as any)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            placeholder="e.g. Creator & Innovator"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Bio / Subtitle
          </label>
          <textarea
            rows={2}
            value={config.subtitle || (config as any).bio || ''}
            onChange={(e) => onChange({ subtitle: e.target.value, bio: e.target.value } as any)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white resize-none"
            placeholder="Short description or tagline"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Avatar Image URL
          </label>
          <input
            type="text"
            value={config.imageUrl || (config as any).avatarUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value, avatarUrl: e.target.value } as any)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
            Verified Checkmark Badge
          </span>
          <button
            type="button"
            onClick={() => onChange({ showVerifiedBadge: config.showVerifiedBadge === false ? true : false })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              config.showVerifiedBadge !== false ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                config.showVerifiedBadge !== false ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 2. LINK BUTTON FORM ──
const LinkButtonForm: React.FC<{
  config: LinkButtonConfig;
  onChange: (updates: Partial<LinkButtonConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Button Title
      </label>
      <input
        type="text"
        value={config.text || (config as any).title || ''}
        onChange={(e) => onChange({ text: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
        placeholder="e.g. Visit My Portfolio"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Destination URL
      </label>
      <input
        type="url"
        value={config.url || ''}
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
        placeholder="https://example.com"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Badge / Subtitle (Optional)
      </label>
      <input
        type="text"
        value={config.subtitle || ''}
        onChange={(e) => onChange({ subtitle: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
        placeholder="e.g. Free Download, 20% Off"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Button Style
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {(['card', 'solid', 'outline', 'soft', 'glass'] as const).map((variant) => (
          <button
            key={variant}
            onClick={() => onChange({ variant })}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer border ${
              (config.variant || 'card') === variant
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
            }`}
          >
            {variant}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── 3. SOCIAL BAR FORM ──
const SocialBarForm: React.FC<{
  config: SocialBarConfig;
  onChange: (updates: Partial<SocialBarConfig>) => void;
}> = ({ config, onChange }) => {
  const links = config.links || [];

  const addPlatform = (platform: SocialLinkItem['platform']) => {
    const newLinks = [...links, { id: `social_${platform}_${links.length + 1}`, platform, url: 'https://' }];
    onChange({ links: newLinks });
  };

  const updatePlatformUrl = (id: string, url: string) => {
    const newLinks = links.map((l) => (l.id === id ? { ...l, url } : l));
    onChange({ links: newLinks });
  };

  const removePlatform = (id: string) => {
    const newLinks = links.filter((l) => l.id !== id);
    onChange({ links: newLinks });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
          Social Links ({links.length})
        </label>
      </div>

      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-1.5">
            <span className="w-18 text-[11px] font-semibold uppercase font-mono truncate text-slate-500 dark:text-zinc-400">
              {link.platform}
            </span>
            <input
              type="text"
              value={link.url}
              onChange={(e) => updatePlatformUrl(link.id, e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={() => removePlatform(link.id)}
              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Add Platform Buttons */}
      <div>
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          + Add Platform
        </span>
        <div className="flex flex-wrap gap-1">
          {['instagram', 'youtube', 'twitter', 'tiktok', 'spotify', 'discord', 'github', 'email'].map((plat) => (
            <button
              key={plat}
              onClick={() => addPlatform(plat as any)}
              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[10px] font-semibold capitalize text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              +{plat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── 4. PRODUCT GRID FORM ──
const ProductGridForm: React.FC<{
  config: ProductGridConfig;
  onChange: (updates: Partial<ProductGridConfig>) => void;
}> = ({ config, onChange }) => {
  const products = config.products || [];

  const addProduct = () => {
    const newProduct: ProductItem = {
      id: `prod_${Date.now()}`,
      title: 'New Product Item',
      price: '$29.00',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300',
      url: 'https://example.com',
      badge: 'NEW',
    };
    onChange({ products: [...products, newProduct] });
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    onChange({ products: updated });
  };

  const removeProduct = (id: string) => {
    onChange({ products: products.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
          Products ({products.length})
        </label>
        <button
          onClick={addProduct}
          className="text-[11px] font-bold text-sky-500 hover:underline cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      <div className="space-y-3">
        {products.map((p, idx) => (
          <div 
            key={p.id}
            className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Item #{idx + 1}
              </span>
              <button
                onClick={() => removeProduct(p.id)}
                className="text-slate-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <input
              type="text"
              value={p.title}
              onChange={(e) => updateProduct(p.id, { title: e.target.value })}
              placeholder="Product Title"
              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={p.price}
                onChange={(e) => updateProduct(p.id, { price: e.target.value })}
                placeholder="Price (e.g. $49)"
                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none"
              />
              <input
                type="text"
                value={p.badge || ''}
                onChange={(e) => updateProduct(p.id, { badge: e.target.value })}
                placeholder="Badge (e.g. SALE)"
                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 5. VIDEO EMBED FORM ──
const VideoEmbedForm: React.FC<{
  config: VideoEmbedConfig;
  onChange: (updates: Partial<VideoEmbedConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Video URL (YouTube / Vimeo / TikTok)
      </label>
      <input
        type="text"
        value={config.videoUrl || ''}
        onChange={(e) => onChange({ videoUrl: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="https://www.youtube.com/watch?v=..."
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Title / Caption
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="e.g. Official Music Video"
      />
    </div>
  </div>
);

// ── 6. TEXT BLOCK FORM ──
const TextBlockForm: React.FC<{
  config: TextBlockConfig;
  onChange: (updates: Partial<TextBlockConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Text Content
      </label>
      <textarea
        rows={3}
        value={config.content || ''}
        onChange={(e) => onChange({ content: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
        placeholder="Write text or announcement..."
      />
    </div>
  </div>
);

// ── 7. EMAIL CAPTURE FORM ──
const EmailCaptureForm: React.FC<{
  config: EmailCaptureConfig;
  onChange: (updates: Partial<EmailCaptureConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Heading
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Join My VIP Newsletter"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Button Text
      </label>
      <input
        type="text"
        value={config.buttonText || ''}
        onChange={(e) => onChange({ buttonText: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Subscribe"
      />
    </div>
  </div>
);

// ── 8. IMAGE GALLERY FORM ──
const ImageGalleryForm: React.FC<{
  config: ImageGalleryConfig;
  onChange: (updates: Partial<ImageGalleryConfig>) => void;
}> = ({ config }) => (
  <div className="space-y-4 text-xs">
    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
      Images ({config.images?.length || 0})
    </label>
    <p className="text-[11px] text-slate-400">
      Add image URLs to display in your gallery carousel.
    </p>
  </div>
);

// ── 9. DIVIDER FORM ──
const DividerForm: React.FC<{
  config: DividerConfig;
  onChange: (updates: Partial<DividerConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Divider Style
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {(['line', 'dashed', 'dots', 'space'] as const).map((style) => (
          <button
            key={style}
            onClick={() => onChange({ style })}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer border ${
              config.style === style
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── 10. TIP JAR FORM ──
const TipJarForm: React.FC<{
  config: TipJarConfig;
  onChange: (updates: Partial<TipJarConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Card Title
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Support My Work"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Description
      </label>
      <textarea
        rows={2}
        value={config.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
        placeholder="Buy me a coffee! ☕"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Currency
      </label>
      <select
        value={config.currency || 'INR'}
        onChange={(e) => onChange({ currency: e.target.value as any })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
      >
        <option value="INR">INR (₹)</option>
        <option value="USD">USD ($)</option>
        <option value="EUR">EUR (€)</option>
        <option value="GBP">GBP (£)</option>
      </select>
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        UPI ID (for GPay / PhonePe / Paytm)
      </label>
      <input
        type="text"
        value={config.upiId || ''}
        onChange={(e) => onChange({ upiId: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="username@okaxis or phone@paytm"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Stripe / PayPal / Custom Payment URL (Optional)
      </label>
      <input
        type="text"
        value={config.paymentUrl || ''}
        onChange={(e) => onChange({ paymentUrl: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="https://buy.stripe.com/..."
      />
    </div>
  </div>
);

// ── 11. MUSIC EMBED FORM ──
const MusicEmbedForm: React.FC<{
  config: MusicEmbedConfig;
  onChange: (updates: Partial<MusicEmbedConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Platform
      </label>
      <select
        value={config.platform || 'spotify'}
        onChange={(e) => onChange({ platform: e.target.value as any })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
      >
        <option value="spotify">Spotify</option>
        <option value="apple-music">Apple Music</option>
        <option value="soundcloud">SoundCloud</option>
      </select>
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Track / Album URL
      </label>
      <input
        type="text"
        value={config.embedUrl || ''}
        onChange={(e) => onChange({ embedUrl: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="https://open.spotify.com/track/..."
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Display Title
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Featured Track"
      />
    </div>
  </div>
);

// ── 12. FAQ ACCORDION FORM ──
const FaqAccordionForm: React.FC<{
  config: FaqAccordionConfig;
  onChange: (updates: Partial<FaqAccordionConfig>) => void;
}> = ({ config, onChange }) => {
  const items = config.items || [];

  const handleItemChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  };

  const handleAddItem = () => {
    onChange({
      items: [
        ...items,
        {
          id: `faq_${Date.now()}`,
          question: 'New Question',
          answer: 'Answer to the question goes here.',
        },
      ],
    });
  };

  const handleDeleteItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 text-xs">
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Section Title
        </label>
        <input
          type="text"
          value={config.heading || ''}
          onChange={(e) => onChange({ heading: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          placeholder="Frequently Asked Questions"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
          Q&A Items ({items.length})
        </label>
        {items.map((item, idx) => (
          <div key={item.id || idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">#{idx + 1} Question</span>
              <button
                onClick={() => handleDeleteItem(idx)}
                className="text-rose-500 hover:text-rose-700 text-[10px] cursor-pointer"
              >
                Delete
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => handleItemChange(idx, 'question', e.target.value)}
              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white"
              placeholder="Question"
            />
            <textarea
              rows={2}
              value={item.answer}
              onChange={(e) => handleItemChange(idx, 'answer', e.target.value)}
              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white resize-none"
              placeholder="Answer"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddItem}
          className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
        >
          + Add FAQ Item
        </button>
      </div>
    </div>
  );
};

// ── 13. COUNTDOWN FORM ──
const CountdownForm: React.FC<{
  config: CountdownConfig;
  onChange: (updates: Partial<CountdownConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Countdown Header
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="🔥 Drop Goes Live In:"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Target Date & Time
      </label>
      <input
        type="datetime-local"
        value={config.targetDate ? new Date(config.targetDate).toISOString().slice(0, 16) : ''}
        onChange={(e) => onChange({ targetDate: new Date(e.target.value).toISOString() })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Expired Message
      </label>
      <input
        type="text"
        value={config.expiredText || ''}
        onChange={(e) => onChange({ expiredText: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Launch is Live! 🚀"
      />
    </div>
  </div>
);

// ── 14. PRODUCT CARD FORM ──
const ProductCardForm: React.FC<{
  config: ProductCardConfig;
  onChange: (updates: Partial<ProductCardConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Product Title
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="Ultimate Creator Notion OS"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Description
      </label>
      <textarea
        rows={2}
        value={config.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
        placeholder="Short product overview"
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Price
        </label>
        <input
          type="text"
          value={config.price || ''}
          onChange={(e) => onChange({ price: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          placeholder="$29 or ₹499"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Original Price
        </label>
        <input
          type="text"
          value={config.originalPrice || ''}
          onChange={(e) => onChange({ originalPrice: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          placeholder="$59 or ₹999"
        />
      </div>
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Cover Image URL
      </label>
      <input
        type="text"
        value={config.imageUrl || ''}
        onChange={(e) => onChange({ imageUrl: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="https://..."
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Purchase / Checkout URL
      </label>
      <input
        type="text"
        value={config.url || ''}
        onChange={(e) => onChange({ url: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        placeholder="https://..."
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Badge Tag
        </label>
        <input
          type="text"
          value={config.badgeText || ''}
          onChange={(e) => onChange({ badgeText: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          placeholder="50% OFF"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Button Label
        </label>
        <input
          type="text"
          value={config.buttonText || ''}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          placeholder="Buy Now"
        />
      </div>
    </div>
  </div>
);
