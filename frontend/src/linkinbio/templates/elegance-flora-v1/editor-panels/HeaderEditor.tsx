import React from 'react';
import type { TemplateEditorProps } from '../../../types/template.types';
import SectionHeader from '../../../components/editors/SectionHeader';
import ToggleField from '../../../components/editors/ToggleField';
import ColorPickerField from '../../../components/editors/ColorPickerField';
import FontSelector from '../../../components/editors/FontSelector';

type Props = Pick<TemplateEditorProps, 'creator' | 'theme' | 'onThemeChange' | 'onCreatorChange'>;

export const HeaderEditor: React.FC<Props> = ({ creator, theme, onThemeChange, onCreatorChange }) => {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon="User"
        label="Brand & Header"
        description="Customize your salon/business brand name, description, and aesthetic."
      />

      <div className="space-y-4 p-4 rounded-2xl bg-surface/50 border border-border-main/50">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Brand / Business Name
          </label>
          <input
            type="text"
            value={creator.displayName}
            onChange={(e) => onCreatorChange('displayName', e.target.value)}
            placeholder="Nuna Beauty"
            className="w-full h-9 px-3 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main focus:outline-none focus:ring-2 focus:ring-amber-800/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Welcome Bio / Subtitle
          </label>
          <textarea
            value={creator.bio}
            onChange={(e) => onCreatorChange('bio', e.target.value)}
            placeholder="Welcome to our link in bio page!"
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main focus:outline-none focus:ring-2 focus:ring-amber-800/40 resize-none"
          />
        </div>

        <ToggleField
          label="Botanical Leaf Art"
          description="Display the warm golden floral watermark in the top corner"
          checked={theme.showFloralWatermark !== false}
          onChange={(checked) => onThemeChange('showFloralWatermark', checked)}
        />

        <ColorPickerField
          label="Page Background Color"
          value={String(theme.backgroundColor ?? '#FAF7F2')}
          presets={['#FAF7F2', '#F5EFEB', '#FFFFFF', '#F2EDE4', '#1E1A17', '#121212']}
          onChange={(v) => onThemeChange('backgroundColor', v)}
        />

        <ColorPickerField
          label="Heading & Text Color"
          value={String(theme.headingColor ?? '#1E1A17')}
          presets={['#1E1A17', '#2C2621', '#3D342E', '#6B5E55', '#FFFFFF']}
          onChange={(v) => onThemeChange('headingColor', v)}
        />

        <FontSelector
          value={String(theme.fontFamily ?? 'Poppins')}
          options={['Poppins', 'Playfair Display', 'Inter', 'Raleway']}
          onChange={(v) => onThemeChange('fontFamily', v)}
        />
      </div>
    </div>
  );
};

export default HeaderEditor;
