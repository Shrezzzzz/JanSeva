import { clsx } from 'clsx';

type BrandLogoProps = {
  className?: string;
  colorClassName?: string;
  size?: 'inherit' | 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClasses = {
  inherit: 'text-[inherit]',
  sm: 'text-[1.45rem]',
  md: 'text-[1.8rem]',
  lg: 'text-[2.45rem]',
  xl: 'text-[3rem]',
};

export default function BrandLogo({
  className,
  colorClassName = 'text-[#0D0D0B]',
  size = 'inherit',
}: BrandLogoProps) {
  return (
    <span className={clsx('brand-logo', sizeClasses[size], colorClassName, className)} aria-label="JanSeva">
      <span className="brand-logo__word">JanSeva</span>
      <sup className="brand-logo__mark" aria-hidden="true">®</sup>
    </span>
  );
}
