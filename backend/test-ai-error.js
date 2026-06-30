const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const issues = await prisma.issue.findMany({
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
      take: 80,
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        zone: true,
        address: true,
        duplicateOf: true,
        department: true,
        priorityScore: true,
        workflowRecommendation: true,
        createdAt: true,
      },
    });

    const workOrder = issues
      .slice(0, 6)
      .map((issue) => `${issue.priorityScore ?? 0}: ${issue.workflowRecommendation && typeof issue.workflowRecommendation === 'object' && 'nextBestAction' in issue.workflowRecommendation ? String(issue.workflowRecommendation.nextBestAction) : issue.title}`);
    
    console.log("No throw in DB map");
  } catch (e) {
    console.error("Throw in DB map:", e);
  }
}
test().then(() => process.exit(0));
