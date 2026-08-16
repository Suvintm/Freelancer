import React, { useMemo } from 'react';
import type { ResolvedTheme } from '../../types/template.types';

interface TemplateRootProps {
  theme: ResolvedTheme;
  children: React.ReactNode;
}

/**
 * TemplateRoot — the outermost wrapper for every template.
 *
 * Responsibilities:
 *  1. Converts the resolved theme object into CSS custom properties (--pp-*)
 *  2. Applies background: solid color, gradient, or image
 *  3. Provides a full-height flex container for the template content
 *
 * Every template's index.tsx wraps its content in this component.
 */
export const TemplateRoot: React.FC<TemplateRootProps> = ({ theme, children }) => {
  const cssVars = useMemo(() => {
    const fontMap: Record<string, string> = {
      'Inter': '"Inter", sans-serif',
      'Poppins': '"Poppins", sans-serif',
      'Playfair Display': '"Playfair Display", serif',
      'JetBrains Mono': '"JetBrains Mono", monospace',
      'Orbitron': '"Orbitron", sans-serif',
      'Raleway': '"Raleway", sans-serif',
    };

    return {
      '--pp-primary':    String(theme.primaryColor   ?? '#000000'),
      '--pp-secondary':  String(theme.secondaryColor ?? '#6366f1'),
      '--pp-text':       String(theme.textColor      ?? '#ffffff'),
      '--pp-font':       fontMap[String(theme.fontFamily ?? 'Inter')] ?? '"Inter", sans-serif',
      '--pp-radius':     `${theme.borderRadius ?? 8}px`,
      '--pp-spacing':    `${theme.spacing      ?? 12}px`,
      '--pp-shadow':     `${theme.shadowIntensity ?? 1}`,
    } as React.CSSProperties;
  }, [theme]);

  const backgroundStyle = useMemo((): React.CSSProperties => {
    const bgType = String(theme.backgroundType ?? 'solid');

    if (bgType === 'gradient') {
      return { background: String(theme.backgroundValue ?? '#ffffff') };
    }

    if (bgType === 'image') {
      return {
        backgroundImage:    `url(${String(theme.backgroundValue ?? '')})`,
        backgroundSize:     'cover',
        backgroundPosition: 'center',
        backgroundRepeat:   'no-repeat',
      };
    }

    // solid (default)
    return { backgroundColor: String(theme.backgroundColor ?? '#ffffff') };
  }, [theme]);

  return (
    <div
      style={{ ...cssVars, ...backgroundStyle }}
      className="w-full min-h-full flex flex-col"
    >
      {children}
    </div>
  );
};

export default TemplateRoot;
