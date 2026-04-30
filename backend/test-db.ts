import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Supabase Database Connection...');
  
  try {
    // Attempt to query the database
    const groups = await prisma.economicGroup.findMany();
    console.log(`Successfully connected! Found ${groups.length} Economic Groups.`);

    // If no groups exist, we could create one to test write access
    if (groups.length === 0) {
      console.log('Creating a test Economic Group...');
      const newGroup = await prisma.economicGroup.create({
        data: {
          name: 'Grupo Teste Supabase',
          description: 'Teste de conexão com o banco de dados',
        },
      });
      console.log('Successfully created test group:', newGroup);
    } else {
      console.log('First group found:', groups[0]);
    }
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
