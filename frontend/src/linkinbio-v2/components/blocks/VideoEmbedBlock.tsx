import React from 'react';
import type { VideoEmbedConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { PlayCircle } from 'lucide-react';

interface VideoEmbedBlockProps {
  config: VideoEmbedConfig;
  theme?: Theme;
}

function getEmbedUrl(url: string, autoplay: boolean): string | null {
  if (!url) return null;

  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const autoParam = autoplay ? '&autoplay=1&mute=1' : '';
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0${autoParam}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const autoParam = autoplay ? '&autoplay=1&muted=1' : '';
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0${autoParam}`;
  }

  return url;
}

export const VideoEmbedBlock: React.FC<VideoEmbedBlockProps> = ({ config }) => {
  const { videoUrl, aspectRatio = '16:9', autoplay = false, title } = config;

  const embedUrl = getEmbedUrl(videoUrl, autoplay);

  const aspectClass =
    aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[280px] mx-auto' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="w-full my-2.5 flex flex-col">
      {title && (
        <h4 className="text-xs font-semibold text-white/90 mb-1.5 px-0.5 flex items-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-rose-500" />
          {title}
        </h4>
      )}

      <div className={`w-full ${aspectClass} rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg relative`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || 'Embedded Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 p-4 text-center">
            <PlayCircle className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-xs">Enter a valid YouTube or Vimeo URL in block settings</p>
          </div>
        )}
      </div>
    </div>
  );
};
