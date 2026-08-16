import React from 'react';
import type { TemplateEditorProps } from '../../../types/template.types';
import SectionHeader from '../../../components/editors/SectionHeader';
import RangeSlider from '../../../components/editors/RangeSlider';
import ColorPickerField from '../../../components/editors/ColorPickerField';
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

type Props = Pick<
  TemplateEditorProps,
  'blocks' | 'theme' | 'onThemeChange' | 'onBlockAdd' | 'onBlockUpdate' | 'onBlockRemove' | 'onBlockReorder'
>;

const PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=120&auto=format&fit=crop&q=80',
];

export const ServicesEditor: React.FC<Props> = ({
  blocks,
  theme,
  onThemeChange,
  onBlockAdd,
  onBlockUpdate,
  onBlockRemove,
  onBlockReorder,
}) => {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon="Scissors"
        label="Service & Booking Cards"
        description="Add and customize beauty services, photos, and WhatsApp booking links."
      />

      {/* Section Title & Styling */}
      <div className="space-y-4 p-4 rounded-2xl bg-surface/50 border border-border-main/50">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Section Title
          </label>
          <input
            type="text"
            value={String(theme.bookingTitle ?? 'Book an appointment')}
            onChange={(e) => onThemeChange('bookingTitle', e.target.value)}
            placeholder="Book an appointment"
            className="w-full h-9 px-3 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main"
          />
        </div>

        <RangeSlider
          label="Card Corner Rounding"
          value={Number(theme.borderRadius ?? 14)}
          min={4}
          max={32}
          unit="px"
          onChange={(v) => onThemeChange('borderRadius', v)}
        />

        <RangeSlider
          label="Card Spacing"
          value={Number(theme.spacing ?? 10)}
          min={6}
          max={24}
          unit="px"
          onChange={(v) => onThemeChange('spacing', v)}
        />
      </div>

      {/* Services List Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-main">
            Services List ({blocks.length})
          </h4>
          <button
            type="button"
            onClick={() => onBlockAdd('LINK')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#736154] hover:bg-[#5E4E42] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={13} />
            Add Service
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="p-6 rounded-2xl border-2 border-dashed border-border-main text-center">
            <p className="text-xs font-semibold text-text-muted">Showing default beauty services.</p>
            <button
              type="button"
              onClick={() => onBlockAdd('LINK')}
              className="mt-2 text-xs font-bold text-[#736154] hover:underline"
            >
              + Create custom service item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, idx) => {
              const subtitle = (block.metadata?.subtitle as string) || 'contact by WhatsApp';
              const thumbnail = (block.metadata?.thumbnail as string) || PRESET_THUMBNAILS[idx % PRESET_THUMBNAILS.length];

              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl bg-surface/60 border border-border-main/70 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[#736154] font-bold">SERVICE #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onBlockUpdate(block.id, { isVisible: !block.isVisible })}
                        className="p-1 text-text-muted hover:text-text-main"
                      >
                        {block.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onBlockReorder(block.id, 'up')}
                        className="p-1 disabled:opacity-30 text-text-muted"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === blocks.length - 1}
                        onClick={() => onBlockReorder(block.id, 'down')}
                        className="p-1 disabled:opacity-30 text-text-muted"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onBlockRemove(block.id)}
                        className="p-1 text-rose-400 hover:text-rose-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => onBlockUpdate(block.id, { title: e.target.value })}
                      placeholder="Service Name (e.g. Women haircuts)"
                      className="w-full h-8 px-3 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main"
                    />

                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => onBlockUpdate(block.id, { metadata: { ...block.metadata, subtitle: e.target.value } })}
                      placeholder="Subtitle (e.g. contact by WhatsApp)"
                      className="w-full h-8 px-3 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main"
                    />

                    <input
                      type="url"
                      value={block.url}
                      onChange={(e) => onBlockUpdate(block.id, { url: e.target.value })}
                      placeholder="Booking / WhatsApp Link"
                      className="w-full h-8 px-3 rounded-xl text-xs font-mono bg-surface border border-border-main text-text-main"
                    />
                  </div>

                  {/* Thumbnail Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon size={11} />
                      Thumbnail Image
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {PRESET_THUMBNAILS.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onBlockUpdate(block.id, { metadata: { ...block.metadata, thumbnail: imgUrl } })}
                          className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 ${
                            thumbnail === imgUrl ? 'border-[#736154] ring-2 ring-[#736154]/40 scale-105' : 'border-border-main/50 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesEditor;
