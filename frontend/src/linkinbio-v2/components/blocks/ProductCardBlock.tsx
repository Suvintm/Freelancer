import React from 'react';
import type { ProductCardConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { ShoppingBag, ArrowUpRight, Tag } from 'lucide-react';

interface ProductCardBlockProps {
  config: ProductCardConfig;
  theme?: Theme;
}

export const ProductCardBlock: React.FC<ProductCardBlockProps> = ({ config, theme: _theme }) => {
  const {
    title = 'Ultimate Creator Notion OS',
    description = 'All-in-one system to manage your content calendar, sponsors, and growth.',
    price = '$29',
    originalPrice = '$59',
    imageUrl = 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80',
    url = 'https://suvix.in',
    badgeText = '50% OFF',
    buttonText = 'Get Instant Access',
  } = config;

  return (
    <div className="w-full my-2 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-100 dark:border-white/10 overflow-hidden select-none font-sans text-left transition-all hover:scale-[1.01]">
      
      {/* Product Image Cover */}
      <div className="w-full h-32 relative overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {badgeText && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[8px] uppercase tracking-wider shadow-sm flex items-center gap-0.5">
            <Tag className="w-2.5 h-2.5" />
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3">
        <h4 className="font-extrabold text-xs text-slate-900 tracking-tight leading-snug">
          {title}
        </h4>
        {description && (
          <p className="text-[9.5px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
            {description}
          </p>
        )}

        {/* Pricing and Action Button */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-950 font-mono">
              {price}
            </span>
            {originalPrice && (
              <span className="text-[10px] text-slate-400 line-through font-mono">
                {originalPrice}
              </span>
            )}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>{buttonText}</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default ProductCardBlock;
