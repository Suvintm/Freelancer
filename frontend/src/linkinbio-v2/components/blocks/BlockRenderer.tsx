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
import { TipJarBlock } from './TipJarBlock';
import { MusicEmbedBlock } from './MusicEmbedBlock';
import { EmailCaptureBlock } from './EmailCaptureBlock';
import { FaqAccordionBlock } from './FaqAccordionBlock';
import { CountdownBlock } from './CountdownBlock';
import { ProductCardBlock } from './ProductCardBlock';

interface BlockRendererProps {
  block: Block;
  theme?: Theme;
  pageId?: string;
  onLinkClick?: (blockId: string, url: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme, pageId, onLinkClick }) => {
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

    case 'tip-jar':
      return <TipJarBlock config={block.config as any} theme={theme} pageId={pageId} />;

    case 'music-embed':
      return <MusicEmbedBlock config={block.config as any} theme={theme} />;

    case 'email-capture':
      return <EmailCaptureBlock config={block.config as any} theme={theme} />;

    case 'faq-accordion':
      return <FaqAccordionBlock config={block.config as any} theme={theme} />;

    case 'countdown':
      return <CountdownBlock config={block.config as any} theme={theme} />;

    case 'product-card':
      return <ProductCardBlock config={block.config as any} theme={theme} />;

    case 'product-grid':
      return <ProductGridBlock config={block.config as any} theme={theme} />;

    case 'video-embed':
      return <VideoEmbedBlock config={block.config as any} theme={theme} />;

    case 'text-block':
      return <TextBlock config={block.config as any} theme={theme} />;

    case 'image-gallery':
      return <ImageGalleryBlock config={block.config as any} theme={theme} />;

    case 'divider':
      return <div className="w-full my-3 border-t border-white/20" />;

    default:
      return (
        <div className="p-3 my-2 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-white/50">
          Block renderer for {(block as any).type}
        </div>
      );
  }
};

export {
  ProfileHeaderBlock,
  LinkButtonBlock,
  SocialBarBlock,
  ProductGridBlock,
  ProductCardBlock,
  VideoEmbedBlock,
  MusicEmbedBlock,
  TextBlock,
  ImageGalleryBlock,
  TipJarBlock,
  EmailCaptureBlock,
  FaqAccordionBlock,
  CountdownBlock,
};
