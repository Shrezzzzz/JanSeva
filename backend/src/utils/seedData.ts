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

const AUTHORITY_ACCOUNTS = [
  { name: 'JanSeva City Admin', email: 'admin@janseva.gov', password: 'Admin@123', role: 'Admin' as const, ward: 'All' },
  { name: 'Road Maintenance Officer', email: 'roads@janseva.gov', password: 'Roads@123', role: 'Authority' as const, ward: 'All' },
  { name: 'Water Department Officer', email: 'water@janseva.gov', password: 'Water@123', role: 'Authority' as const, ward: 'All' },
  { name: 'Waste Management Officer', email: 'waste@janseva.gov', password: 'Waste@123', role: 'Authority' as const, ward: 'All' },
  { name: 'Electricity Department Officer', email: 'electricity@janseva.gov', password: 'Electricity@123', role: 'Authority' as const, ward: 'All' },
  // ward: null is intentional — officer@janseva.gov is the SHARED Ward Officer account.
  // The officer selects their ward each session via the WardSelector modal (stored in
  // authStore.activeWard, never persisted to DB). Do NOT change this back to a specific
  // ward — doing so would break the shared-officer pattern and re-lock the account to
  // one ward permanently. See: src/components/authority/WardSelector.tsx
  { name: 'Ward Officer', email: 'officer@janseva.gov', password: 'Officer@123', role: 'Authority' as const, ward: null },
];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

async function nextCitizenId() {
  const count = await prisma.user.count();
  return `JAN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
}

export async function seed() {
  console.log('🌱 Seeding database…');

  // Create demo users
  const hash = await bcrypt.hash('Demo@1234', 10);

  for (const account of AUTHORITY_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: hashedPassword,
        role: account.role,
        ward: account.ward,
        xp: 0,
      },
      create: {
        citizenId: await nextCitizenId(),
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        ward: account.ward,
        xp: 0,
      },
    });
  }

  const citizens = [];
  for (let i = 0; i < 10; i += 1) {
    citizens.push(await prisma.user.upsert({
      where: { email: `citizen${i + 1}@janseva.in` },
      update: {},
      create: {
        citizenId: await nextCitizenId(),
        name: `Citizen ${i + 1}`,
        email: `citizen${i + 1}@janseva.in`,
        password: hash,
        role: 'Citizen',
        ward: `Ward ${(i % 8) + 1}`,
        xp: (10 - i) * 40 + Math.floor(Math.random() * 20),
        reportStreak: Math.floor(Math.random() * 7),
      },
    }));
  }

  // Create 50 demo issues
  for (let i = 0; i < 50; i++) {
    const reporter  = rand(citizens);
    const category  = rand(CATEGORIES);
    const severity  = rand(SEVERITIES);
    const status    = rand(STATUSES);
    const title     = TITLES[i % TITLES.length];
    const daysBack  = Math.floor(Math.random() * 60);
    const createdAt = daysAgo(daysBack);

    // Resolved/Closed issues should show a realistic resolution time —
    // pick an updatedAt that's 1-7 days after createdAt (but not later than now).
    const isDone = status === 'Resolved' || status === 'Closed';
    const resolutionDelayDays = isDone ? Math.floor(Math.random() * 7) + 1 : 0;
    const updatedAt = isDone
      ? new Date(Math.min(createdAt.getTime() + resolutionDelayDays * 86400000, Date.now()))
      : createdAt;

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
        updatedAt,
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

  console.log('✅ Seed complete — 50 issues, 10 citizens, authority/admin accounts refreshed');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });