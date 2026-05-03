const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE auth.users SET encrypted_password = crypt('admin123', gen_salt('bf')) WHERE email = 'ismael.souza@grambal.com'`;
  console.log("Password reset to admin123");
}

main().finally(() => prisma.$disconnect());
