# 🔧 IMPLEMENTAÇÃO BACKEND - STEP BY STEP
## Reset Primal - Webhook Hotmart + BD + Email

**Data:** 27 de janeiro de 2026  
**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Stacks suportadas:** Node.js (Recomendado), Python, PHP  

---

## 📋 ANTES DE COMEÇAR

### Pré-requisitos:
- [ ] Node.js 18+ instalado (ou Python 3.8+ / PHP 7.4+)
- [ ] Git configurado
- [ ] Documentos de referência (WEBHOOKS-SETUP.md)
- [ ] HOTMART_WEBHOOK_SECRET recebido do PM
- [ ] Credenciais de email (SendGrid ou outro)
- [ ] Acesso ao servidor/localhost para testar

### Stack Choice:
```
Escolha UMA opção (recomendação: Node.js):

OPÇÃO 1: Node.js + Express (RECOMENDADO)
├─ Setup rápido (npm install)
├─ Fácil deploy (Heroku, Railway, etc)
├─ Suporte a PM2 para auto-restart
└─ Melhor para produção

OPÇÃO 2: Python + Flask
├─ Setup simples (pip install)
├─ Ótimo para prototipagem
└─ Suporte AWS Lambda/Google Cloud Functions

OPÇÃO 3: PHP
├─ Rápido deploy em shared hosting
├─ Sem dependências externas
└─ Ideal se servidor já tem PHP
```

---

## ✅ TASK 1: SETUP INICIAL (NODE.JS)
**Tempo:** 20 minutos  
**Resultado:** Projeto Node.js pronto com dependências

### 1.1 - Criar Estrutura de Pastas

```bash
cd /Users/acacioamaro/Projects/reset-primal

# Criar pasta api
mkdir -p api logs

# Entrar na pasta
cd api
```

### 1.2 - Inicializar Node.js Project

```bash
npm init -y
```

**Resultado:** Arquivo `package.json` criado com defaults

### 1.3 - Instalar Dependências

```bash
npm install express dotenv crypto axios nodemailer
npm install --save-dev nodemon
```

**O que instala:**
- `express` - Framework web
- `dotenv` - Carregar variáveis de ambiente
- `crypto` - Validação de signature Hotmart
- `axios` - Fazer requisições HTTP
- `nodemailer` - Enviar emails
- `nodemon` - Auto-reload em desenvolvimento

### 1.4 - Criar Arquivos Base

**Arquivo: `api/server.js`**

```javascript
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const PORT = process.env.APP_PORT || 3000;
const HOTMART_SECRET = process.env.HOTMART_WEBHOOK_SECRET;

console.log('🚀 Servidor iniciando...');
console.log('📡 Porta:', PORT);
console.log('🔐 Webhook secret configurado:', !!HOTMART_SECRET);

// ════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Reset Primal Webhook API',
    timestamp: new Date().toISOString()
  });
});

// ════════════════════════════════════════════════════════
// WEBHOOK HOTMART
// ════════════════════════════════════════════════════════
app.post('/webhook/hotmart', async (req, res) => {
  try {
    console.log('\n📨 Webhook recebido');
    
    // Passo 1: Validar signature
    const signature = req.headers['x-hotmart-signature'];
    if (!signature) {
      console.warn('⚠️  Sem assinatura');
      return res.status(401).json({ error: 'No signature' });
    }

    // Validar
    const payload = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', HOTMART_SECRET)
      .update(payload)
      .digest('hex');

    if (hash !== signature) {
      console.warn('❌ Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Assinatura válida');

    // Passo 2: Extrair dados
    const { status, buyer, sale } = req.body;
    
    if (status !== 'completed') {
      console.log('ℹ️  Status:', status, '(ignorando)');
      return res.status(200).json({ status: 'received' });
    }

    console.log(`💰 Venda nova!`);
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Nome: ${buyer.name}`);
    console.log(`   Valor: R$ ${sale.price}`);
    console.log(`   ID: ${sale.id}`);

    // TODO: Passo 3: Salvar em BD
    // TODO: Passo 4: Enviar email
    // TODO: Passo 5: Notificar Telegram

    // Responder sucesso
    res.status(200).json({ 
      status: 'received',
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Erro webhook:', error.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando: http://localhost:${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/webhook/hotmart`);
});
```

### 1.5 - Criar Arquivo .env

**Arquivo: `api/.env`** (IMPORTANTE: adicionar ao .gitignore)

```bash
# Desenvolvimento
NODE_ENV=development
APP_PORT=3000

