import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const SIZES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

// Five distinct brand-consistent colors — one assigned per name deterministically
const AVATAR_COLORS = [
  { bg: '#1A6B3C', text: '#ffffff' }, // green
  { bg: '#0284C7', text: '#ffffff' }, // blue
  { bg: '#7C3AED', text: '#ffffff' }, // violet
  { bg: '#D97706', text: '#ffffff' }, // amber
  { bg: '#DC2626', text: '#ffffff' }, // red
];

export function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function avatarInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, name, size = 'md', className, ring }: AvatarProps) {
  const color = avatarColor(name);

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden flex items-center justify-center font-semibold flex-shrink-0',
        SIZES[size],
        ring && 'ring-2 ring-offset-2',
        className,
      )}
      style={
        !src
          ? { backgroundColor: color.bg, color: color.text }
          : undefined
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
  users: { name?: string; avatarUrl?: string }[];
  max?: number;
}) {
  const visible = users.slice(0, max);
  const extra   = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} src={u.avatarUrl} name={u.name} size="sm" className="ring-2 ring-white" />
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-[#F7F7F5] ring-2 ring-white flex items-center justify-center text-xs text-[#6F6F6F] font-medium flex-shrink-0">
          +{extra}
        </div>
      )}
    </div>
  );
}
