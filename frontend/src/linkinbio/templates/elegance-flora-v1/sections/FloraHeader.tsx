import React from 'react';
import { SectionWrapper } from '../../_base/SectionWrapper';
import type { CreatorInfo } from '../../../types/profile.types';
import type { ResolvedTheme } from '../../../types/template.types';

interface FloraHeaderProps {
  creator: CreatorInfo;
  theme: ResolvedTheme;
  isEditing?: boolean;
  isActive?: boolean;
  onSectionClick?: (regionId: string) => void;
}

export const FloraHeader: React.FC<FloraHeaderProps> = ({
  creator,
  theme,
  isEditing,
  isActive,
  onSectionClick,
}) => {
  const fontFamily = String(theme.fontFamily ?? 'Poppins');
  const headingColor = String(theme.headingColor ?? '#1E1A17');
  const showWatermark = theme.showFloralWatermark !== false;

  return (
    <SectionWrapper
      regionId="header"
      isEditing={isEditing}
      isActive={isActive}
      onSectionClick={onSectionClick}
      className="relative flex flex-col items-center pt-8 pb-3 px-5 select-none w-full"
    >
      {/* Delicate Floral Botanical Line-Art Watermark Overlay in Top Corner */}
      {showWatermark && (
        <div className="absolute top-0 left-0 w-36 h-36 pointer-events-none opacity-25 select-none z-0 overflow-hidden">
          <svg viewBox="0 0 200 200" fill="none" stroke="#9A8372" strokeWidth="1.2" className="w-full h-full transform -rotate-12">
            <path d="M20,100 C50,40 100,20 150,30 C120,70 100,120 120,170 C80,150 40,140 20,100 Z" />
            <path d="M40,70 C70,20 120,10 160,50 C110,80 90,130 90,180" />
            <path d="M10,130 C30,90 70,60 110,70" />
            <path d="M80,30 C110,60 130,100 140,150" />
          </svg>
        </div>
      )}

      {/* Avatar Image */}
      <div className="relative shrink-0 z-10">
        <div className="w-20 h-20 rounded-full p-0.5 border border-[#C5B3A5]/60 shadow-sm bg-white overflow-hidden">
          <img
            src={creator.profilePicture || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
            alt={creator.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>

      {/* Business / Creator Title */}
      <h1
        className="text-base font-bold mt-3 text-center tracking-tight z-10"
        style={{ color: headingColor, fontFamily }}
      >
        {creator.displayName || 'Nuna Beauty'}
      </h1>

      {/* Subtitle / Bio */}
      <p
        className="text-[11px] text-center leading-relaxed mt-1 max-w-[240px] text-[#6B5E55] z-10"
        style={{ fontFamily }}
      >
        {creator.bio || 'Welcome to our link in bio page made on Many.bio!'}
      </p>
    </SectionWrapper>
  );
};

export default FloraHeader;
