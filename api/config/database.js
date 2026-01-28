const { PrismaClient } = require('@prisma/client');

// Singleton pattern para compartilhar instância Prisma
let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['info', 'warn', 'error']
    });
  }
  return prisma;
}

async function connectDatabase() {
  const client = getPrismaClient();
  try {
    await client.$connect();
    console.log('✅ Banco de dados conectado');
    return client;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

module.exports = {
  prisma: getPrismaClient(),
  connectDatabase,
  disconnectDatabase,
  getPrismaClient
};
