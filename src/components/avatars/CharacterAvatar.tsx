import { clsx } from 'clsx';
import {
  AVATAR_TIERS,
  getAvatarById,
  getAvatarImage,
  getTierIndexForXp,
  normalizeAvatarId,
  type AvatarId,
  type Gender,
} from './avatar-data';

type Size = 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_PX: Record<Size, number> = { sm: 56, md: 96, lg: 160, xl: 256 };

interface CharacterAvatarProps {
  avatarId?: string | null;
  gender?: Gender;
  xp?: number;
  size?: Size;
  showRing?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function CharacterAvatar({
  avatarId,
  gender = 'male',
  xp = 0,
  size = 'md',
  showRing = true,
  showBadge = false,
  className,
}: CharacterAvatarProps) {
  const selected = avatarId
    ? getAvatarById(normalizeAvatarId(avatarId))
    : getAvatarById(`${gender}-${AVATAR_TIERS[getTierIndexForXp(xp)].xp}-${AVATAR_TIERS[getTierIndexForXp(xp)].slug}` as AvatarId);
  const px = typeof size === 'number' ? size : SIZE_PX[size];

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: px, height: px }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle at 50% 40%, ${selected.accent}33 0%, transparent 70%)` }}
        aria-hidden
      />
      <div
        className={clsx(
          'relative overflow-hidden rounded-full bg-white',
          showRing && px >= 56 && 'ring-4 ring-offset-2 ring-offset-white',
        )}
        style={{ width: px, height: px, boxShadow: showRing ? `0 0 0 ${px < 56 ? 2 : 1}px ${selected.accent}` : undefined }}
      >
        <img
          src={avatarId ? selected.src : getAvatarImage(gender, selected.tierIndex)}
          alt={`${selected.title} avatar`}
          loading="lazy"
          width={1024}
          height={1536}
          className="h-full w-full object-cover object-top"
          style={{ transform: 'scale(1.55) translateY(12%)' }}
        />
      </div>
      {showBadge && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-md"
          style={{ backgroundColor: selected.accent }}
        >
          {selected.title}
        </span>
      )}
    </div>
  );
}
