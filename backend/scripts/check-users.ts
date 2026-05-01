import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Public Users:', users);
  const groups = await prisma.economicGroup.findMany();
  console.log('Economic Groups:', groups);
}

main().finally(() => prisma.$disconnect());
