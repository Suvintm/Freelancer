import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?:    'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {

    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40';

    const variants: Record<string, string> = {
      primary:   'bg-text-main text-container hover:opacity-90 shadow-sm',
      secondary: 'bg-border-secondary text-text-main hover:bg-border-main border border-border-main',
      outline:   'border border-border-main bg-transparent text-text-main hover:bg-border-secondary',
      ghost:     'bg-transparent text-text-main hover:bg-border-secondary',
      danger:    'bg-rose-500 text-white hover:bg-rose-600 shadow-sm',
    };

    const sizes: Record<string, string> = {
      xs: 'h-7  px-3   text-[11px]',
      sm: 'h-8  px-3.5 text-[12px]',
      md: 'h-9  px-4   text-[13px]',
      lg: 'h-10 px-5   text-[14px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';