# Hotmart
HOTMART_WEBHOOK_SECRET=seu_webhook_secret_aqui

# Será adicionado depois:
# SENDGRID_API_KEY=...
# DATABASE_URL=...
# TELEGRAM_BOT_TOKEN=...
```

### 1.6 - Atualizar package.json

**Abra `api/package.json` e adicione no final antes de `}`:**

```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
```

### 1.7 - Testar Servidor

```bash
# Terminal na pasta api/
npm run dev

# Esperado:
# 🚀 Servidor iniciando...
# 📡 Porta: 3000
# 🔐 Webhook secret configurado: true
# ✅ Servidor rodando: http://localhost:3000
```

### 1.8 - Teste de Conectividade

**Em outro terminal:**

```bash
# Testar health check
curl http://localhost:3000

# Esperado: {"status":"OK","message":"Reset Primal Webhook API",...}

# Testar webhook (sem signature, vai dar erro 401, é normal)
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Esperado: {"error":"No signature"}
```

✅ **TASK 1 CONCLUÍDA**

---

## ✅ TASK 2: INTEGRAÇÃO COM BANCO DE DADOS
**Tempo:** 45 minutos  
**Resultado:** Dados de vendas sendo salvos em BD

### 2.1 - Escolher Banco de Dados

```
OPÇÃO 1: SQLite (RECOMENDADO para início)
├─ Zero setup
├─ Arquivo local: vendas.db
├─ Perfeito para prototipagem

OPÇÃO 2: PostgreSQL
├─ Robusto para produção
├─ Requer servidor separate
├─ Melhor para escala

OPÇÃO 3: MongoDB
├─ NoSQL, flexível
├─ Requer Atlas/Cloud
└─ Ótimo para rapid dev
```

**Vou usar SQLite + Prisma (mais fácil e rápido)**

### 2.2 - Instalar Prisma

```bash
npm install @prisma/client
npm install --save-dev prisma
```

### 2.3 - Inicializar Prisma

```bash
npx prisma init

# Responda: SQLite (ou escolha seu BD)
```

**Resultado:** Arquivo `.env` e `prisma/schema.prisma` criados

### 2.4 - Configurar Schema (Banco de Dados)

**Abra: `api/prisma/schema.prisma` e substitua por:**

```prisma
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

  @@map("vendas")
}
```

### 2.5 - Executar Migração

```bash
npx prisma migrate dev --name init

# Responda: sim para criar schema
```

**Resultado:** Arquivo `vendas.db` criado na pasta `api/prisma/`

### 2.6 - Atualizar .env

**Abra `api/.env` e procure por `DATABASE_URL`:**

```bash
# Altere de:
DATABASE_URL="file:./dev.db"

# Para:
DATABASE_URL="file:./prisma/vendas.db"
```

### 2.7 - Criar Serviço de BD

**Arquivo: `api/services/database.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function salvarVenda(dados) {
  try {
    const venda = await prisma.venda.create({
      data: {
        hotmart_id: dados.hotmart_id,
        comprador_email: dados.comprador_email,
        comprador_nome: dados.comprador_nome,
        comprador_cpf: dados.comprador_cpf || null,
        valor: parseFloat(dados.valor),
        data_compra: new Date(dados.data_compra),
        metodo_pagamento: dados.metodo_pagamento,
        status: 'completed'
      }
    });

    console.log('✅ Venda salva em BD:', venda.id);
    return venda;
  } catch (error) {
    console.error('❌ Erro ao salvar venda:', error.message);
    throw error;
  }
}

async function obterVendas(limite = 10) {
  try {
    const vendas = await prisma.venda.findMany({
      orderBy: { criado_em: 'desc' },
      take: limite
    });
    return vendas;
  } catch (error) {
    console.error('❌ Erro ao buscar vendas:', error);
    return [];
  }
}

module.exports = {
  salvarVenda,
  obterVendas
};
```

### 2.8 - Atualizar Webhook para Salvar BD

**Em `api/server.js`, na função webhook, procure por:**

```javascript
    // TODO: Passo 3: Salvar em BD
```

**Substitua por:**

```javascript
    // Passo 3: Salvar em BD
    const db = require('./services/database');
    
    await db.salvarVenda({
      hotmart_id: sale.id,
      comprador_email: buyer.email,
      comprador_nome: buyer.name,
      comprador_cpf: buyer.document,
      valor: sale.price,
      data_compra: sale.date,
      metodo_pagamento: sale.payment_method
    });
```

### 2.9 - Testar BD

```bash
# Parar servidor (Ctrl+C)
# Reiniciar:
npm run dev

# Verificar que criou database:
ls -la prisma/

# Esperado: arquivo vendas.db
```

**Teste de inserção manual:**

```bash
# Em outro terminal, criar venda teste:
node -e "
const db = require('./services/database');
db.salvarVenda({
  hotmart_id: 'TEST123',
  comprador_email: 'teste@email.com',
  comprador_nome: 'Teste',
  comprador_cpf: '123',
  valor: 97.00,
  data_compra: new Date(),
  metodo_pagamento: 'test'
});
"
```

### 2.10 - Ver Dados

```bash
# Abrir Prisma Studio (GUI)
npx prisma studio

# Abre em http://localhost:5555
# Você pode ver todas as vendas
```

✅ **TASK 2 CONCLUÍDA**

---

## ✅ TASK 3: ENVIO DE EMAIL
**Tempo:** 30 minutos  
**Resultado:** Email sendo enviado após venda confirmada

### 3.1 - Setup SendGrid

**Você precisa:**
1. Conta SendGrid (gratuita: https://sendgrid.com)
2. API Key obtida
3. Email verificado (sender email)

**Se não tiver, use Gmail (menos seguro mas funciona para teste):**

```bash
npm install nodemailer
```

### 3.2 - Criar Serviço de Email

**Arquivo: `api/services/email.js`**

```javascript
const nodemailer = require('nodemailer');

// Opção 1: SendGrid
async function enviarEmailSendGrid(email, nome) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@resetprimal.com.br',
    subject: '🎉 Seu Reset Primal está pronto!',
    html: `
      <h2>Bem-vindo, ${nome}!</h2>
      
      <p>Sua compra foi confirmada. Aqui está seu acesso:</p>
      
      <a href="https://resetprimal.com.br/ebook" style="
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      ">
        Acessar E-book →
      </a>
      
      <p>Se tiver dúvidas, entre em nosso grupo Telegram.</p>
      
      <p>Abraço,<br>Reset Primal Team</p>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('📧 Email enviado:', email);
    return true;
  } catch (error) {
    console.error('❌ Erro SendGrid:', error.message);
    throw error;
  }
}

// Opção 2: Gmail (para teste)
async function enviarEmailGmail(email, nome) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD // App Password, não senha normal
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: '🎉 Seu Reset Primal está pronto!',
    html: `
      <h2>Bem-vindo, ${nome}!</h2>
      <p>Sua compra foi confirmada.</p>
      <a href="https://resetprimal.com.br/ebook">Acessar E-book</a>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', email);
    return true;
  } catch (error) {
    console.error('❌ Erro Gmail:', error.message);
    throw error;
  }
}

// Usar uma ou outra
async function enviarEmail(email, nome) {
  if (process.env.SENDGRID_API_KEY) {
    return enviarEmailSendGrid(email, nome);
  } else if (process.env.GMAIL_USER) {
    return enviarEmailGmail(email, nome);
  } else {
    throw new Error('Nenhum serviço de email configurado');
  }
}

module.exports = { enviarEmail };
```

### 3.3 - Instalar SendGrid (se usar)

```bash
npm install @sendgrid/mail
```

### 3.4 - Adicionar a .env

**Abra `api/.env` e adicione:**

```bash
# OPÇÃO 1: SendGrid
SENDGRID_API_KEY=sua_api_key_aqui
SENDGRID_FROM_EMAIL=noreply@resetprimal.com.br

# OPÇÃO 2: Gmail (para teste)
GMAIL_USER=seu_gmail@gmail.com
GMAIL_PASSWORD=sua_app_password_aqui
```

### 3.5 - Integrar no Webhook

**Em `api/server.js`, procure por:**

```javascript
    // TODO: Passo 4: Enviar email
```

**Substitua por:**

```javascript
    // Passo 4: Enviar email
    const email = require('./services/email');
    
    try {
      await email.enviarEmail(buyer.email, buyer.name);
    } catch (emailError) {
      console.error('⚠️  Email falhou:', emailError.message);
      // Não falhar o webhook por email, apenas logar
    }
