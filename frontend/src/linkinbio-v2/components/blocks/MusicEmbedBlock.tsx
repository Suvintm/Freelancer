import React from 'react';
import type { MusicEmbedConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { Music, ExternalLink } from 'lucide-react';
import { FaSpotify, FaApple, FaSoundcloud } from 'react-icons/fa';

interface MusicEmbedBlockProps {
  config: MusicEmbedConfig;
  theme?: Theme;
}

export const MusicEmbedBlock: React.FC<MusicEmbedBlockProps> = ({ config, theme: _theme }) => {
  const {
    platform = 'spotify',
    embedUrl = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
    title = 'Featured Track',
  } = config;

  // Convert regular Spotify/Apple Music URLs to embed format if needed
  const getEmbedUrl = (rawUrl: string, plat: string) => {
    if (!rawUrl) return '';
    if (plat === 'spotify') {
      if (rawUrl.includes('/embed/')) return rawUrl;
      return rawUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    if (plat === 'apple-music') {
      if (rawUrl.includes('embed.music.apple.com')) return rawUrl;
      return rawUrl.replace('music.apple.com', 'embed.music.apple.com');
    }
    return rawUrl;
  };

  const finalEmbedUrl = getEmbedUrl(embedUrl, platform);

  const PlatformIcon =
    platform === 'spotify'
      ? FaSpotify
      : platform === 'apple-music'
      ? FaApple
      : FaSoundcloud;

  const platformColor =
    platform === 'spotify'
      ? '#1DB954'
      : platform === 'apple-music'
      ? '#FA243C'
      : '#FF5500';

  return (
    <div className="w-full my-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/10 shadow-md overflow-hidden select-none font-sans">
      
      {/* Header Tag */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PlatformIcon style={{ color: platformColor }} className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">
            {title}
          </span>
        </div>

        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5"
        >
          <span>Listen</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Embed Frame */}
      <div className="w-full bg-black/5 dark:bg-black/20 flex items-center justify-center min-h-[80px]">
        {finalEmbedUrl ? (
          <iframe
            src={finalEmbedUrl}
            title={title}
            className="w-full h-[80px] sm:h-[152px] border-0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className="py-4 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
            <Music className="w-5 h-5 opacity-40" />
            <span>Enter a valid music URL in block settings</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default MusicEmbedBlock;
