import React, { useRef, useState, useEffect } from 'react';

interface ScaledBlockPreviewProps {
  children: React.ReactNode;
  /** The native pixel width the block was designed at (default: 380px) */
  designWidth?: number;
  /** Optional custom container class */
  className?: string;
  /** Aspect ratio of the thumbnail frame (e.g. '16/9', '16/7') */
  aspectRatio?: string;
}

/**
 * 🎨 ScaledBlockPreview (The Figma / Canva Thumbnail Engine)
 * Renders the actual live React block component at its native design width,
 * then mathematically scales it down to fit any thumbnail container perfectly.
 * Guarantees 100% zero visual drift between preview cards and the live studio canvas.
 */
export const ScaledBlockPreview: React.FC<ScaledBlockPreviewProps> = ({
  children,
  designWidth = 380,
  className = '',
  aspectRatio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const measuredWidth = containerRef.current.offsetWidth;
        if (measuredWidth > 0) {
          const computedScale = measuredWidth / designWidth;
          setScale(computedScale);

          // If child height is measurable, compute proportional container height
          const childEl = containerRef.current.firstElementChild?.firstElementChild as HTMLElement;
          if (childEl) {
            setContainerHeight(childEl.offsetHeight * computedScale);
          }
        }
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [designWidth, children]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        height: typeof containerHeight === 'number' && containerHeight > 0 ? containerHeight : undefined,
        ...(aspectRatio ? { aspectRatio } : {}),
      }}
    >
      <div
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaledBlockPreview;
