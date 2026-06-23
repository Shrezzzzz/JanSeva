import { clsx } from 'clsx';
import type { Category, IssueStatus, Severity } from '../../types/issue.types';
import { CATEGORY_COLORS, CATEGORY_ICONS, STATUS_COLORS } from '../../types/issue.types';
import { CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '../../utils/constants';

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  return (
    <span
      className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color, backgroundColor: `${color}18` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const color = CATEGORY_COLORS[category];
  const icon  = CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];
  return (
    <span
      className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color, backgroundColor: `${color}18` }}
    >
      {icon} {label}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const map: Record<Severity, string> = {
    Low:      '#16A34A',
    Medium:   '#D97706',
    High:     '#EA580C',
    Critical: '#DC2626',
  };
  const color = map[severity];
  return (
    <span
      className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ color, backgroundColor: `${color}18` }}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export default function Badge({ className, children }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F7F5] text-[#6F6F6F]', className)}>
      {children}
    </span>
  );
}