```

### 3.6 - Testar Email

```bash
# Reiniciar servidor:
npm run dev

# Testar manualmente:
node -e "
const email = require('./services/email');
email.enviarEmail('seu_email@gmail.com', 'Teste')
  .then(() => console.log('✅ Enviado'))
  .catch(e => console.error('❌', e.message));
"
```

✅ **TASK 3 CONCLUÍDA**

---

## ✅ TASK 4: NOTIFICAÇÕES TELEGRAM (OPCIONAL)
**Tempo:** 15 minutos  
**Resultado:** Notificação no Telegram quando venda chega

### 4.1 - Setup Telegram Bot

1. Abra Telegram
2. Procure por: `@BotFather`
3. Envie: `/newbot`
4. Escolha nome e username
5. Copie o TOKEN gerado

**Agora, obter seu Chat ID:**
1. Procure por: `@userinfobot`
2. Envie: `/start`
3. Copie o ID mostrado

### 4.2 - Criar Serviço Telegram

**Arquivo: `api/services/telegram.js`**

```javascript
const axios = require('axios');

async function notificarVenda(dados) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('⚠️  Telegram não configurado (opcional)');
    return;
  }

  const mensagem = `
💰 NOVA VENDA!
👤 ${dados.comprador_nome}
📧 ${dados.comprador_email}
💵 R$ ${dados.valor}
🆔 ID: ${dados.hotmart_id}
⏰ ${new Date().toLocaleString('pt-BR')}
  `.trim();

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: mensagem
      }
    );
    console.log('📱 Notificação Telegram enviada');
  } catch (error) {
    console.error('⚠️  Erro Telegram:', error.message);
    // Não falhar por Telegram
  }
}

module.exports = { notificarVenda };
```

### 4.3 - Adicionar a .env

**Abra `api/.env` e adicione:**

```bash
# Telegram (opcional)
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
```

### 4.4 - Integrar no Webhook

**Em `api/server.js`, procure por:**

```javascript
    // TODO: Passo 5: Notificar Telegram
```

**Substitua por:**

```javascript
    // Passo 5: Notificar Telegram (opcional)
    const telegram = require('./services/telegram');
    
    telegram.notificarVenda({
      comprador_nome: buyer.name,
      comprador_email: buyer.email,
      valor: sale.price,
      hotmart_id: sale.id
    }).catch(() => {}); // Ignorar erros
```

✅ **TASK 4 CONCLUÍDA**

---

## ✅ TASK 5: TESTAR COM HOTMART WEBHOOK TEST
**Tempo:** 15 minutos  
**Resultado:** Webhook funcionando com Hotmart

### 5.1 - Deploy Local para Teste

O Hotmart precisa acessar sua URL via internet. Opções:

**OPÇÃO 1: LocalTunnel (recomendado para teste)**

```bash
# Em novo terminal
npm install -g localtunnel

# Criar túnel
lt --port 3000
# Saída: https://xyz123.loca.lt
```

**OPÇÃO 2: Ngrok**

```bash
npm install -g ngrok
ngrok http 3000
# Saída: https://abc123.ngrok.io
```

**OPÇÃO 3: Deploy em produção**
- Heroku
- Railway
- Render
- AWS Lambda

### 5.2 - Configurar Webhook no Hotmart

1. Acesse: https://app.hotmart.com
2. Vá em: Configurações → Webhooks
3. Clique em: "Novo Webhook"
4. URL: `https://xyz123.loca.lt/webhook/hotmart` (use seu túnel)
5. Marque: Venda Realizada, Reembolso, Chargeback
6. Salve (Hotmart gera o token)
7. Copie o token para `.env`: `HOTMART_WEBHOOK_SECRET=...`

### 5.3 - Testar Webhook

**No painel Hotmart:**
1. Localize seu webhook
2. Clique em: "Enviar Teste"
3. Hotmart envia um evento de teste

**No seu servidor (terminal):**
```
Esperado:
✅ Assinatura válida
💰 Venda nova!
   Email: teste@hotmart.com
   Nome: Teste
   Valor: R$ 97
   ID: TEST123
✅ Venda salva em BD: 1
📧 Email enviado: teste@hotmart.com
📱 Notificação Telegram enviada
```

**Respostas:**
- HTTP 200 OK = Sucesso
- HTTP 401 = Signature inválida (verificar .env)
- HTTP 500 = Erro no seu código (ver logs)

