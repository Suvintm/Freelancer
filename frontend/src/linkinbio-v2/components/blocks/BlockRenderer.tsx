import React from 'react';
import type { Block } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';
import { ProfileHeaderBlock } from './ProfileHeaderBlock';
import { LinkButtonBlock } from './LinkButtonBlock';
import { SocialBarBlock } from './SocialBarBlock';
import { ProductGridBlock } from './ProductGridBlock';
import { VideoEmbedBlock } from './VideoEmbedBlock';
import { TextBlock } from './TextBlock';
import { ImageGalleryBlock } from './ImageGalleryBlock';

interface BlockRendererProps {
  block: Block;
  theme?: Theme;
  onLinkClick?: (blockId: string, url: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme, onLinkClick }) => {
  if (!block || !block.isVisible) {
    return null;
  }

  switch (block.type) {
    case 'profile-header':
      return <ProfileHeaderBlock config={block.config as any} theme={theme} />;

    case 'link-button':
      return (
        <LinkButtonBlock
          config={block.config as any}
          theme={theme}
          onClick={() => onLinkClick?.(block.id, (block.config as any).url)}
        />
      );

    case 'social-bar':
      return <SocialBarBlock config={block.config as any} theme={theme} />;

    case 'product-grid':
      return <ProductGridBlock config={block.config as any} theme={theme} />;

    case 'video-embed':
      return <VideoEmbedBlock config={block.config as any} theme={theme} />;

    case 'text-block':
      return <TextBlock config={block.config as any} theme={theme} />;

    case 'image-gallery':
      return <ImageGalleryBlock config={block.config as any} theme={theme} />;

    default:
      return (
        <div className="p-3 my-2 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-white/50">
          Block renderer for {block.type}
        </div>
      );
  }
};

export {
  ProfileHeaderBlock,
  LinkButtonBlock,
  SocialBarBlock,
  ProductGridBlock,
  VideoEmbedBlock,
  TextBlock,
  ImageGalleryBlock,
};
