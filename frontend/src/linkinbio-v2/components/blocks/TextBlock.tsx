import React from 'react';
import type { TextBlockConfig } from '../../types/block.types';
import type { Theme } from '../../types/theme.types';

interface TextBlockProps {
  config: TextBlockConfig;
  theme?: Theme;
}

export const TextBlock: React.FC<TextBlockProps> = ({ config, theme }) => {
  const { content, fontSize = 'medium', alignment = 'center', color } = config;

  if (!content) return null;

  const alignClass =
    alignment === 'left' ? 'text-left' : alignment === 'right' ? 'text-right' : 'text-center';

  const sizeClass =
    fontSize === 'small'
      ? 'text-xs'
      : fontSize === 'large'
      ? 'text-base font-semibold'
      : fontSize === 'xlarge'
      ? 'text-lg font-bold'
      : 'text-sm';

  const textColor = color || theme?.colors?.text || '#f8fafc';

  return (
    <div className={`w-full py-2 px-1 ${alignClass} my-1`}>
      <p style={{ color: textColor }} className={`${sizeClass} leading-relaxed whitespace-pre-wrap`}>
        {content}
      </p>
    </div>
  );
};
