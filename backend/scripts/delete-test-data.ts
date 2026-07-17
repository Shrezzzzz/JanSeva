/**
 * delete-test-data.ts
 * Deletes 4 confirmed test issues and all their child records in a single
 * Prisma transaction. Prints a before/after issue count.
 *
 * Run with:
 *   DATABASE_URL="postgresql://..." npx tsx backend/scripts/delete-test-data.ts
 *
 * ── Exact operations (in this order, inside one transaction) ──────────────
 *   1. DELETE FROM "Timeline"     WHERE "issueId" IN (<4 IDs>)
 *   2. DELETE FROM "Comment"      WHERE "issueId" IN (<4 IDs>)
 *   3. DELETE FROM "InternalNote" WHERE "issueId" IN (<4 IDs>)
 *   4. DELETE FROM "Issue"        WHERE "id"      IN (<4 IDs>)
 *
 * upvotes / verifiedBy / followedBy are scalar arrays on the Issue row —
 * deleted with the row, no separate table needed.
 * Notification.issueId is a non-FK string field — orphaned notifications
 * are left in place (harmless).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const TARGET_IDS = [
  'cmrp9o13j000hqmf2in9nfi3v',
  'cmrp9p4ss000mqmf2uyjtq7ie',
  'cmrpaf5g3000rqmf2qwwvf4fz',
  'cmrparpl2000wqmf25en0ug7i',
];

async function main() {
  console.log('\n──────────────────────────────────────────────────────────');
  console.log('  JanSeva — Test Data Deletion');
  console.log('──────────────────────────────────────────────────────────');
  console.log(`\nTarget IDs (${TARGET_IDS.length}):`);
  TARGET_IDS.forEach((id) => console.log(`  ${id}`));

  // ── Pre-flight: confirm all 4 IDs actually exist ──────────────────────
  const found = await prisma.issue.findMany({
    where: { id: { in: TARGET_IDS } },
    select: { id: true, title: true, category: true, createdAt: true },
  });

  if (found.length !== TARGET_IDS.length) {
    const foundIds = new Set(found.map((i) => i.id));
    const missing  = TARGET_IDS.filter((id) => !foundIds.has(id));
    console.error(`\n⚠️  ${missing.length} ID(s) not found in DB — aborting to be safe:`);
    missing.forEach((id) => console.error(`  ${id}`));
    process.exit(1);
  }

  console.log('\nConfirmed all 4 issues exist:');
  found.forEach((i) =>
    console.log(`  ${i.id}  [${i.category}]  "${i.title}"  ${i.createdAt.toISOString()}`),
  );

  const countBefore = await prisma.issue.count();
  console.log(`\nIssue count BEFORE: ${countBefore}`);

  // ── Transaction ───────────────────────────────────────────────────────
  console.log('\nRunning transaction…');

  const [timelines, comments, notes, issues] = await prisma.$transaction([
    prisma.timeline.deleteMany({
      where: { issueId: { in: TARGET_IDS } },
    }),
    prisma.comment.deleteMany({
      where: { issueId: { in: TARGET_IDS } },
    }),
    prisma.internalNote.deleteMany({
      where: { issueId: { in: TARGET_IDS } },
    }),
    prisma.issue.deleteMany({
      where: { id: { in: TARGET_IDS } },
    }),
  ]);

  console.log(`  Timeline entries deleted:    ${timelines.count}`);
  console.log(`  Comments deleted:            ${comments.count}`);
  console.log(`  Internal notes deleted:      ${notes.count}`);
  console.log(`  Issues deleted:              ${issues.count}`);

  const countAfter = await prisma.issue.count();
  console.log(`\nIssue count AFTER:  ${countAfter}`);
  console.log(`Δ  dropped by ${countBefore - countAfter} (expected 4)\n`);

  if (issues.count !== 4) {
    console.warn('⚠️  Unexpected delete count — verify manually.');
  } else {
    console.log('✓  Cleanup complete.\n');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
