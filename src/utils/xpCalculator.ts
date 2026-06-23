import { LEVEL_THRESHOLDS, LEVEL_TITLES } from '../types/user.types';
import { XP_REWARDS } from './constants';

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];
}

export function getXPProgress(xp: number): { current: number; next: number; percent: number } {
  const level = getLevelFromXP(xp);
  const current = LEVEL_THRESHOLDS[level] ?? 0;
  const next = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const percent = Math.min(((xp - current) / (next - current)) * 100, 100);
  return { current: xp - current, next: next - current, percent };
}

export function xpForAction(action: keyof typeof XP_REWARDS): number {
  return XP_REWARDS[action];
}

export function shouldAwardBadge(badgeId: string, stats: {
  issuesReported: number;
  issuesVerified: number;
  commentsPosted: number;
  reportStreak: number;
  xp: number;
  resolvedIssues: number;
}): boolean {
  switch (badgeId) {
    case 'first_step':     return stats.issuesReported >= 1;
    case 'community_eye':  return stats.issuesVerified >= 10;
    case 'problem_solver': return stats.resolvedIssues >= 5;
    case 'on_fire':        return stats.reportStreak >= 7;
    case 'quick_spotter':  return stats.issuesReported >= 1; // server-side timing check
    case 'civic_star':     return stats.xp >= 100;
    case 'team_player':    return stats.commentsPosted >= 50;
    default: return false;
  }
}
