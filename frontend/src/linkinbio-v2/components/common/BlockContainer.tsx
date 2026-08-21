import React from 'react';

export type BlockTaxonomy = 'fixed-ratio' | 'content-flow' | 'hybrid';

interface BlockContainerProps {
  /** The taxonomy type of the block */
  taxonomy?: BlockTaxonomy;
  /** Scoped container name (e.g. 'header', 'link', 'product', 'block') */
  containerName?: string;
  /** Aspect ratio string for fixed-ratio blocks (e.g. '16/7', '16/9', '3/1') */
  aspectRatio?: string;
  /** Minimum height for hybrid / content-flow blocks */
  minHeight?: string | number;
  /** Custom CSS classes */
  className?: string;
  /** Children block content */
  children: React.ReactNode;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * 🏛️ Universal Block Container
 * Implements the Figma/Canva ViewBox standard:
 * - Scoped Container Queries (`@container/[name]`)
 * - Universal Design Unit (`--du: 1cqw` / `min(1cqw, 0.5625cqh)`)
 * - Mathematical Aspect-Ratio Locks for Fixed Blocks
 * - Fluid Growth for Content-Flow & Hybrid Blocks
 */
export const BlockContainer: React.FC<BlockContainerProps> = ({
  taxonomy = 'content-flow',
  containerName = 'block',
  aspectRatio,
  minHeight,
  className = '',
  children,
  style,
}) => {
  // Compute container class based on taxonomy
  const isFixed = taxonomy === 'fixed-ratio';
  const isHybrid = taxonomy === 'hybrid';

  const containerQueryClass = `@container/${containerName}`;

  const computedStyle: React.CSSProperties = {
    // Universal Design Unit: 1 unit = 1% of container width (or proportional height for fixed aspect ratio blocks)
    // @ts-ignore
    '--du': isFixed ? 'min(1cqw, 0.5625cqh)' : '1cqw',
    ...(isFixed && aspectRatio ? { aspectRatio } : {}),
    ...(minHeight ? { minHeight } : {}),
    ...style,
  };

  return (
    <div
      className={`${containerQueryClass} relative w-full ${
        isFixed ? 'overflow-hidden' : ''
      } ${isHybrid ? 'overflow-hidden' : ''} ${className}`}
      style={computedStyle}
    >
      {children}
    </div>
  );
};

export default BlockContainer;