### 5.4 - Verificar Dados Salvos

```bash
# Abrir Prisma Studio
npx prisma studio

# Ir em tab "vendas"
# Deve mostrar novo registro
```

✅ **TASK 5 CONCLUÍDA**

---

## 📋 VALIDAÇÃO FINAL - CHECKLIST BACKEND

### Código
- [ ] Arquivo `api/server.js` criado e rodando?
- [ ] Dependências instaladas (`npm install`)?
- [ ] Nenhum erro de sintaxe?

### Banco de Dados
- [ ] Arquivo `prisma/vendas.db` existe?
- [ ] Prisma studio abre sem erro?
- [ ] Tabela "vendas" visível?

### Hotmart
- [ ] HOTMART_WEBHOOK_SECRET em `.env`?
- [ ] Webhook criado em Hotmart?
- [ ] URL webhook configurada corretamente?

### Email
- [ ] SendGrid OU Gmail configurado?
- [ ] API Key / Password em `.env`?
- [ ] Email de teste enviado com sucesso?

### Telegram (Opcional)
- [ ] Bot token obtido?
- [ ] Chat ID obtido?
- [ ] Configurado em `.env`?

### Integração Hotmart
- [ ] Teste Hotmart disparou?
- [ ] Dados salvos em BD?
- [ ] Email foi recebido?
- [ ] Notificação Telegram apareceu?

### Logs
- [ ] Console mostra todos os passos?
- [ ] Sem erros durante execução?

---

## 🧪 TESTE PONTA-A-PONTA

### Teste 1: Webhook Test Hotmart
```
1. Servidor rodando: npm run dev
2. Hotmart dashboard → Webhooks → Test
3. Esperado:
   ✅ Console mostra: "✅ Assinatura válida"
   ✅ Console mostra: "💰 Venda nova!"
   ✅ Prisma Studio mostra novo registro
   ✅ Email recebido em inbox
```

### Teste 2: Verificar BD
```
1. npx prisma studio
2. Tab "vendas"
3. Deve mostrar:
   - hotmart_id
   - comprador_email
   - comprador_nome
   - valor
   - criado_em
```

### Teste 3: Verificar Email
```
1. Verificar inbox (ou spam)
2. De: noreply@resetprimal.com.br
3. Assunto: "Seu Reset Primal está pronto!"
4. Link de e-book funciona?
```

---

## ⚠️ TROUBLESHOOTING

### Problema: "Assinatura inválida"
**Solução:**
- [ ] HOTMART_WEBHOOK_SECRET em `.env` está correto?
- [ ] Hotmart regenerou token?
- [ ] Copiar exatamente sem espaços?

### Problema: "Cannot find module '@prisma/client'"
**Solução:**
```bash
npm install @prisma/client
```

### Problema: Email não chega
**Solução:**
- [ ] API Key SendGrid está correta?
- [ ] Email FROM foi verificado no SendGrid?
- [ ] Gmail: usou App Password (não senha)?

### Problema: Telegram não funciona
**Solução:**
- [ ] Telegram é opcional, ignora erro
- [ ] Bot token está correto?
- [ ] Chat ID está correto?

### Problema: Servidor não inicia
**Solução:**
```bash
# Porta em uso?
lsof -i :3000

# Limpar node_modules:
rm -rf node_modules
npm install

# Reiniciar:
npm run dev
```

---

## 🎯 PRÓXIMO PASSO

Quando terminar esta task:

1. ✅ **Verificar que tudo funciona:**
   - [ ] Servidor rodando
   - [ ] Webhook test sucede
   - [ ] Dados em BD
   - [ ] Email chega
   - [ ] Telegram notifica (se configurado)

2. ✅ **Commit seus changes:**
   ```bash
   git add api/
   git add .gitignore (adicionar .env)
   git commit -m "feat: implement webhook + db + email + telegram"
   ```

3. ✅ **Notificar DevOps:**
   - "Backend terminou, podem começar Nginx + PM2"
   - URL webhook local: `http://localhost:3000/webhook/hotmart`

4. ✅ **Aguardar Frontend + DevOps:**
   - Você vai precisar de URL pública para deploy final

---

**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Próximo:** DevOps — Nginx + PM2 + SSL

Boa sorte! 🚀

— Morgan, planejando o futuro 📊