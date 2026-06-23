import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = ['Pothole','Streetlight','WaterLeak','WasteDump','Sewage','RoadDamage','ParkIssue','Other'] as const;
const SEVERITIES = ['Low','Medium','High','Critical'] as const;
const STATUSES   = ['Reported','Verified','Assigned','InProgress','Resolved','Closed'] as const;

const TITLES = [
  'Large pothole causing accidents on MG Road',
  'Broken streetlight near Rabindra Sarani',
  'Water pipe leakage flooding the footpath',
  'Illegal garbage dumping near school',
  'Sewage overflow blocking drain',
  'Road surface badly damaged after monsoon',
  'Park bench broken and dangerous',
  'Stray cattle blocking traffic',
  'Waterlogging at major intersection',
  'Fallen electricity pole on footpath',
];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

export async function seed() {
  console.log('🌱 Seeding database…');

  // Create demo users
  const hash = await bcrypt.hash('Demo@1234', 10);

  // Authority user
  const authorityCount = await prisma.user.count();
  const authority = await prisma.user.upsert({
    where: { email: 'authority@janseva.in' },
    update: {},
    create: {
      citizenId: `JAN-${new Date().getFullYear()}-${String(authorityCount + 1).padStart(5, '0')}`,
      name: 'Kolkata Municipal Authority',
      email: 'authority@janseva.in',
      password: hash,
      role: 'Authority',
      ward: 'City-Wide',
      xp: 0,
    },
  });

  const citizens = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const countBefore = await prisma.user.count();
      return prisma.user.upsert({
        where: { email: `citizen${i + 1}@janseva.in` },
        update: {},
        create: {
          citizenId: `JAN-${new Date().getFullYear()}-${String(countBefore + 1).padStart(5, '0')}`,
          name: `Citizen ${i + 1}`,
          email: `citizen${i + 1}@janseva.in`,
          password: hash,
          role: 'Citizen',
          ward: `Ward ${(i % 8) + 1}`,
          xp: (10 - i) * 40 + Math.floor(Math.random() * 20),
          reportStreak: Math.floor(Math.random() * 7),
        },
      });
    }),
  );

  // Create 50 demo issues
  for (let i = 0; i < 50; i++) {
    const reporter  = rand(citizens);
    const category  = rand(CATEGORIES);
    const severity  = rand(SEVERITIES);
    const status    = rand(STATUSES);
    const title     = TITLES[i % TITLES.length];
    const daysBack  = Math.floor(Math.random() * 60);
    const createdAt = daysAgo(daysBack);

    const issue = await prisma.issue.create({
      data: {
        title: `${title} (${i + 1})`,
        description: 'This issue requires urgent municipal attention. Residents have been affected.',
        category,
        severity,
        status,
        latitude:  22.5726 + (Math.random() - 0.5) * 0.12,
        longitude: 88.3639 + (Math.random() - 0.5) * 0.12,
        address:   `${Math.floor(Math.random() * 200) + 1}, Ward ${(i % 8) + 1}, Kolkata`,
        zone:      `Ward ${(i % 8) + 1}`,
        mediaUrls: [],
        isAnonymous: i % 6 === 0,
        reporterId: reporter.id,
        upvotes: Math.floor(Math.random() * 15),
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Add timeline event
    await prisma.timeline.create({
      data: {
        issueId:   issue.id,
        event:     'Issue Reported',
        actor:     reporter.name,
        actorRole: 'Citizen',
        note:      'Submitted via JanSeva app',
        createdAt,
      },
    });

    // If resolved, add resolution event
    if (status === 'Resolved' || status === 'Closed') {
      await prisma.timeline.create({
        data: {
          issueId:   issue.id,
          event:     'Issue Resolved',
          actor:     'Kolkata Municipal Authority',
          actorRole: 'Authority',
          note:      'Work completed and verified. Issue closed.',
          createdAt: daysAgo(daysBack - Math.floor(Math.random() * 5)),
        },
      });
    }
  }

  console.log('✅ Seed complete — 50 issues, 10 citizens, 1 authority');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
