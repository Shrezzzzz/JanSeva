import male0 from './assets/male/male-0-explorer.png';
import male100 from './assets/male/male-100-observer.png';
import male300 from './assets/male/male-300-reporter.png';
import male600 from './assets/male/male-600-guardian.png';
import male1000 from './assets/male/male-1000-detective.png';
import male2000 from './assets/male/male-2000-hero.png';
import female0 from './assets/female/female-0-explorer.png';
import female100 from './assets/female/female-100-observer.png';
import female300 from './assets/female/female-300-reporter.png';
import female600 from './assets/female/female-600-guardian.png';
import female1000 from './assets/female/female-1000-detective.png';
import female2000 from './assets/female/female-2000-hero.png';

export type Gender = 'male' | 'female';

export type AvatarTier = {
  xp: number;
  slug: 'explorer' | 'observer' | 'reporter' | 'guardian' | 'detective' | 'hero';
  title: string;
  ghostText: string;
  theme: string;
  accent: string;
  background: string;
  panel: string;
  description: string;
};

export type AvatarOption = AvatarTier & {
  id: AvatarId;
  gender: Gender;
  tierIndex: number;
  src: string;
};

export type AvatarId =
  | 'male-0-explorer'
  | 'male-100-observer'
  | 'male-300-reporter'
  | 'male-600-guardian'
  | 'male-1000-detective'
  | 'male-2000-hero'
  | 'female-0-explorer'
  | 'female-100-observer'
  | 'female-300-reporter'
  | 'female-600-guardian'
  | 'female-1000-detective'
  | 'female-2000-hero';

export const DEFAULT_AVATAR_ID: AvatarId = 'male-0-explorer';

export const AVATAR_TIERS: AvatarTier[] = [
  {
    xp: 0,
    slug: 'explorer',
    title: 'Default Explorer',
    ghostText: 'DEFAULT',
    theme: 'Beginner',
    accent: '#64748B',
    background: '#60738A',
    panel: '#8796A8',
    description: 'A friendly newcomer ready to explore the city.',
  },
  {
    xp: 100,
    slug: 'observer',
    title: 'The Observer',
    ghostText: 'OBSERVER',
    theme: 'Nature Ranger',
    accent: '#166534',
    background: '#1A6B3C',
    panel: '#2D8A52',
    description: 'Sharp eyes for spotting what others miss.',
  },
  {
    xp: 300,
    slug: 'reporter',
    title: 'The Reporter',
    ghostText: 'REPORTER',
    theme: 'Citizen Journalist',
    accent: '#1D4ED8',
    background: '#0369A1',
    panel: '#0EA5E9',
    description: 'Capturing evidence and telling the story.',
  },
  {
    xp: 600,
    slug: 'guardian',
    title: 'The Guardian',
    ghostText: 'GUARDIAN',
    theme: 'Community Protector',
    accent: '#7E22CE',
    background: '#6D28D9',
    panel: '#9333EA',
    description: 'Standing firm to defend the community.',
  },
  {
    xp: 1000,
    slug: 'detective',
    title: 'The Detective',
    ghostText: 'DETECTIVE',
    theme: 'Urban Investigator',
    accent: '#B45309',
    background: '#B45309',
    panel: '#F59E0B',
    description: 'Following clues, solving civic mysteries.',
  },
  {
    xp: 2000,
    slug: 'hero',
    title: 'Civic Hero',
    ghostText: 'CIVIC HERO',
    theme: 'City Superhero',
    accent: '#DC2626',
    background: '#B91C1C',
    panel: '#EF4444',
    description: 'An inspiring force for the entire city.',
  },
];

const IMAGES: Record<Gender, string[]> = {
  male: [male0, male100, male300, male600, male1000, male2000],
  female: [female0, female100, female300, female600, female1000, female2000],
};

const LEGACY_CHARACTER_MAP: Record<string, AvatarId> = {
  observer: 'male-0-explorer',
  reporter: 'male-300-reporter',
  guardian: 'male-600-guardian',
  detective: 'male-1000-detective',
  hero: 'male-2000-hero',
  legend: 'male-2000-hero',
};

export function getTierIndexForXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < AVATAR_TIERS.length; i += 1) {
    if (xp >= AVATAR_TIERS[i].xp) idx = i;
  }
  return idx;
}

export function getAvatarId(gender: Gender, tierIndex: number): AvatarId {
  const tier = AVATAR_TIERS[tierIndex] ?? AVATAR_TIERS[0];
  return `${gender}-${tier.xp}-${tier.slug}` as AvatarId;
}

export function getAvatarImage(gender: Gender, tierIndex: number): string {
  return IMAGES[gender][tierIndex] ?? IMAGES[gender][0];
}

export function getAllAvatars(gender?: Gender): AvatarOption[] {
  const genders: Gender[] = gender ? [gender] : ['male', 'female'];
  return genders.flatMap((g) =>
    AVATAR_TIERS.map((tier, tierIndex) => ({
      ...tier,
      id: getAvatarId(g, tierIndex),
      gender: g,
      tierIndex,
      src: getAvatarImage(g, tierIndex),
    })),
  );
}

export function isAvatarId(value?: string | null): value is AvatarId {
  return getAllAvatars().some((avatar) => avatar.id === value);
}

export function normalizeAvatarId(value?: string | null): AvatarId {
  if (isAvatarId(value)) return value;
  if (value && LEGACY_CHARACTER_MAP[value]) return LEGACY_CHARACTER_MAP[value];
  return DEFAULT_AVATAR_ID;
}

export function getAvatarById(value?: string | null): AvatarOption {
  const avatarId = normalizeAvatarId(value);
  return getAllAvatars().find((avatar) => avatar.id === avatarId) ?? getAllAvatars()[0];
}

export function getUnlockedAvatarIds(xp: number): AvatarId[] {
  return getAllAvatars()
    .filter((avatar) => xp >= avatar.xp)
    .map((avatar) => avatar.id);
}

export function getCurrentTierAvatar(gender: Gender, xp: number): AvatarOption {
  return getAllAvatars(gender)[getTierIndexForXp(xp)];
}
