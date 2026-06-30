/**
 * One-off backfill: fixes existing Resolved/Closed issues whose updatedAt
 * equals createdAt (a side-effect of the old seed script), so that
 * Avg Resolution / Zone Performance stop showing 0.0 days.
 *
 * Run with:  npx tsx src/utils/fixResolutionTimes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stale = await prisma.issue.findMany({
    where: {
      status: { in: ['Resolved', 'Closed'] },
    },
    select: { id: true, createdAt: true, updatedAt: true },
  });

  const toFix = stale.filter(
    (i) => i.updatedAt.getTime() === i.createdAt.getTime(),
  );

  console.log(`Found ${toFix.length} resolved/closed issues with zero resolution time.`);

  for (const issue of toFix) {
    const delayDays = Math.floor(Math.random() * 7) + 1; // 1-7 days
    const newUpdatedAt = new Date(
      Math.min(issue.createdAt.getTime() + delayDays * 86400000, Date.now()),
    );
    await prisma.issue.update({
      where: { id: issue.id },
      data: { updatedAt: newUpdatedAt },
    });
  }

  console.log('✅ Backfill complete.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});