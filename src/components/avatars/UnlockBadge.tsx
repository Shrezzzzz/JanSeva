import { Lock, Check } from 'lucide-react';

interface UnlockBadgeProps {
  unlocked: boolean;
  xp: number;
}

export default function UnlockBadge({ unlocked, xp }: UnlockBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md">
      {unlocked ? <Check size={13} /> : <Lock size={13} />}
      {unlocked ? 'Unlocked' : `${xp} XP`}
    </span>
  );
}
