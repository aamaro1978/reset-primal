const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { validateEnv, env } = require('./config/env');
const { connectDatabase, disconnectDatabase, prisma } = require('./config/database');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const webhookRoutes = require('./routes/webhook.routes');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');

// ════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE AMBIENTE
// ════════════════════════════════════════════════════════════════

console.log('🚀 Reset Primal - Server Initialization');
console.log('════════════════════════════════════════════════════════════════');

validateEnv();

const app = express();
const PORT = env.PORT;

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE GLOBAL
// ════════════════════════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ════════════════════════════════════════════════════════════════
// ROTAS
// ════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Auth routes
app.use(authRoutes);

// Webhook routes (legado, será refatorado em SPRINT 2)
app.use(webhookRoutes);

// API routes (serão criados em SPRINT 2)
// app.use('/api/customers', customersRoutes);
// app.use('/api/purchases', purchasesRoutes);
// app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// ════════════════════════════════════════════════════════════════
// ERROR HANDLER (DEVE SER O ÚLTIMO MIDDLEWARE)
// ════════════════════════════════════════════════════════════════

app.use(errorHandler);

// ════════════════════════════════════════════════════════════════
// INICIALIZAR SERVIDOR
// ════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    console.log('\n📦 Conectando ao banco de dados...');
    await connectDatabase();

    console.log(`\n🌐 Iniciando servidor na porta ${PORT}...`);
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
      console.log('════════════════════════════════════════════════════════════════\n');

      // Info de debug
      console.log('📍 Endpoints disponíveis:');
      console.log(`  GET    /health                  - Health check`);
      console.log(`  POST   /api/auth/register       - Registrar`);
      console.log(`  POST   /api/auth/login          - Login`);
      console.log(`  POST   /api/auth/logout         - Logout`);
      console.log(`  POST   /api/auth/refresh        - Renovar token`);
      console.log(`  GET    /api/auth/me             - Dados do usuário`);
      console.log(`  POST   /webhook/hotmart         - Webhook Hotmart (legado)`);
      console.log();
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor', error);
    process.exit(1);
  }
}

// ════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ════════════════════════════════════════════════════════════════

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM recebido, desligando gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT recebido, desligando gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Iniciar
startServer();

module.exports = app;
