import React from 'react';
import { clsx } from 'clsx';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, icon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6B3C] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#1A6B3C] text-white hover:bg-[#155930] active:scale-95 hover:scale-103',
      ghost:   'bg-transparent text-[#0D0D0B] hover:bg-[#F7F7F5] active:scale-95',
      outline: 'bg-transparent border border-[#0D0D0B] text-[#0D0D0B] hover:bg-[#F7F7F5] active:scale-95',
      danger:  'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-95',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2',
      md: 'text-sm px-6 py-2.5',
      lg: 'text-base px-14 py-5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? <Spinner size={size === 'sm' ? 14 : 18} className="text-current" /> : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
