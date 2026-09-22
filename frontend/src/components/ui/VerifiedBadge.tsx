import { VscVerifiedFilled } from 'react-icons/vsc';

export interface VerifiedBadgeProps {
  isVerified?: boolean;
  role?: string;
  className?: string;
  /**
   * Explicit color override for the verified badge:
   * - 'black': Black rosette with white checkmark (ideal for light backgrounds)
   * - 'white': White rosette with black checkmark (ideal for dark backgrounds / overlays)
   * - 'auto': Dynamically adapts to light/dark mode (black in light mode, white in dark mode)
   */
  color?: 'black' | 'white' | 'auto';
  /**
   * Background theme context:
   * - 'light': Forces a black badge with white checkmark
   * - 'dark': Forces a white badge with black checkmark
   * - 'auto': Dynamically adapts based on dark mode class
   */
  theme?: 'light' | 'dark' | 'auto';
  bg?: 'light' | 'dark' | 'auto';
  title?: string;
  size?: number | string;
}

export function VerifiedBadge({
  isVerified = true,
  role,
  className = 'w-[16px] h-[16px]',
  color,
  theme,
  bg,
  title,
  size,
}: VerifiedBadgeProps) {
  if (!isVerified) return null;

  // Determine color resolution: explicit color > bg/theme prop > className hint > auto
  let resolvedColor: 'black' | 'white' | 'auto' = color || 'auto';
  if (!color) {
    const context = bg || theme;
    if (context === 'dark') {
      resolvedColor = 'white';
    } else if (context === 'light') {
      resolvedColor = 'black';
    } else if (className?.includes('text-white')) {
      resolvedColor = 'white';
    } else if (className?.includes('text-black')) {
      resolvedColor = 'black';
    }
  }

  // Smart tooltip
  const tooltip = title || (role ? `Verified ${role}` : 'Verified Account');

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 align-middle select-none ${className}`}
      title={tooltip}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* 
        High-precision inner backing disc (56% diameter):
        Mathematically tuned to cover 100% of the checkmark cutout while staying 
        100% hidden within the rosette body without protruding beyond any scallop edges.
        This guarantees the checkmark is always solid contrasting white (on black badge) 
        or solid black (on white badge) regardless of what image/color is behind the badge.
      */}
      <span
        aria-hidden="true"
        className={`absolute rounded-full pointer-events-none transition-colors duration-200 ${
          resolvedColor === 'white'
            ? 'bg-black'
            : resolvedColor === 'black'
            ? 'bg-white'
            : 'bg-white dark:bg-black'
        }`}
        style={{ width: '56%', height: '56%' }}
      />

      {/* Official VscVerifiedFilled Rosette SVG */}
      <VscVerifiedFilled
        className={`relative z-10 w-full h-full transition-colors duration-200 ${
          resolvedColor === 'white'
            ? 'text-white'
            : resolvedColor === 'black'
            ? 'text-black'
            : 'text-black dark:text-white'
        }`}
      />
    </span>
  );
}

export default VerifiedBadge;
