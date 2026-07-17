/**
 * find-test-data.ts
 * READ-ONLY script — queries Neon production DB for likely test/debug records.
 * Run with:
 *   DATABASE_URL="postgresql://..." npx tsx backend/scripts/find-test-data.ts
 *
 * Does NOT delete anything. Output is a table of candidates for your review.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ── Filters ────────────────────────────────────────────────────────────────

// Tonight's testing window (UTC)
const WINDOW_START = new Date('2026-07-17T18:00:00Z');
const WINDOW_END   = new Date('2026-07-18T00:30:00Z');

// Title patterns that look like auto-generated test submissions
const TEST_TITLE_PATTERNS = [
  'Streetlight at Ward',
  'WaterLeak at Ward',
  'ParkIssue at Ward',
  'Sewage at Ward',
  'RoadDamage at',
  'WasteDump at',
  'Pothole at Ward',
  'Other at Ward',
];

// Literal test address
const TEST_ADDRESS = 'Test Address';

async function main() {
  console.log('\n──────────────────────────────────────────────────────────');
  console.log('  JanSeva — Test Data Finder (READ-ONLY)');
  console.log(`  Window: ${WINDOW_START.toISOString()} → ${WINDOW_END.toISOString()}`);
  console.log('──────────────────────────────────────────────────────────\n');

  // 1. Issues in tonight's window matching title patterns or test address
  const patternMatches = await prisma.issue.findMany({
    where: {
      createdAt: { gte: WINDOW_START, lte: WINDOW_END },
      OR: [
        ...TEST_TITLE_PATTERNS.map((p) => ({ title: { contains: p, mode: 'insensitive' as const } })),
        { address: { contains: TEST_ADDRESS, mode: 'insensitive' as const } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, title: true, category: true,
      address: true, latitude: true, longitude: true,
      createdAt: true, reporterId: true,
    },
  });

  // 2. ALL issues created in tonight's window (to catch near-duplicate clusters
  //    even if they have slightly different titles)
  const allTonight = await prisma.issue.findMany({
    where: { createdAt: { gte: WINDOW_START, lte: WINDOW_END } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, title: true, category: true,
      address: true, latitude: true, longitude: true,
      createdAt: true, reporterId: true,
    },
  });

  // 3. Detect near-duplicate clusters: same category, coordinates within 0.001°
  //    (~100m), created within 5 minutes of each other
  const clusters: typeof allTonight[] = [];
  const clustered = new Set<string>();

  for (let i = 0; i < allTonight.length; i++) {
    const a = allTonight[i];
    if (clustered.has(a.id)) continue;
    const group = [a];
    for (let j = i + 1; j < allTonight.length; j++) {
      const b = allTonight[j];
      if (clustered.has(b.id)) continue;
      const sameCategory   = a.category === b.category;
      const nearbyLat      = Math.abs(a.latitude - b.latitude) < 0.001;
      const nearbyLng      = Math.abs(a.longitude - b.longitude) < 0.001;
      const withinFiveMin  = Math.abs(a.createdAt.getTime() - b.createdAt.getTime()) < 5 * 60 * 1000;
      if (sameCategory && nearbyLat && nearbyLng && withinFiveMin) {
        group.push(b);
        clustered.add(b.id);
      }
    }
    if (group.length > 1) {
      clusters.push(group);
      group.forEach((item) => clustered.add(item.id));
    }
  }

  // ── Output ──────────────────────────────────────────────────────────────

  const patternIds = new Set(patternMatches.map((i) => i.id));
  const clusterIds = new Set(clusters.flat().map((i) => i.id));

  // Combine: anything matching a pattern OR in a cluster
  const candidates = allTonight.filter(
    (i) => patternIds.has(i.id) || clusterIds.has(i.id),
  );

  // Ambiguous: in tonight's window, NOT matching a pattern, NOT in a cluster
  const ambiguous = allTonight.filter(
    (i) => !patternIds.has(i.id) && !clusterIds.has(i.id),
  );

  console.log(`Total issues created in window: ${allTonight.length}`);
  console.log(`Confident test candidates:      ${candidates.length}`);
  console.log(`Ambiguous (review manually):    ${ambiguous.length}\n`);

  if (candidates.length > 0) {
    console.log('── CONFIDENT TEST CANDIDATES (safe to delete after your review) ──\n');
    console.log(
      ['ID', 'Title', 'Category', 'Address', 'CreatedAt (UTC)']
        .map((h) => h.padEnd(30)).join(' | '),
    );
    console.log('─'.repeat(140));
    for (const row of candidates) {
      console.log([
        row.id.padEnd(30),
        row.title.slice(0, 28).padEnd(30),
        row.category.padEnd(30),
        (row.address ?? '').slice(0, 28).padEnd(30),
        row.createdAt.toISOString(),
      ].join(' | '));
    }

    console.log('\nIDs to pass to delete script:');
    console.log(candidates.map((i) => `"${i.id}"`).join(',\n'));
  } else {
    console.log('No confident test candidates found in window.');
  }

  if (ambiguous.length > 0) {
    console.log('\n── AMBIGUOUS — review before deciding ──\n');
    console.log(
      ['ID', 'Title', 'Category', 'Address', 'CreatedAt (UTC)']
        .map((h) => h.padEnd(30)).join(' | '),
    );
    console.log('─'.repeat(140));
    for (const row of ambiguous) {
      console.log([
        row.id.padEnd(30),
        row.title.slice(0, 28).padEnd(30),
        row.category.padEnd(30),
        (row.address ?? '').slice(0, 28).padEnd(30),
        row.createdAt.toISOString(),
      ].join(' | '));
    }
  }

  if (clusters.length > 0) {
    console.log('\n── NEAR-DUPLICATE CLUSTERS DETECTED ──\n');
    clusters.forEach((group, idx) => {
      console.log(`Cluster ${idx + 1} — ${group[0].category}, ${group.length} issues within ~100m and 5 min:`);
      group.forEach((i) => console.log(`  ${i.id}  ${i.createdAt.toISOString()}  ${i.title.slice(0, 50)}`));
    });
  }

  const total = await prisma.issue.count();
  console.log(`\nTotal issues in production DB right now: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
