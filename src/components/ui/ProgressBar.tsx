import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;    // 0–100
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  color = '#1A6B3C',
  height = 8,
  label,
  showPercent,
  className,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={clsx('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-[#6F6F6F]">{label}</span>}
          {showPercent && <span className="text-xs font-medium text-[#0D0D0B]">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-[#E5E5E0]"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={clsx('h-full rounded-full', animated && 'transition-all duration-700 ease-out')}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
