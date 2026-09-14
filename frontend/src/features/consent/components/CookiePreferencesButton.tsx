import React from 'react';
import { Cookie } from 'lucide-react';

interface CookiePreferencesButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'footer-link' | 'button';
}

export const CookiePreferencesButton: React.FC<CookiePreferencesButtonProps> = ({
  onClick,
  className = '',
  variant = 'footer-link',
}) => {
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${className}`}
      >
        <Cookie size={14} />
        Manage Cookie Preferences
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 hover:underline transition-opacity cursor-pointer ${className}`}
    >
      <Cookie size={12} className="opacity-70" />
      <span>Cookie Preferences</span>
    </button>
  );
};
