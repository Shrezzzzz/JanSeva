import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const duplicate = await prisma.user.findFirst({
    where: {
      role: 'Authority',
      ward: 'City-Wide',
      name: 'Kolkata Municipal Authority',
    },
  });
  
  if (duplicate) {
    console.log(`Found duplicate user: ${duplicate.id} - ${duplicate.name}`);
    await prisma.user.delete({ where: { id: duplicate.id } });
    console.log('Successfully deleted duplicate Municipal Corporation account.');
  } else {
    console.log('No duplicate Municipal Corporation account found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
