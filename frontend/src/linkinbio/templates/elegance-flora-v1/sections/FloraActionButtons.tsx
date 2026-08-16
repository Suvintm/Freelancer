import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { SectionWrapper } from '../../_base/SectionWrapper';
import type { ResolvedTheme } from '../../../types/template.types';

interface FloraActionButtonsProps {
  theme: ResolvedTheme;
  isEditing?: boolean;
  isActive?: boolean;
  onSectionClick?: (regionId: string) => void;
}

export const FloraActionButtons: React.FC<FloraActionButtonsProps> = ({
  theme,
  isEditing,
  isActive,
  onSectionClick,
}) => {
  const primaryColor = String(theme.primaryColor ?? '#736154');
  const textColor    = String(theme.textColor ?? '#ffffff');
  const headingColor = String(theme.headingColor ?? '#1E1A17');
  const radius       = `${theme.borderRadius ?? 14}px`;
  const spacing      = Number(theme.spacing ?? 10);
  const fontFamily   = String(theme.fontFamily ?? 'Poppins');
  const title        = String(theme.consultationTitle ?? 'For consultations');

  const showCall     = theme.showCallButton !== false;
  const showWhatsapp = theme.showWhatsappButton !== false;

  const phoneNum     = String(theme.callPhoneNumber || '+1234567890');
  const whatsappNum  = String(theme.whatsappNumber || '+1234567890');

  if (!showCall && !showWhatsapp && !isEditing) return null;

  return (
    <SectionWrapper
      regionId="actions"
      isEditing={isEditing}
      isActive={isActive}
      onSectionClick={onSectionClick}
      className="w-full flex flex-col px-5 pt-3 select-none"
    >
      {/* Section Title */}
      <h2
        className="text-xs font-bold text-center mb-2.5 tracking-tight"
        style={{ color: headingColor, fontFamily }}
      >
        {title}
      </h2>

      {/* Consultation Action Buttons */}
      <div className="w-full flex flex-col" style={{ gap: `${spacing}px` }}>
        {showCall && (
          <a
            href={isEditing ? '#' : `tel:${phoneNum}`}
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
            className="w-full h-11 px-4 flex items-center shadow-xs transition-transform active:scale-[0.98] group relative"
            style={{
              backgroundColor: primaryColor,
              color: textColor,
              borderRadius: radius,
              fontFamily,
            }}
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              <Phone size={15} className="fill-current" />
            </div>
            <span className="flex-1 text-center text-xs font-semibold -ml-5">
              Call
            </span>
          </a>
        )}

        {showWhatsapp && (
          <a
            href={isEditing ? '#' : `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
            target={isEditing ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
            className="w-full h-11 px-4 flex items-center shadow-xs transition-transform active:scale-[0.98] group relative"
            style={{
              backgroundColor: primaryColor,
              color: textColor,
              borderRadius: radius,
              fontFamily,
            }}
          >
            <div className="flex items-center justify-center w-5 h-5 shrink-0">
              <MessageCircle size={16} className="fill-current" />
            </div>
            <span className="flex-1 text-center text-xs font-semibold -ml-5">
              Send a Whatsapp
            </span>
          </a>
        )}
      </div>
    </SectionWrapper>
  );
};

export default FloraActionButtons;
