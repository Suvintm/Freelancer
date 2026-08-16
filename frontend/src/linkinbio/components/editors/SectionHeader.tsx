import React from 'react';
import * as LucideIcons from 'lucide-react';

interface SectionHeaderProps {
  icon?: string;
  label: string;
  description?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, label, description }) => {
  // Dynamically resolve icon from Lucide
  const IconComponent = icon && (LucideIcons as any)[icon] ? (LucideIcons as any)[icon] : LucideIcons.Sliders;

  return (
    <div className="border-b border-border-main/50 pb-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <IconComponent size={13} />
        </div>
        <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
          {label}
        </h3>
      </div>
      {description && (
        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
