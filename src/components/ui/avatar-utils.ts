const AVATAR_COLORS = [
  { bg: '#1A6B3C', text: '#ffffff' },
  { bg: '#0284C7', text: '#ffffff' },
  { bg: '#7C3AED', text: '#ffffff' },
  { bg: '#D97706', text: '#ffffff' },
  { bg: '#DC2626', text: '#ffffff' },
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
