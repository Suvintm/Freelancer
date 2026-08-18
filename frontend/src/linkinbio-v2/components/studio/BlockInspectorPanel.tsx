import React from 'react';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import type { 
  ProfileHeaderConfig, 
  LinkButtonConfig, 
  SocialBarConfig, 
  ProductGridConfig, 
  VideoEmbedConfig, 
  TextBlockConfig, 
  ImageGalleryConfig, 
  EmailCaptureConfig, 
  DividerConfig,
  SocialLinkItem,
  ProductItem
} from '../../types/block.types';
import { 
  Sliders, 
  Trash2, 
  X
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

// ── 1. PROFILE HEADER FORM ──
const ProfileHeaderForm: React.FC<{
  config: ProfileHeaderConfig;
  onChange: (updates: Partial<ProfileHeaderConfig>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4 text-xs">
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Display Name
      </label>
      <input
        type="text"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
        placeholder="e.g. Alex Morgan"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Bio / Subtitle
      </label>
      <textarea
        rows={2}
        value={config.subtitle || ''}
        onChange={(e) => onChange({ subtitle: e.target.value })}
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
        value={config.imageUrl || ''}
        onChange={(e) => onChange({ imageUrl: e.target.value })}
        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
        placeholder="https://..."
      />
    </div>

    <div className="flex items-center justify-between pt-1">
      <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
        Verified Badge
      </span>
      <button
        onClick={() => onChange({ showVerifiedBadge: !config.showVerifiedBadge })}
        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
          config.showVerifiedBadge ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
            config.showVerifiedBadge ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  </div>
);

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
        value={config.text || ''}
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
      <div className="grid grid-cols-2 gap-1.5">
        {(['solid', 'outline', 'soft', 'glass'] as const).map((variant) => (
          <button
            key={variant}
            onClick={() => onChange({ variant })}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer border ${
              config.variant === variant
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
