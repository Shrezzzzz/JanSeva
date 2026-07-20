import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

function levelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

const BADGE_CHECKS: Record<string, (stats: { issuesReported: number; issuesVerified: number; commentsPosted: number; reportStreak: number; xp: number; resolvedIssues: number }) => boolean> = {
  first_step:     (s) => s.issuesReported >= 1,
  community_eye:  (s) => s.issuesVerified >= 10,
  problem_solver: (s) => s.resolvedIssues >= 5,
  on_fire:        (s) => s.reportStreak >= 7,
  civic_star:     (s) => s.xp >= 100,
  team_player:    (s) => s.commentsPosted >= 50,
};

export async function awardXP(userId: string, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { xp: { increment: amount } },
  });

  const newLevel = levelFromXP(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data:  { level: newLevel },
    });
  }

  // Check badge eligibility
  await checkAndAwardBadges(userId, user.xp);
  return user;
}

async function checkAndAwardBadges(userId: string, xp: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { issues: true } },
    },
  });
  if (!user) return;

  const stats = {
    issuesReported: user._count.issues,
    issuesVerified: 0, // would need separate query
    commentsPosted: 0,
    reportStreak:   user.reportStreak,
    xp,
    resolvedIssues: 0,
  };

  const earned = user.badges;
  const toAdd: string[] = [];

  for (const [badgeId, check] of Object.entries(BADGE_CHECKS)) {
    if (!earned.includes(badgeId) && check(stats)) {
      toAdd.push(badgeId);
    }
  }

  if (toAdd.length) {
    await prisma.user.update({
      where: { id: userId },
      data:  { badges: { push: toAdd } },
    });
  }
}

export async function deductXP(userId: string, amount: number) {
  // Fetch current XP first so we can apply the floor-at-zero correctly.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  if (!current) return;

  const newXP = Math.max(0, current.xp - amount);
  const user  = await prisma.user.update({
    where: { id: userId },
    data:  { xp: newXP },
  });

  const newLevel = levelFromXP(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data:  { level: newLevel },
    });
  }
  return user;
}
