import React from 'react';

interface SectionWrapperProps {
  /** Must match an id in the template's config.editableSections */
  regionId: string;
  children: React.ReactNode;
  /** True only when rendered inside the studio builder */
  isEditing?: boolean;
  /** Fired when this section is clicked in editing mode */
  onSectionClick?: (regionId: string) => void;
  /** Whether this section is currently selected (shows highlight border) */
  isActive?: boolean;
  className?: string;
}

/**
 * SectionWrapper — wraps every clickable section inside a template.
 *
 * In editing mode:
 *  - Shows a subtle hover border so the creator knows what they can click
 *  - Shows a floating "Edit" label on hover
 *  - Fires onSectionClick(regionId) when clicked
 *  - Shows active highlight border when this section is selected
 *
 * In public/view mode (isEditing = false):
 *  - Renders children with zero overhead (no borders, no events)
 */
export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  regionId,
  children,
  isEditing = false,
  onSectionClick,
  isActive = false,
  className = '',
}) => {
  if (!isEditing) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      data-region-id={regionId}
      onClick={() => onSectionClick?.(regionId)}
      className={`
        relative group/section cursor-pointer rounded-xl transition-all duration-200
        ${isActive
          ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent'
          : 'hover:ring-2 hover:ring-indigo-400/60 hover:ring-offset-1 hover:ring-offset-transparent'
        }
        ${className}
      `}
    >
      {/* Floating "Edit" badge — visible on hover or when active */}
      <div
        className={`
          absolute top-1.5 right-1.5 z-50 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
          bg-indigo-600 text-white shadow-md transition-all duration-200 pointer-events-none
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover/section:opacity-100'}
        `}
      >
        {isActive ? 'Editing' : 'Click to edit'}
      </div>

      {children}
    </div>
  );
};

export default SectionWrapper;
