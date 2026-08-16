import React from 'react';
import TemplateGrid from '../template-gallery/TemplateGrid';

interface LeftPanelProps {
  selectedSlug: string;
  onSelectTemplate: (slug: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  selectedSlug,
  onSelectTemplate,
}) => {
  return (
    <aside className="w-full lg:w-64 xl:w-72 h-full flex flex-col border-r border-border-main/60 bg-container overflow-hidden select-none shrink-0">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <TemplateGrid
          selectedSlug={selectedSlug}
          onSelect={onSelectTemplate}
        />
      </div>
    </aside>
  );
};

export default LeftPanel;
