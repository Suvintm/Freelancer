import React from 'react';
import type { TemplateRenderProps } from '../../types/template.types';
import TemplateRoot from '../_base/TemplateRoot';
import FloraHeader from './sections/FloraHeader';
import FloraActionButtons from './sections/FloraActionButtons';
import FloraServiceCards from './sections/FloraServiceCards';

export const EleganceFloraTemplate: React.FC<TemplateRenderProps> = ({
  creator,
  blocks,
  theme,
  isEditing = false,
  activeSection = null,
  onSectionClick,
}) => {
  const bgStyle = String(theme.backgroundColor ?? '#FAF7F2');

  return (
    <TemplateRoot theme={theme}>
      <div
        className="w-full flex-1 flex flex-col justify-between max-w-md sm:max-w-lg md:max-w-xl mx-auto min-h-full transition-colors duration-200"
        style={{ backgroundColor: bgStyle }}
      >
        {/* Top Header Region */}
        <FloraHeader
          creator={creator}
          theme={theme}
          isEditing={isEditing}
          isActive={activeSection === 'header'}
          onSectionClick={onSectionClick}
        />

        {/* Middle Consultation Actions Region */}
        <FloraActionButtons
          theme={theme}
          isEditing={isEditing}
          isActive={activeSection === 'actions'}
          onSectionClick={onSectionClick}
        />

        {/* Bottom Services & Booking Cards Region */}
        <FloraServiceCards
          blocks={blocks}
          theme={theme}
          isEditing={isEditing}
          isActive={activeSection === 'services'}
          onSectionClick={onSectionClick}
        />
      </div>
    </TemplateRoot>
  );
};

export default EleganceFloraTemplate;
