import React from 'react';
import type { ProductGridConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface ProductGridBlockProps {
  config: ProductGridConfig;
  theme?: Theme;
}

export const ProductGridBlock: React.FC<ProductGridBlockProps> = ({ config, theme }) => {
  const { products, columns = 2, showPrice = true } = config;

  if (!products || products.length === 0) {
    return null;
  }

  const gridColsClass =
    columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  const cardRadius = theme?.buttons?.style === 'pill' ? 'rounded-2xl' : 'rounded-xl';

  return (
    <div className={`w-full grid ${gridColsClass} gap-2.5 my-2`}>
      {products.map((item) => (
        <a
          key={item.id}
          href={item.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative flex flex-col overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 ${cardRadius} transition-all duration-200 no-underline shadow-sm hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="relative aspect-square w-full overflow-hidden bg-black/20">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}

            {item.badge && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500/90 text-white font-bold text-[10px] tracking-wider uppercase backdrop-blur-sm shadow-sm">
                {item.badge}
              </div>
            )}
          </div>

          <div className="p-2.5 flex flex-col flex-1 justify-between">
            <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
              {item.title}
            </h4>

            <div className="mt-2 flex items-center justify-between">
              {showPrice && (
                <span className="text-xs font-bold text-sky-400">
                  {item.price}
                </span>
              )}
              <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-sky-500 flex items-center justify-center text-white transition-colors ml-auto">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};
