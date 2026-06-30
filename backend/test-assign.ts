import { PrismaClient } from '@prisma/client';
import { resolveAuthorityAssignment } from './src/services/authorityAssignmentService';
const prisma = new PrismaClient();
async function main() {
  const authorityUsers = await prisma.user.findMany({ where: { role: { in: ['Authority', 'Admin'] } }, select: { id: true, name: true, email: true, role: true, ward: true } });
  const issue = { category: 'Pothole' as any, department: null, zone: 'Ward 7' };
  const assignment = resolveAuthorityAssignment(issue, authorityUsers);
  console.log('Assignment for Pothole in Ward 7:', assignment);
}
main().catch(console.error).finally(() => prisma.$disconnect());
