import { PrismaClient, type Category, type Severity, type Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIZENS = [
  { name: 'Aarav Sharma', ward: 'Ward 1', xp: 2180, avatar: 'male-2000-hero', badges: ['first_step', 'problem_solver', 'civic_star'], reports: 12 },
  { name: 'Priya Banerjee', ward: 'Ward 4', xp: 1740, avatar: 'female-1000-detective', badges: ['first_step', 'community_eye', 'civic_star'], reports: 10 },
  { name: 'Rohan Mehta', ward: 'Ward 7', xp: 1420, avatar: 'male-1000-detective', badges: ['first_step', 'problem_solver'], reports: 9 },
  { name: 'Ananya Iyer', ward: 'Ward 2', xp: 1180, avatar: 'female-1000-detective', badges: ['first_step', 'community_eye'], reports: 8 },
  { name: 'Vikram Singh', ward: 'Ward 6', xp: 940, avatar: 'male-600-guardian', badges: ['first_step', 'civic_star'], reports: 7 },
  { name: 'Kavya Nair', ward: 'Ward 3', xp: 810, avatar: 'female-600-guardian', badges: ['first_step', 'on_fire'], reports: 7 },
  { name: 'Arjun Das', ward: 'Ward 8', xp: 690, avatar: 'male-600-guardian', badges: ['first_step', 'community_eye'], reports: 6 },
  { name: 'Meera Joshi', ward: 'Ward 5', xp: 610, avatar: 'female-600-guardian', badges: ['first_step', 'civic_star'], reports: 6 },
  { name: 'Aditya Rao', ward: 'Ward 1', xp: 540, avatar: 'male-300-reporter', badges: ['first_step'], reports: 5 },
  { name: 'Sneha Kapoor', ward: 'Ward 4', xp: 470, avatar: 'female-300-reporter', badges: ['first_step', 'quick_spotter'], reports: 5 },
  { name: 'Rahul Mukherjee', ward: 'Ward 7', xp: 390, avatar: 'male-300-reporter', badges: ['first_step'], reports: 4 },
  { name: 'Ishita Verma', ward: 'Ward 2', xp: 330, avatar: 'female-300-reporter', badges: ['first_step'], reports: 4 },
  { name: 'Kunal Patel', ward: 'Ward 6', xp: 270, avatar: 'male-100-observer', badges: ['first_step'], reports: 3 },
  { name: 'Nandini Ghosh', ward: 'Ward 3', xp: 220, avatar: 'female-100-observer', badges: ['first_step'], reports: 3 },
  { name: 'Siddharth Jain', ward: 'Ward 8', xp: 160, avatar: 'male-100-observer', badges: ['first_step'], reports: 2 },
  { name: 'Pooja Reddy', ward: 'Ward 5', xp: 120, avatar: 'female-100-observer', badges: ['first_step'], reports: 2 },
  { name: 'Dev Malhotra', ward: 'Ward 1', xp: 80, avatar: 'male-0-explorer', badges: [], reports: 1 },
  { name: 'Aisha Khan', ward: 'Ward 4', xp: 40, avatar: 'female-0-explorer', badges: [], reports: 1 },
] as const;

const CATEGORIES: Category[] = ['Pothole', 'Streetlight', 'WaterLeak', 'WasteDump', 'Sewage', 'RoadDamage', 'ParkIssue', 'Other'];
const SEVERITIES: Severity[] = ['Low', 'Medium', 'High'];
const STATUSES: Status[] = ['Reported', 'Verified', 'Assigned', 'InProgress', 'Resolved', 'Closed'];

async function seedLeaderboard() {
  const password = await bcrypt.hash('Demo@1234', 10);

  for (const [index, citizen] of CITIZENS.entries()) {
    const email = `citizen${index + 1}@janseva.in`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: citizen.name,
        role: 'Citizen',
        ward: citizen.ward,
        xp: citizen.xp,
        level: Math.max(1, Math.floor(citizen.xp / 250) + 1),
        badges: [...citizen.badges],
        activeCharacter: citizen.avatar,
      },
      create: {
        citizenId: `JAN-DEMO-${String(index + 1).padStart(5, '0')}`,
        name: citizen.name,
        email,
        password,
        role: 'Citizen',
        ward: citizen.ward,
        xp: citizen.xp,
        level: Math.max(1, Math.floor(citizen.xp / 250) + 1),
        badges: [...citizen.badges],
        activeCharacter: citizen.avatar,
      },
    });

    const seededReports = await prisma.issue.count({
      where: { reporterId: user.id, title: { startsWith: '[Leaderboard Demo]' } },
    });

    for (let reportIndex = seededReports; reportIndex < citizen.reports; reportIndex += 1) {
      const status = STATUSES[(index + reportIndex) % STATUSES.length];
      await prisma.issue.create({
        data: {
          title: `[Leaderboard Demo] Civic report ${reportIndex + 1} by ${citizen.name}`,
          description: 'Demo civic report used to populate database-backed leaderboard statistics.',
          category: CATEGORIES[(index + reportIndex) % CATEGORIES.length],
          severity: SEVERITIES[(index + reportIndex) % SEVERITIES.length],
          status,
          latitude: 22.5726 + index * 0.001,
          longitude: 88.3639 + reportIndex * 0.001,
          address: `${citizen.ward}, Kolkata`,
          zone: citizen.ward,
          mediaUrls: [],
          reporterId: user.id,
          upvotes: (index + reportIndex) % 12,
        },
      });
    }
  }

  console.log(`Seeded ${CITIZENS.length} realistic leaderboard citizens.`);
  const topCitizens = await prisma.user.findMany({
    where: { role: 'Citizen' },
    orderBy: { xp: 'desc' },
    take: 10,
    select: {
      name: true,
      ward: true,
      xp: true,
      activeCharacter: true,
      _count: { select: { issues: true } },
    },
  });
  console.table(topCitizens.map(({ _count, ...citizen }) => ({
    ...citizen,
    reports: _count.issues,
  })));
}

seedLeaderboard()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
