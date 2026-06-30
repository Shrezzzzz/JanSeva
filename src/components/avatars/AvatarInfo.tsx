import type { AvatarOption } from './avatar-data';
import UnlockBadge from './UnlockBadge';

interface AvatarInfoProps {
  avatar: AvatarOption;
  userXP: number;
  isActive: boolean;
}

export default function AvatarInfo({ avatar, userXP, isActive }: AvatarInfoProps) {
  const unlocked = userXP >= avatar.xp;

  return (
    <div className="space-y-3 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <UnlockBadge unlocked={unlocked} xp={avatar.xp} />
        {isActive && (
          <span className="rounded-full border border-white/25 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: avatar.background }}>
            Active
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{avatar.theme}</p>
        <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.02em] text-white sm:text-3xl">
          {avatar.title}
        </h2>
      </div>
      <p className="hidden max-w-xs text-sm leading-6 text-white/80 sm:block">
        {avatar.description} {avatar.gender === 'male' ? 'Male' : 'Female'} variant.
      </p>
    </div>
  );
}
