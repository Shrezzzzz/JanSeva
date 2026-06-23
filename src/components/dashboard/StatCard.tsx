import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percent, positive = up
  icon?: LucideIcon;
  accentColor?: string;
  className?: string;
}

export default function StatCard({ title, value, subtitle, trend, icon: Icon, accentColor = '#1A6B3C', className }: StatCardProps) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div
      className={clsx('bg-white rounded-2xl border border-[#E5E5E0] p-5 flex flex-col gap-3', className)}
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#6F6F6F] uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
            <Icon size={16} style={{ color: accentColor }} />
          </div>
        )}
      </div>
      <div>
        <p className="font-display text-3xl text-[#0D0D0B]">{value}</p>
        {subtitle && <p className="text-xs text-[#6F6F6F] mt-0.5">{subtitle}</p>}
      </div>
      {trend != null && (
        <div className={clsx('flex items-center gap-1 text-xs font-medium', trendUp ? 'text-green-600' : 'text-red-600')}>
          {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}
