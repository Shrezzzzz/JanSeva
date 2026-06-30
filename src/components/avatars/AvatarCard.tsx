import { clsx } from 'clsx';
import type { AvatarOption } from './avatar-data';
import UnlockBadge from './UnlockBadge';

interface AvatarCardProps {
  avatar: AvatarOption;
  unlocked: boolean;
  selected: boolean;
  onSelect: () => void;
}

export default function AvatarCard({ avatar, unlocked, selected, onSelect }: AvatarCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!unlocked}
      className={clsx(
        'group relative min-w-[9rem] overflow-hidden rounded-lg border p-3 text-left transition-all',
        selected ? 'border-[#1A6B3C] bg-[#E8F5EE]' : 'border-[#E5E5E0] bg-white hover:border-[#1A6B3C]',
        !unlocked && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="mx-auto aspect-[2/3] h-28 overflow-hidden">
        <img
          src={avatar.src}
          alt={avatar.title}
          className={clsx('h-full w-full object-contain transition-all', !unlocked && 'grayscale')}
          loading="lazy"
        />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#0D0D0B]">{avatar.title}</p>
      <p className="text-[11px] capitalize text-[#6F6F6F]">{avatar.gender}</p>
      {!unlocked && (
        <div className="absolute right-2 top-2">
          <UnlockBadge unlocked={false} xp={avatar.xp} />
        </div>
      )}
    </button>
  );
}
