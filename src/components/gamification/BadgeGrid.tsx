import { Lock } from 'lucide-react';
import type { Badge } from '../../types/user.types';
import { formatDate } from '../../utils/formatters';
import { clsx } from 'clsx';

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {badges.map((b) => (
        <div
          key={b.id}
          className={clsx(
            'relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors',
            b.locked
              ? 'border-[#E5E5E0] bg-[#F7F7F5] grayscale opacity-60'
              : 'border-[#E8F5EE] bg-white hover:shadow-sm',
          )}
        >
          {b.locked && (
            <div className="absolute top-2 right-2">
              <Lock size={12} className="text-[#9CA3AF]" />
            </div>
          )}
          <span className="text-3xl">{b.icon}</span>
          <span className="text-xs font-semibold text-[#0D0D0B] text-center leading-tight">{b.name}</span>
          <span className="text-xs text-[#6F6F6F] text-center leading-tight">{b.description}</span>
          {!b.locked && b.earnedAt && (
            <span className="text-xs text-[#1A6B3C]">Earned {formatDate(b.earnedAt, 'dd MMM yyyy')}</span>
          )}
        </div>
      ))}
    </div>
  );
}
