import { Category, PrismaClient } from '@prisma/client';
import { awardXP } from './xpService';

const prisma = new PrismaClient();

const CATEGORY_LIST = [
  Category.Pothole, Category.Streetlight, Category.WaterLeak, Category.WasteDump,
  Category.Sewage, Category.RoadDamage, Category.ParkIssue, Category.Other,
] as const;

type Cat = (typeof CATEGORY_LIST)[number];

const MISSION_TEMPLATES: Record<Cat, { title: string; description: string }> = {
  Pothole:     { title: 'Pothole Patrol',    description: 'Report a pothole in your area' },
  Streetlight: { title: 'Light it Up',       description: 'Find a broken streetlight' },
  WaterLeak:   { title: 'Water Watch',       description: 'Spot a water leak or pipe issue' },
  WasteDump:   { title: 'Clean Sweep',       description: 'Report illegal waste dumping' },
  Sewage:      { title: 'Drain Detective',   description: 'Find a sewage or drain problem' },
  RoadDamage:  { title: 'Road Ranger',       description: 'Report a damaged road surface' },
  ParkIssue:   { title: 'Park Guardian',     description: 'Report a problem in a park' },
  Other:       { title: 'Civic Scout',       description: 'Report any civic issue you spot' },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Pick 3 random categories that aren't the same */
function pickCategories(): [Cat, Cat, Cat] {
  const shuffled = [...CATEGORY_LIST].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
}

export async function getTodayMissions(userId: string) {
  const date = todayStr();

  // Return existing missions for today
  const existing = await prisma.mission.findMany({
    where: { userId, date },
    orderBy: { createdAt: 'asc' },
  });
  if (existing.length >= 3) return existing;

  // Generate fresh ones for this user
  const cats = pickCategories();
  const created = await Promise.all(
    cats.map((cat) => {
      const tpl = MISSION_TEMPLATES[cat];
      return prisma.mission.upsert({
        where: { userId_date_category: { userId, date, category: cat } },
        update: {},
        create: {
          id:          `m_${userId}_${date}_${cat}`,
          userId,
          date,
          category:   cat,
          title:      tpl.title,
          description: tpl.description,
          xpReward:   30,
        },
      });
    }),
  );

  return created;
}

export async function completeMission(userId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.userId !== userId)
    throw new Error('Mission not found');
  if (mission.completed)
    throw new Error('Already completed');

  const updated = await prisma.mission.update({
    where: { id: missionId },
    data:  { completed: true, completedAt: new Date() },
  });

  await awardXP(userId, mission.xpReward);
  return updated;
}

/** Called after issue creation — auto-complete matching missions */
export async function checkMissionCompletion(userId: string, category: Category) {
  const date = todayStr();
  const mission = await prisma.mission.findFirst({
    where: { userId, date, category, completed: false },
  });
  if (!mission) return;

  await prisma.mission.update({
    where: { id: mission.id },
    data:  { completed: true, completedAt: new Date() },
  });
  await awardXP(userId, mission.xpReward);
}

/** Cron: generate missions for all citizens who have none today */
export async function generateDailyMissionsForAllUsers() {
  const date = todayStr();
  const users = await prisma.user.findMany({
    where: { role: 'Citizen' },
    select: { id: true },
  });
  for (const u of users) {
    const count = await prisma.mission.count({ where: { userId: u.id, date } });
    if (count < 3) await getTodayMissions(u.id);
  }
}
