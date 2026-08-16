import React from 'react';
import type { TemplateEditorProps } from '../../../types/template.types';
import SectionHeader from '../../../components/editors/SectionHeader';
import ToggleField from '../../../components/editors/ToggleField';
import ColorPickerField from '../../../components/editors/ColorPickerField';

type Props = Pick<TemplateEditorProps, 'theme' | 'onThemeChange'>;

export const ActionsEditor: React.FC<Props> = ({ theme, onThemeChange }) => {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon="Phone"
        label="Consultation Actions"
        description="Set up quick contact phone & WhatsApp buttons."
      />

      <div className="space-y-4 p-4 rounded-2xl bg-surface/50 border border-border-main/50">
        {/* Section Heading Text */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Section Title
          </label>
          <input
            type="text"
            value={String(theme.consultationTitle ?? 'For consultations')}
            onChange={(e) => onThemeChange('consultationTitle', e.target.value)}
            placeholder="For consultations"
            className="w-full h-9 px-3 rounded-xl text-xs font-semibold bg-surface border border-border-main text-text-main"
          />
        </div>

        {/* Call Button Setup */}
        <div className="space-y-2 pt-2 border-t border-border-main/40">
          <ToggleField
            label="Enable Call Button"
            checked={theme.showCallButton !== false}
            onChange={(c) => onThemeChange('showCallButton', c)}
          />
          {theme.showCallButton !== false && (
            <input
              type="tel"
              value={String(theme.callPhoneNumber ?? '+1234567890')}
              onChange={(e) => onThemeChange('callPhoneNumber', e.target.value)}
              placeholder="Phone Number (e.g. +1 555 123 4567)"
              className="w-full h-8 px-3 rounded-xl text-xs font-mono bg-surface border border-border-main text-text-main"
            />
          )}
        </div>

        {/* WhatsApp Button Setup */}
        <div className="space-y-2 pt-2 border-t border-border-main/40">
          <ToggleField
            label="Enable WhatsApp Button"
            checked={theme.showWhatsappButton !== false}
            onChange={(c) => onThemeChange('showWhatsappButton', c)}
          />
          {theme.showWhatsappButton !== false && (
            <input
              type="tel"
              value={String(theme.whatsappNumber ?? '+1234567890')}
              onChange={(e) => onThemeChange('whatsappNumber', e.target.value)}
              placeholder="WhatsApp Number (with country code)"
              className="w-full h-8 px-3 rounded-xl text-xs font-mono bg-surface border border-border-main text-text-main"
            />
          )}
        </div>

        {/* Button Color */}
        <div className="pt-2 border-t border-border-main/40">
          <ColorPickerField
            label="Button Background Color"
            value={String(theme.primaryColor ?? '#736154')}
            presets={['#736154', '#8A7565', '#5E4E42', '#3D342E', '#A69080', '#2B2B2B']}
            onChange={(v) => onThemeChange('primaryColor', v)}
          />
        </div>
      </div>
    </div>
  );
};

export default ActionsEditor;
