import React from 'react';
import { SectionWrapper } from '../../_base/SectionWrapper';
import type { ProfileBlock } from '../../../types/profile.types';
import type { ResolvedTheme } from '../../../types/template.types';

interface FloraServiceCardsProps {
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  isEditing?: boolean;
  isActive?: boolean;
  onSectionClick?: (regionId: string) => void;
}

export const FloraServiceCards: React.FC<FloraServiceCardsProps> = ({
  blocks,
  theme,
  isEditing,
  isActive,
  onSectionClick,
}) => {
  const visibleBlocks = blocks.filter((b) => b.isVisible);
  const primaryColor  = String(theme.primaryColor ?? '#736154');
  const textColor     = String(theme.textColor ?? '#ffffff');
  const headingColor  = String(theme.headingColor ?? '#1E1A17');
  const radius        = `${theme.borderRadius ?? 14}px`;
  const spacing       = Number(theme.spacing ?? 10);
  const fontFamily    = String(theme.fontFamily ?? 'Poppins');
  const bookingTitle  = String(theme.bookingTitle ?? 'Book an appointment');

  // Default sample beauty services if user hasn't added custom blocks yet
  const defaultServices = [
    {
      id: 'default-1',
      title: 'Women haircuts',
      subtitle: 'contact by WhatsApp',
      thumbnail: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=120&auto=format&fit=crop&q=80',
      url: '#',
    },
    {
      id: 'default-2',
      title: 'Children haircuts',
      subtitle: 'contact by WhatsApp',
      thumbnail: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=120&auto=format&fit=crop&q=80',
      url: '#',
    },
    {
      id: 'default-3',
      title: 'Makeup',
      subtitle: 'contact by WhatsApp',
      thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&auto=format&fit=crop&q=80',
      url: '#',
    },
    {
      id: 'default-4',
      title: 'Eyebrows & eyelashes',
      subtitle: 'contact by WhatsApp',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=80',
      url: '#',
    },
  ];

  const itemsToRender = visibleBlocks.length > 0 ? visibleBlocks.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: (b.metadata?.subtitle as string) || 'contact by WhatsApp',
    thumbnail: (b.metadata?.thumbnail as string) || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=120&auto=format&fit=crop&q=80',
    url: b.url || '#',
  })) : defaultServices;

  return (
    <SectionWrapper
      regionId="services"
      isEditing={isEditing}
      isActive={isActive}
      onSectionClick={onSectionClick}
      className="w-full flex flex-col px-5 pt-4 pb-6 select-none"
    >
      {/* Section Title */}
      <h2
        className="text-xs font-bold text-center mb-2.5 tracking-tight"
        style={{ color: headingColor, fontFamily }}
      >
        {bookingTitle}
      </h2>

      {/* Services List */}
      <div className="w-full flex flex-col" style={{ gap: `${spacing}px` }}>
        {itemsToRender.map((item) => (
          <a
            key={item.id}
            href={isEditing ? '#' : item.url}
            target={isEditing ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
            className="w-full h-14 p-1.5 pr-4 flex items-center gap-3 shadow-xs transition-transform active:scale-[0.98] group overflow-hidden"
            style={{
              backgroundColor: primaryColor,
              borderRadius: radius,
              fontFamily,
            }}
          >
            {/* Square Rounded Thumbnail Image */}
            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black/10 border border-white/10">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0 text-left">
              <h3
                className="text-xs font-semibold truncate leading-snug"
                style={{ color: textColor }}
              >
                {item.title}
              </h3>
              <p
                className="text-[10px] text-white/70 truncate leading-tight"
              >
                {item.subtitle}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Footer Branding */}
      {theme.showLogo !== false && (
        <div className="pt-6 pb-2 flex justify-center w-full opacity-40 select-none">
          <span className="text-[9px] font-semibold text-[#6B5E55] tracking-wider uppercase">
            Powered by SuviX
          </span>
        </div>
      )}
    </SectionWrapper>
  );
};

export default FloraServiceCards;
