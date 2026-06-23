export type Role = 'Citizen' | 'Moderator' | 'Authority' | 'Admin';

export interface Pet {
  name:  string;
  stage: number;
  mood:  string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  locked: boolean;
}

export interface User {
  id: string;
  citizenId?: string;
  name: string;
  email: string;
  role: Role;
  ward?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  badges: Badge[];
  reportStreak: number;
  issuesReported: number;
  issuesVerified: number;
  commentsPosted: number;
  createdAt: string;
  pet?: Pet;
}

export interface AuthUser {
  id: string;
  citizenId?: string;
  name: string;
  email: string;
  role: Role;
  ward?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  pet?: Pet;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  citizenId?: string;
  name: string;
  ward?: string;
  avatarUrl?: string;
  xp: number;
  topBadge?: Badge;
  issuesReported: number;
  issuesResolved: number;
}

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  issueId?: string;
  createdAt: string;
}

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export const LEVEL_TITLES = [
  'Newcomer',
  'Observer',
  'Reporter',
  'Civic Volunteer',
  'Civic Guardian',
  'Community Champion',
  'Ward Hero',
  'City Steward',
  'Urban Sentinel',
  'Civic Legend',
];

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'first_step',     name: 'First Step',      description: 'Submitted your first report',               icon: '🌱', locked: true },
  { id: 'community_eye', name: 'Community Eye',    description: '10 verifications completed',                icon: '🔍', locked: true },
  { id: 'problem_solver',name: 'Problem Solver',   description: '5 of your reported issues were resolved',   icon: '🏆', locked: true },
  { id: 'on_fire',       name: 'On Fire',          description: '7-day reporting streak',                    icon: '🔥', locked: true },
  { id: 'ward_guardian', name: 'Ward Guardian',    description: 'Top reporter in your ward',                 icon: '🛡️', locked: true },
  { id: 'quick_spotter', name: 'Quick Spotter',    description: 'Reported within 1hr of issue occurring',   icon: '⚡', locked: true },
  { id: 'civic_star',    name: 'Civic Star',       description: 'Reached 100 XP milestone',                 icon: '🌟', locked: true },
  { id: 'team_player',   name: 'Team Player',      description: '50 comments or interactions',               icon: '🤝', locked: true },
];
