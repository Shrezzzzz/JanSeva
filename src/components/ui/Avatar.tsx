import { clsx } from 'clsx';
import { CharacterAvatar } from '../avatars/CharacterAvatar';
import { avatarColor, avatarInitials } from './avatar-utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  ring?: boolean;
  activeCharacter?: string;
}

const SIZES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

const SIZE_PX: Record<string, number> = { sm: 28, md: 36, lg: 48, xl: 80 };

export default function Avatar({ src, name, size = 'md', className, ring, activeCharacter }: AvatarProps) {
  const color = avatarColor(name);

  // Numeric size support
  const isNumeric = typeof size === 'number';
  const pxSize = isNumeric ? size : SIZE_PX[size] ?? 36;

  // If user has an active character, render the selected JanSeva avatar.
  if (activeCharacter) {
    return (
      <CharacterAvatar
        avatarId={activeCharacter}
        size={pxSize}
        showRing={ring}
        className={className}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden flex items-center justify-center font-semibold flex-shrink-0',
        !isNumeric && SIZES[size as keyof typeof SIZES],
        ring && 'ring-2 ring-offset-2',
        className,
      )}
      style={
        isNumeric
          ? { width: pxSize, height: pxSize, fontSize: pxSize * 0.4, ...(!src ? { backgroundColor: color.bg, color: color.text } : {}) }
          : (!src ? { backgroundColor: color.bg, color: color.text } : undefined)
      }
    >
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden>{avatarInitials(name)}</span>
      )}
    </div>
  );
}

/** Stacked avatars (up to max) */
export function AvatarStack({
  users,
  max = 4,
}: {
  users: { name?: string; avatarUrl?: string; activeCharacter?: string }[];
  max?: number;
}) {
  const visible = users.slice(0, max);
  const extra   = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} src={u.avatarUrl} name={u.name} size="sm" className="ring-2 ring-white" activeCharacter={u.activeCharacter} />
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-[#F7F7F5] ring-2 ring-white flex items-center justify-center text-xs text-[#6F6F6F] font-medium flex-shrink-0">
          +{extra}
        </div>
      )}
    </div>
  );
}
