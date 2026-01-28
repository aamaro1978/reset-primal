const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // ========================================
    // 1. Criar Produto E-book
    // ========================================
    console.log('📖 Criando produto E-book...');
    const ebook = await prisma.product.create({
      data: {
        name: 'Reset Primal - E-book Completo',
        slug: 'reset-primal-ebook',
        description: 'E-book completo com protocolo de 21 dias de transformação + bônus exclusivos',
        price: 147.00,
        type: 'EBOOK',
        isActive: true
      }
    });
    console.log(`✅ E-book criado: ${ebook.name} (R$ ${ebook.price})\n`);

    // ========================================
    // 2. Criar Usuário Admin
    // ========================================
    console.log('👤 Criando usuário admin...');
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@resetprimal.com.br',
        name: 'Administrador Reset Primal',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        consentMarketing: true,
        consentDataSharing: true,
        consentDate: new Date()
      }
    });
    console.log(`✅ Admin criado: ${admin.email}\n`);

    // ========================================
    // 3. Criar 5 Clientes com Compras
    // ========================================
    console.log('👥 Criando clientes de teste com compras...');
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      const hashedPwd = await bcrypt.hash('senha123', 10);
      const user = await prisma.user.create({
        data: {
          email: `cliente${i}@example.com`,
          name: `Cliente Teste ${i}`,
          passwordHash: hashedPwd,
          role: 'CUSTOMER',
          consentMarketing: true,
          consentDate: new Date(),

          // Criar compra automática
          purchases: {
            create: {
              productId: ebook.id,
              price: 147.00,
              currency: 'BRL',
              status: 'APPROVED',
              hotmartTransactionId: `TEST_${Date.now()}_${i}`,
              purchasedAt: new Date(Date.now() - i * 86400000) // Cada um dias atrás
            }
          }
        },
        include: {
          purchases: true
        }
      });

      customers.push(user);
      console.log(`  ✅ ${user.email} - Compra: ${ebook.name}`);
    }
    console.log();

    // ========================================
    // 4. Criar alguns Logs de Auditoria
    // ========================================
    console.log('📋 Criando logs de auditoria...');
    for (const customer of customers) {
      await prisma.auditLog.create({
        data: {
          userId: customer.id,
          action: 'purchase_completed',
          entity: 'purchase',
          metadata: JSON.stringify({
            productName: ebook.name,
            amount: 147.00,
            transactionId: `TEST_${customer.id}`
          }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Seed)'
        }
      });
    }
    console.log(`✅ ${customers.length} logs de auditoria criados\n`);

    // ========================================
    // 5. Summary
    // ========================================
    console.log('════════════════════════════════════════════════════════════');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('📊 Dados Criados:');
    console.log(`  • 1 Produto: ${ebook.name}`);
    console.log(`  • 1 Admin: admin@resetprimal.com.br (senha: admin@123)`);
    console.log(`  • 5 Clientes com compras:`);
    customers.forEach((c, i) => {
      console.log(`    ${i + 1}. ${c.email} (senha: senha123)`);
    });
    console.log();

    console.log('🔐 Credenciais de Teste:');
    console.log('  Admin:');
    console.log('    Email: admin@resetprimal.com.br');
    console.log('    Senha: admin@123');
    console.log();
    console.log('  Cliente (qualquer):');
    console.log('    Email: cliente1@example.com - cliente5@example.com');
    console.log('    Senha: senha123');
    console.log();

    console.log('📁 Arquivo do Banco:');
    console.log('  prisma/dev.db');
    console.log();

    console.log('🚀 Próximos Passos:');
    console.log('  1. Abrir Prisma Studio: npx prisma studio');
    console.log('  2. Criar api/server.js (novo entry point)');
    console.log('  3. Implementar autenticação (auth.service, auth.controller)');
    console.log();

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
