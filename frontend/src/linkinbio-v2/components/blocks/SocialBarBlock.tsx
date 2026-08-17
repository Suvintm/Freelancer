import React from 'react';
import type { SocialBarConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { FaInstagram, FaYoutube, FaTwitter, FaTiktok, FaSpotify, FaLinkedin, FaGithub, FaDiscord, FaGlobe, FaEnvelope } from 'react-icons/fa6';

interface SocialBarBlockProps {
  config: SocialBarConfig;
  theme?: Theme;
}

const PLATFORM_ICONS: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  instagram: { icon: FaInstagram, label: 'Instagram', color: '#E4405F' },
  youtube: { icon: FaYoutube, label: 'YouTube', color: '#FF0000' },
  twitter: { icon: FaTwitter, label: 'X (Twitter)', color: '#1DA1F2' },
  tiktok: { icon: FaTiktok, label: 'TikTok', color: '#00F2FE' },
  spotify: { icon: FaSpotify, label: 'Spotify', color: '#1DB954' },
  linkedin: { icon: FaLinkedin, label: 'LinkedIn', color: '#0A66C2' },
  github: { icon: FaGithub, label: 'GitHub', color: '#ffffff' },
  discord: { icon: FaDiscord, label: 'Discord', color: '#5865F2' },
  website: { icon: FaGlobe, label: 'Website', color: '#38BDF8' },
  email: { icon: FaEnvelope, label: 'Email', color: '#F59E0B' },
};

export const SocialBarBlock: React.FC<SocialBarBlockProps> = ({ config }) => {
  const { links, style, size } = config;

  if (!links || links.length === 0) {
    return null;
  }

  const iconSizeClass =
    size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5';

  const containerPadding =
    size === 'small' ? 'p-2' : size === 'large' ? 'p-3.5' : 'p-2.5';

  if (style === 'pills') {
    return (
      <div className="w-full flex flex-wrap items-center justify-center gap-2 my-2.5">
        {links.map((item) => {
          const info = PLATFORM_ICONS[item.platform] || { icon: FaGlobe, label: item.platform, color: '#ffffff' };
          const Icon = info.icon;
          return (
            <a
              key={item.id || item.platform}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-xs font-medium text-white no-underline shadow-sm hover:scale-105"
            >
              <Icon className={iconSizeClass} style={{ color: info.color }} />
              <span>{info.label}</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (style === 'icons-with-label') {
    return (
      <div className="w-full grid grid-cols-2 gap-2 my-2.5">
        {links.map((item) => {
          const info = PLATFORM_ICONS[item.platform] || { icon: FaGlobe, label: item.platform, color: '#ffffff' };
          const Icon = info.icon;
          return (
            <a
              key={item.id || item.platform}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all text-xs font-medium text-white no-underline shadow-sm"
            >
              <div className="p-1.5 rounded-lg bg-black/30">
                <Icon className={iconSizeClass} style={{ color: info.color }} />
              </div>
              <span className="truncate">{info.label}</span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center gap-2 flex-wrap my-3">
      {links.map((item) => {
        const info = PLATFORM_ICONS[item.platform] || { icon: FaGlobe, label: item.platform, color: '#ffffff' };
        const Icon = info.icon;
        return (
          <a
            key={item.id || item.platform}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title={info.label}
            className={`${containerPadding} rounded-full bg-white/10 hover:bg-white/25 border border-white/15 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-md flex items-center justify-center`}
          >
            <Icon className={iconSizeClass} />
          </a>
        );
      })}
    </div>
  );
};
