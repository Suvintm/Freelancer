import React from 'react';
import type { LinkButtonConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { ExternalLink, Globe, Play, Camera, Music, ShoppingBag, Radio, Sparkles } from 'lucide-react';

interface LinkButtonBlockProps {
  config: LinkButtonConfig;
  theme?: Theme;
  onClick?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Globe,
  Play,
  Camera,
  Music,
  ShoppingBag,
  Radio,
  Sparkles,
};

export const LinkButtonBlock: React.FC<LinkButtonBlockProps> = ({ config, theme, onClick }) => {
  const { text, subtitle, url, variant, color, textColor, icon, imageUrl, animation, openInNewTab } = config;

  const buttonStyle = theme?.buttons?.style || 'rounded';
  const buttonRadius =
    buttonStyle === 'pill'
      ? '9999px'
      : buttonStyle === 'square'
      ? '6px'
      : buttonStyle === 'soft'
      ? '16px'
      : '12px';

  let animClass = '';
  if (animation === 'pulse') animClass = 'animate-pulse';
  if (animation === 'bounce') animClass = 'animate-bounce';
  if (animation === 'glow') animClass = 'ring-2 ring-sky-400/80 shadow-lg shadow-sky-500/30';

  const primaryColor = color || theme?.colors?.primary || '#3b82f6';
  const customTextColor = textColor || '#ffffff';

  const customStyle: React.CSSProperties = {
    borderRadius: buttonRadius,
  };

  let variantClass = '';

  if (variant === 'solid') {
    customStyle.backgroundColor = primaryColor;
    customStyle.color = customTextColor;
    variantClass = 'shadow-md hover:brightness-110 active:scale-[0.98] transition-all';
  } else if (variant === 'outline') {
    customStyle.borderColor = primaryColor;
    customStyle.borderWidth = '2px';
    customStyle.color = primaryColor;
    customStyle.backgroundColor = 'transparent';
    variantClass = 'hover:bg-white/5 active:scale-[0.98] transition-all';
  } else if (variant === 'soft') {
    customStyle.backgroundColor = `${primaryColor}22`;
    customStyle.color = primaryColor;
    customStyle.borderColor = `${primaryColor}44`;
    customStyle.borderWidth = '1px';
    variantClass = 'hover:brightness-125 active:scale-[0.98] transition-all';
  } else if (variant === 'glass') {
    customStyle.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    customStyle.borderColor = 'rgba(255, 255, 255, 0.18)';
    customStyle.borderWidth = '1px';
    customStyle.color = '#ffffff';
    variantClass = 'backdrop-blur-md hover:bg-white/15 active:scale-[0.98] transition-all shadow-lg';
  }

  const IconComponent = icon && ICON_MAP[icon] ? ICON_MAP[icon] : null;

  return (
    <a
      href={url || '#'}
      target={openInNewTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!url || onClick) {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={customStyle}
      className={`group relative w-full px-4 py-3.5 flex items-center gap-3.5 cursor-pointer no-underline ${variantClass} ${animClass} my-1.5`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={text}
          className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
        />
      ) : IconComponent ? (
        <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
      ) : null}

      <div className="flex-1 min-w-0 text-center pr-2">
        <p className="text-sm font-semibold truncate tracking-tight">{text || 'Untitled Link'}</p>
        {subtitle && (
          <p className="text-[11px] opacity-80 truncate mt-0.5 font-normal">{subtitle}</p>
        )}
      </div>

      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
};
