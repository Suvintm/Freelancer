import React, { useState, useEffect } from 'react';
import type { LinkButtonConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { 
  ChevronRight,
  Globe, 
  Play, 
  Camera, 
  Music, 
  ShoppingBag, 
  Radio, 
  Sparkles,
  Youtube,
  Instagram,
  Mail,
  MessageCircle,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';

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
  Youtube,
  Instagram,
  Mail,
  MessageCircle,
  Github,
  Linkedin,
  Twitter,
  // Lowercase keys
  globe: Globe,
  play: Play,
  camera: Camera,
  music: Music,
  shoppingbag: ShoppingBag,
  radio: Radio,
  sparkles: Sparkles,
  youtube: Youtube,
  instagram: Instagram,
  mail: Mail,
  'message-circle': MessageCircle,
  messagecircle: MessageCircle,
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
};

export const LinkButtonBlock: React.FC<LinkButtonBlockProps> = ({ config, theme, onClick }) => {
  const { text, subtitle, url, variant = 'card', color, textColor, icon, imageUrl, animation, openInNewTab = true, schedule } = config;

  // Check schedule validity (useEffect isolates impure time lookups)
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    if (!schedule?.startAt && !schedule?.endAt) {
      setIsInactive(false);
      return;
    }
    const currentTime = Date.now();
    const isNotYetActive = schedule.startAt ? new Date(schedule.startAt).getTime() > currentTime : false;
    const isExpired = schedule.endAt ? new Date(schedule.endAt).getTime() < currentTime : false;
    setIsInactive(isNotYetActive || isExpired);
  }, [schedule?.startAt, schedule?.endAt]);

  if (isInactive) {
    return null; // Automatically hidden from public visitors when not active
  }

  const buttonStyle = theme?.buttons?.style || 'rounded';
  const buttonRadius =
    buttonStyle === 'pill'
      ? '9999px'
      : buttonStyle === 'square'
      ? '8px'
      : buttonStyle === 'soft'
      ? '16px'
      : '20px';

  let animClass = '';
  if (animation === 'pulse') animClass = 'animate-pulse';
  if (animation === 'bounce') animClass = 'animate-bounce';
  if (animation === 'glow') animClass = 'ring-2 ring-sky-400/80 shadow-lg shadow-sky-500/30';

  const primaryColor = color || theme?.colors?.primary || '#4D6234';

  const customStyle: React.CSSProperties = {
    borderRadius: buttonRadius,
  };

  let variantClass = '';

  if (variant === 'card' || !variant) {
    customStyle.backgroundColor = '#ffffff';
    customStyle.color = '#0f172a';
    variantClass = 'bg-white text-slate-900 shadow-xs border border-slate-100 hover:scale-[1.01] active:scale-[0.99] transition-all';
  } else if (variant === 'solid') {
    customStyle.backgroundColor = primaryColor;
    customStyle.color = textColor || '#ffffff';
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
    customStyle.backgroundColor = 'rgba(255, 255, 255, 0.12)';
    customStyle.borderColor = 'rgba(255, 255, 255, 0.25)';
    customStyle.borderWidth = '1px';
    customStyle.color = '#ffffff';
    variantClass = 'backdrop-blur-md hover:bg-white/20 active:scale-[0.98] transition-all shadow-lg';
  }

  const normalizedIconKey = icon ? icon.toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
  const IconComponent = icon && (ICON_MAP[icon] || ICON_MAP[normalizedIconKey]) ? (ICON_MAP[icon] || ICON_MAP[normalizedIconKey]) : null;

  // Icon badge background
  const isInstagram = normalizedIconKey === 'instagram';
  const isWhatsApp = normalizedIconKey === 'messagecircle' || normalizedIconKey === 'message-circle' || normalizedIconKey === 'whatsapp';
  const isGitHub = normalizedIconKey === 'github';

  const iconBgClass = isInstagram
    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white'
    : isWhatsApp
    ? 'bg-emerald-500 text-white'
    : isGitHub
    ? 'bg-slate-900 text-white'
    : 'bg-[#4D6234] text-white';

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
      className={`group relative w-full px-4 py-3.5 flex items-center justify-between gap-3.5 cursor-pointer no-underline ${variantClass} ${animClass} my-2`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={text}
            className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs"
          />
        ) : IconComponent ? (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBgClass}`}>
            <IconComponent className="w-5 h-5" />
          </div>
        ) : null}

        <div className="flex flex-col min-w-0 text-left">
          <p className="text-sm font-bold text-slate-900 tracking-tight truncate leading-snug">
            {text || (config as any).title || 'Untitled Link'}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate leading-snug font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
};

export default LinkButtonBlock;
