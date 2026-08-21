import React from 'react';
import type { ImageGalleryConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { ImageIcon } from 'lucide-react';

interface ImageGalleryBlockProps {
  config: ImageGalleryConfig;
  theme?: Theme;
}

export const ImageGalleryBlock: React.FC<ImageGalleryBlockProps> = ({ config }) => {
  const { images, layout = 'grid', gap = 'small' } = config;

  if (!images || images.length === 0) {
    return null;
  }

  const gapClass =
    gap === 'none' ? 'gap-0' : gap === 'medium' ? 'gap-3' : gap === 'large' ? 'gap-4' : 'gap-2';

  if (layout === 'carousel') {
    return (
      <div className="w-full my-2.5 overflow-hidden">
        <div className={`flex overflow-x-auto no-scrollbar scroll-smooth ${gapClass} py-1 snap-x`}>
          {images.map((img) => (
            <div
              key={img.id}
              className="snap-center shrink-0 w-48 h-48 rounded-xl overflow-hidden bg-black/20 border border-white/10 relative shadow-md"
            >
              <img src={img.imageUrl} alt={img.caption || 'Gallery image'} className="w-full h-full object-cover" />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] font-medium text-white">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colsClass = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className={`w-full grid ${colsClass} ${gapClass} my-2.5`}>
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative aspect-square rounded-xl overflow-hidden bg-black/20 border border-white/10 shadow-sm"
        >
          {img.imageUrl ? (
            <img
              src={img.imageUrl}
              alt={img.caption || 'Gallery'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}

          {img.caption && (
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {img.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
