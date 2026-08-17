import React from 'react';
import type { ProfileHeaderConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { CheckCircle2 } from 'lucide-react';

interface ProfileHeaderBlockProps {
  config: ProfileHeaderConfig;
  theme?: Theme;
}

export const ProfileHeaderBlock: React.FC<ProfileHeaderBlockProps> = ({ config, theme }) => {
  const { imageUrl, bannerUrl, title, subtitle, variant, alignment, showVerifiedBadge } = config;

  const alignClass =
    alignment === 'left' ? 'text-left items-start' : alignment === 'right' ? 'text-right items-end' : 'text-center items-center';

  const textColor = theme?.colors?.text || '#ffffff';
  const textMutedColor = theme?.colors?.textMuted || '#94a3b8';

  if (variant === 'banner' && bannerUrl) {
    return (
      <div className="w-full overflow-hidden rounded-2xl mb-4 bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="h-32 w-full overflow-hidden relative">
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className={`p-4 -mt-12 flex flex-col ${alignClass}`}>
          <div className="relative mb-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-900 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-900 shadow-xl flex items-center justify-center text-white font-bold text-2xl">
                {title.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h1 style={{ color: textColor }} className="text-xl font-bold tracking-tight">
              {title}
            </h1>
            {showVerifiedBadge && <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />}
          </div>
          {subtitle && (
            <p style={{ color: textMutedColor }} className="text-xs max-w-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'split') {
    return (
      <div className="w-full p-4 mb-4 flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <div className="shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {title.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 style={{ color: textColor }} className="text-lg font-bold truncate">
              {title}
            </h1>
            {showVerifiedBadge && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
          </div>
          {subtitle && (
            <p style={{ color: textMutedColor }} className="text-xs line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Centered Default Variant
  return (
    <div className={`w-full py-4 flex flex-col ${alignClass} mb-2`}>
      <div className="relative mb-3.5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white/15 shadow-2xl shadow-black/40"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 ring-4 ring-white/15 shadow-2xl flex items-center justify-center text-white font-bold text-3xl">
            {title.charAt(0) || 'U'}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <h1 style={{ color: textColor }} className="text-xl font-bold tracking-tight">
          {title}
        </h1>
        {showVerifiedBadge && <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />}
      </div>

      {subtitle && (
        <p style={{ color: textMutedColor }} className="text-xs text-center max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
