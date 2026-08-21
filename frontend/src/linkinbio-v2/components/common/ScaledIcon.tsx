import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ScaledIconProps {
  icon: LucideIcon;
  /** Size in Design Units (e.g. 3.5 = 3.5 * var(--du)) */
  du?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}

/**
 * 🎨 ScaledIcon
 * Proportional icon wrapper that scales dynamically with the block's `--du` design unit.
 */
export const ScaledIcon: React.FC<ScaledIconProps> = ({
  icon: Icon,
  du = 3.5,
  className = '',
  strokeWidth = 2,
  color,
  fill = 'none',
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: `calc(${du} * var(--du))`,
        height: `calc(${du} * var(--du))`,
      }}
    >
      <Icon
        className="w-full h-full"
        strokeWidth={strokeWidth}
        color={color}
        fill={fill}
      />
    </span>
  );
};

export default ScaledIcon;
