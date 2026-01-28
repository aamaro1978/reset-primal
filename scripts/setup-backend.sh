#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Setup Backend Automático
# Tempo economizado: 15 minutos
# Uso: bash scripts/setup-backend.sh
# ════════════════════════════════════════════════════════════════

set -e

echo "🚀 Iniciando setup Backend automatizado..."
echo ""

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script da pasta /reset-primal"
    exit 1
fi

# 1. Criar estrutura
echo "📁 Criando estrutura de pastas..."
mkdir -p api logs
cd api

# 2. Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "📦 Inicializando Node.js project..."
    npm init -y > /dev/null
fi

# 3. Instalar dependências
echo "📥 Instalando dependências..."
npm install --silent express dotenv crypto axios nodemailer @sendgrid/mail @prisma/client > /dev/null 2>&1
npm install --save-dev --silent nodemon prisma > /dev/null 2>&1

# 4. Criar .env.example se não existir
if [ ! -f ".env.example" ]; then
    echo "⚙️  Criando .env.example..."
    cat > .env.example << 'EOF'
# Reset Primal - Environment Variables
NODE_ENV=development
APP_PORT=3000

# Hotmart
HOTMART_WEBHOOK_SECRET=seu_secret_aqui

# SendGrid
SENDGRID_API_KEY=SG.seu_key_aqui
SENDGRID_FROM_EMAIL=noreply@resetprimal.com.br

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Database
DATABASE_URL=file:./dev.db
EOF
fi

# 5. Criar server.js básico se não existir
if [ ! -f "server.js" ]; then
    echo "⚙️  Criando server.js..."
    cat > server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const PORT = process.env.APP_PORT || 3000;
const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET;

console.log('🚀 Servidor iniciando...');
console.log('📡 Porta:', PORT);
console.log('🔐 Webhook secret:', !!HOTMART_SECRET ? '✅' : '❌');

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Reset Primal Webhook API',
    timestamp: new Date().toISOString()
  });
});

// Webhook placeholder
app.post('/webhook/hotmart', async (req, res) => {
  console.log('📨 Webhook recebido');
  res.status(200).json({ status: 'received' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
EOF
fi

# 6. Criar package.json scripts se não existirem
if ! grep -q '"dev":' package.json; then
    echo "⚙️  Adicionando scripts npm..."
    npm set-script dev "nodemon server.js" > /dev/null
    npm set-script start "node server.js" > /dev/null
fi

# 7. Criar Prisma schema se não existir
if [ ! -f "prisma/schema.prisma" ]; then
    echo "⚙️  Inicializando Prisma..."
    npx prisma init > /dev/null 2>&1

    cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Venda {
  id                Int     @id @default(autoincrement())
  hotmart_id        String  @unique
  comprador_email   String
  comprador_nome    String
  comprador_cpf     String?
  valor             Float
  data_compra       DateTime
  metodo_pagamento  String?
  status            String  @default("completed")
  criado_em         DateTime @default(now())
}
EOF

    # Criar banco de dados
    echo "💾 Criando banco de dados..."
    npx prisma migrate dev --name init > /dev/null 2>&1
fi

cd ..

# 8. Resultado
echo ""
echo "✅ Setup Backend completo!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Editar api/.env com suas credenciais"
echo "   2. Começar a implementar tasks no IMPLEMENTACAO-BACKEND-STEP-BY-STEP.md"
echo "   3. Testar: npm run dev (na pasta api)"
echo ""
echo "⏱️  Tempo economizado: ~15 minutos"
echo ""
