require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    console.log('Tentando conectar ao banco...');
    
    const result = await prisma.$executeRaw`SELECT 1 as test`;
    console.log('✅ Conexão Prisma bem-sucedida!', result);
    
    const clients = await prisma.client.findMany();
    console.log('✅ Clientes encontrados:', clients.length);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

main();
