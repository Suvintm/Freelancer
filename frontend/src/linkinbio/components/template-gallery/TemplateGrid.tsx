import React from 'react';
import type { TemplateConfig } from '../../types/template.types';
import TemplateCard from './TemplateCard';
import { getAllTemplateConfigs } from '../../templates/registry';

interface TemplateGridProps {
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  selectedSlug,
  onSelect,
}) => {
  const configs: TemplateConfig[] = getAllTemplateConfigs();

  return (
    <div className="space-y-4">
      <div className="border-b border-border-main/50 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
          Available Templates ({configs.length})
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5">
          Select a layout engine. All templates can be customized.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {configs.map((config) => (
          <TemplateCard
            key={config.slug}
            config={config}
            isSelected={selectedSlug === config.slug}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default TemplateGrid;
