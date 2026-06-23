import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  accentLeft?: string; // hex color
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ glass, hover, accentLeft, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-2xl border border-[#E5E5E0] bg-white',
        glass && 'glass',
        hover && 'transition-shadow duration-200 hover:shadow-md cursor-pointer',
        className,
      )}
      style={accentLeft ? { borderLeft: `3px solid ${accentLeft}` } : undefined}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';
export default Card;
