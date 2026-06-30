import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const issues = await prisma.issue.findMany({ select: { id: true, title: true, status: true, assignedTo: true, department: true, zone: true } });
  console.log('Total issues:', issues.length);
  console.log('Issues with assignedTo:', issues.filter(i => i.assignedTo).length);
  console.log('Issues with department:', issues.filter(i => i.department).length);
  const users = await prisma.user.findMany({ where: { role: { in: ['Authority', 'Admin'] } }, select: { id: true, name: true, email: true, role: true, ward: true } });
  console.log('Authority Users:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
