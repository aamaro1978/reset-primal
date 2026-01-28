# 🎯 PLANO DE DELEGAÇÃO POR ESPECIALIDADE
## Reset Primal - Distribuição de Responsabilidades

**Data:** 27 de janeiro de 2026  
**Status:** Pronto para implementação  
**Tempo Total:** ~10 horas distribuídas entre 4 funções  
**Sincronização:** Todos começam hoje, entregam amanhã  

---

## 📊 MATRIZ DE DELEGAÇÃO

```
┌─────────────────┬──────────────┬───────────────┬──────────────┐
│ FUNÇÃO          │ TEMPO        │ DOCUMENTOS    │ DEPENDÊNCIAS │
├─────────────────┼──────────────┼───────────────┼──────────────┤
│ Frontend Dev    │ 2h 30min     │ 2 docs        │ Product      │
│ Backend Dev     │ 2h 30min     │ 1 doc         │ Frontend     │
│ DevOps/SysAdmin │ 2h 30min     │ 1 doc         │ Backend      │
│ Product Manager │ 2h 30min     │ 2 docs        │ Nenhuma      │
└─────────────────┴──────────────┴───────────────┴──────────────┘
```

---

## 👨‍💻 FUNÇÃO 1: FRONTEND DEVELOPER

### 📋 Responsabilidades
- ✅ Integrar link Hotmart nos 3 botões CTA
- ✅ Instalar Google Analytics 4 (GA4)
- ✅ Instalar Facebook Pixel
- ✅ Configurar eventos customizados (cliques, scroll, etc)
- ✅ Validar responsividade em mobile
- ✅ Testar fluxo de clique até Hotmart

### 📚 Documentos de Referência
1. **INTEGRACAO-HOTMART.md** (45 min) - PRINCIPAL
   - Seções: 1, 2, 3, 5 (código HTML exato)
   - Código pronto para copiar/colar
   
2. **ANALYTICS-SETUP.md** (45 min) - PRINCIPAL
   - Seções: 1 (GA4), 2 (Facebook Pixel)
   - Scripts prontos para copiar/colar

### 📋 Checklist Técnico

**HOJE (2.5 horas):**

#### Task 1: Integrar Hotmart CTA (45 min)
- [ ] Obter link Hotmart correto (pedir ao Product)
- [ ] Abrir arquivo: `landing-page/grand-slam/index.html`
- [ ] Adicionar 3 botões CTA:
  - [ ] Hero section (topo)
  - [ ] Offer section (meio)
  - [ ] CTA Final section (fundo)
- [ ] Testar localmente:
  - [ ] Botões aparecem?
  - [ ] Clique abre Hotmart?
  - [ ] Link é o correto?
- [ ] Commit: `feat: integrate hotmart CTA buttons`

**Código HTML exato (copiar do INTEGRACAO-HOTMART.md):**
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button">
    SIM, QUERO O RESET PRIMAL AGORA — R$ 97
</a>
```

#### Task 2: Instalar GA4 (45 min)
- [ ] Receber `GA4_MEASUREMENT_ID` do Product
- [ ] Editar: `landing-page/grand-slam/index.html`
- [ ] Adicionar script GA4 em `<head>`:
  ```html
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXX');
  </script>
  ```
- [ ] Substituir `G-XXXXXXXXX` pelo ID real
- [ ] Testar em navegador (GA4 deve carregar sem erro)
- [ ] Commit: `feat: add GA4 analytics script`

#### Task 3: Instalar Facebook Pixel (45 min)
- [ ] Receber `FACEBOOK_PIXEL_ID` do Product
- [ ] Adicionar script Pixel em `<head>`:
  ```html
  <!-- Facebook Pixel -->
  <script>
    !function(f,b,e,v,n,t,s)...
    fbq('init', '123456789012345');
    fbq('track', 'PageView');
  </script>
  ```
- [ ] Instalar extensão: **Facebook Pixel Helper**
- [ ] Testar que Pixel carrega (deve estar verde)
- [ ] Commit: `feat: add Facebook Pixel`

#### Task 4: Configurar Eventos (30 min)
- [ ] Adicionar eventos GA4:
  - [ ] `click_cta_button` (quando clica CTA)
  - [ ] `scroll_depth` (40%, 60%, 80%, 100%)
  - [ ] `time_on_page` (30s, 60s, 120s)
- [ ] Adicionar eventos Facebook:
  - [ ] `InitiateCheckout` (clique CTA)
  - [ ] `ViewContent` (scroll para oferta)
- [ ] Testar eventos em navegador
- [ ] Commit: `feat: add custom analytics events`

### 🧪 Validação & Testes

**Checklist de teste:**
```javascript
// No console do navegador, quando em resetprimal.com.br

// 1. GA4 está carregando?
console.log(window.gtag ? '✅ GA4' : '❌ GA4 não encontrado');

// 2. Facebook Pixel está carregando?
console.log(window.fbq ? '✅ Pixel' : '❌ Pixel não encontrado');

// 3. Clique CTA dispara eventos?
// → Abrir GA4 real-time
// → Abrir Facebook Pixel Helper
// → Clicar botão CTA
// → Deve aparecer evento em ambos
```

### 🎯 Entrega Esperada

**Arquivo modificado:** `landing-page/grand-slam/index.html`

**Status antes do commit:**
- [ ] Botões CTA com link Hotmart
- [ ] Scripts GA4 e Facebook no `<head>`
- [ ] Sem erros no console do navegador
- [ ] Responsividade mantida (mobile/desktop)
- [ ] Tudo testado localmente

---

## 🔧 FUNÇÃO 2: BACKEND DEVELOPER

### 📋 Responsabilidades
- ✅ Implementar webhook Hotmart
- ✅ Validar assinatura/segurança
- ✅ Registrar vendas em banco de dados
- ✅ Enviar email de confirmação
- ✅ Notificar em Telegram/Slack
- ✅ Testes com compra simulada

### 📚 Documentos de Referência
1. **WEBHOOKS-SETUP.md** (90 min) - PRINCIPAL
   - Seções: 1, 2 (código Node/Python/PHP)
   - Seções: 5, 6 (dados recebidos, o que fazer)
   - Seções: 8, 9 (testes, troubleshooting)

### 📋 Checklist Técnico

**HOJE (2.5 horas):**

#### Task 1: Implementar Webhook (1h 15min)
- [ ] Escolher stack: Node.js, Python ou PHP?
- [ ] Copiar código base de WEBHOOKS-SETUP.md:
  - [ ] Node.js: validação de signature + resposta HTTP 200
  - [ ] Python: similar mas com Flask
  - [ ] PHP: endpoint webhook.php
- [ ] Editar para seu ambiente (ports, paths)
- [ ] Integrar com .env:
  - [ ] Ler `HOTMART_WEBHOOK_SECRET` de `.env`
  - [ ] Ler `SENDGRID_API_KEY` de `.env`
  - [ ] Ler `TELEGRAM_BOT_TOKEN` (opcional)
- [ ] Commit: `feat: implement hotmart webhook endpoint`

**Arquivo a criar:** `/api/webhook.js` (ou equivalente)

**Código Node.js base:**
```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/webhook/hotmart', async (req, res) => {
  try {
    // 1. Validar signature
    const signature = req.headers['x-hotmart-signature'];
    if (!validateSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Extrair dados
    const { buyer, sale, status } = req.body;
    console.log(`✅ Venda: ${buyer.email}, R$ ${sale.price}`);

    // 3. Registrar em BD
    // TODO: INSERT into vendas table

    // 4. Enviar email
    // TODO: SendGrid.send()

    // 5. Notificar Telegram
    // TODO: telegram.sendMessage()

    res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('❌ Erro webhook:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

function validateSignature(body, signature) {
  const secret = process.env.HOTMART_WEBHOOK_SECRET;
  const payload = JSON.stringify(body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

app.listen(3000, () => console.log('Webhook running on :3000'));
```

#### Task 2: Integração com Banco de Dados (45 min)
- [ ] Escolher BD: PostgreSQL, MySQL ou MongoDB?
- [ ] Criar tabela de vendas (ou coleção):
  ```sql
  CREATE TABLE vendas (
    id SERIAL PRIMARY KEY,
    hotmart_id VARCHAR(50) UNIQUE,
    comprador_email VARCHAR(100),
    comprador_nome VARCHAR(100),
    comprador_cpf VARCHAR(20),
    valor DECIMAL(10,2),
    data_compra TIMESTAMP,
    metodo_pagamento VARCHAR(50),
    status VARCHAR(20),
    criado_em TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Integrar connection string em `.env`
- [ ] INSERT record quando webhook chega
- [ ] Commit: `feat: add sales database integration`

#### Task 3: Envio de Email (30 min)
- [ ] Integrar SendGrid (ou seu email service):
  ```javascript
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: buyer.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Seu Reset Primal está pronto!',
    html: `
      <h2>Bem-vindo, ${buyer.name}!</h2>
      <p>Sua compra foi confirmada.</p>
      <p><a href="https://resetprimal.com.br/ebook">
        Acessar seu e-book →
      </a></p>
    `
  });
  ```
- [ ] Testar com email de teste
- [ ] Commit: `feat: add sendgrid email confirmation`

#### Task 4: Notificações Telegram (15 min - OPCIONAL)
- [ ] Integrar Telegram Bot (opcional):
  ```javascript
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `
    💰 Nova venda!
    👤 ${buyer.name}
    📧 ${buyer.email}
    💵 R$ ${sale.price}
  `);
  ```
- [ ] Commit: `feat: add telegram notifications`

### 🧪 Validação & Testes

**Testes antes de entregar:**

```bash
# 1. Servidor rodando?
curl http://localhost:3000/webhook/hotmart -X POST -d '{}' -H 'Content-Type: application/json'
# Esperado: erro 401 (signature inválida, mas é esperado)

# 2. Gerar token de teste
# Hotmart dashboard → Webhooks → "Enviar Teste"
# Deve chegar no seu servidor (ver logs)

# 3. Testar com compra real simulada
# Usar cartão de teste do Hotmart

# 4. Verificar logs
# PM2 logs webhook
# tail -f logs/webhooks.log
```

**Checklist de teste:**
- [ ] Webhook responde com HTTP 200?
- [ ] Teste do Hotmart dispara com sucesso?
- [ ] Dados aparecem no banco de dados?
- [ ] Email é enviado?
- [ ] Notificação Telegram aparece?

### 🎯 Entrega Esperada

**Arquivos criados/modificados:**
- `/api/webhook.js` (Node.js)
- `.env` preenchido com credenciais
- Database schema criado
- Logs configurados

**Status antes do go-live:**
- [ ] Webhook validando signatures
- [ ] Dados salvos em BD
- [ ] Email sendo enviado
- [ ] Tudo logado para troubleshooting

---

## 🖥️ FUNÇÃO 3: DEVOPS / SYSADMIN

### 📋 Responsabilidades
- ✅ Validar estrutura de produção
- ✅ Configurar Nginx com proxy para webhook
- ✅ Verificar SSL/HTTPS
- ✅ Testar todas as URLs
- ✅ Monitorar logs
- ✅ Configurar PM2/supervisor para webhook

### 📚 Documentos de Referência
1. **ESTRUTURA-PRODUCAO.md** (90 min) - PRINCIPAL
   - Seções: 2.2 (estrutura de pastas)
   - Seções: 2.3 (Nginx config pronta)
   - Seções: 3 (serviços rodando)
   - Seções: 7 (troubleshooting)

### 📋 Checklist Técnico

**HOJE (2.5 horas):**

#### Task 1: Revisar Estrutura de Arquivos (30 min)
- [ ] Verificar pastas em `/var/www/reset-primal/`:
  ```
  /var/www/reset-primal/
  ├── landing-page/grand-slam/index.html ✅
  ├── ebook/diagramacao/index.html ✅
  ├── api/webhook.js ✅ (será criado por Backend)
  ├── .env (preenchido com credenciais)
  ├── logs/ (criar se não existir)
  └── node_modules/ (npm install)
  ```
- [ ] Criar pastas se faltarem:
  ```bash
  mkdir -p /var/www/reset-primal/{api,logs}
  ```
- [ ] Verificar permissões:
  ```bash
  sudo chown -R www-data:www-data /var/www/reset-primal
  sudo chmod 755 /var/www/reset-primal
  ```
- [ ] Commit: `chore: verify production file structure`

#### Task 2: Configurar Nginx (1h)
- [ ] Copiar Nginx config de ESTRUTURA-PRODUCAO.md
- [ ] Editar arquivo: `/etc/nginx/sites-available/resetprimal.com.br`
  ```bash
  sudo nano /etc/nginx/sites-available/resetprimal.com.br
  ```
- [ ] Colar configuração (vem pronta no doc)
- [ ] Testar sintaxe:
  ```bash
  sudo nginx -t
  # Esperado: "syntax is ok"
  ```
- [ ] Habilitar site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/resetprimal.com.br \
             /etc/nginx/sites-enabled/
  ```
- [ ] Restart:
  ```bash
  sudo systemctl restart nginx
  ```
- [ ] Verificar status:
  ```bash
  sudo systemctl status nginx
  ```

**Nginx config pronto (COPIAR DO DOC):**
```nginx
server {
    listen 80;
    server_name resetprimal.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name resetprimal.com.br;
    
    ssl_certificate /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resetprimal.com.br/privkey.pem;
    
    root /var/www/reset-primal;
    
    location / {
        try_files $uri $uri/ /landing-page/grand-slam/index.html;
    }
    
    location /ebook {
        alias /var/www/reset-primal/ebook/diagramacao;
    }
    
    location /webhook/hotmart {
        proxy_pass http://localhost:3000;
    }
}
```

#### Task 3: Validar SSL/HTTPS (30 min)
- [ ] Verificar certificado Let's Encrypt:
  ```bash
  sudo certbot certificates
  # Mostra datas de expiração
  ```
- [ ] Se não existir, gerar:
  ```bash
  sudo certbot certonly --nginx -d resetprimal.com.br
  ```
- [ ] Testar HTTPS:
  ```bash
  curl https://resetprimal.com.br
  # Esperado: HTML da LP (sem erros de certificado)
  ```
- [ ] Configurar auto-renew:
  ```bash
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
  ```
- [ ] Testar renovação seca:
  ```bash
  sudo certbot renew --dry-run
  ```

#### Task 4: Configurar PM2 para Webhook (20 min)
- [ ] Instalar PM2 (se não tiver):
  ```bash
  sudo npm install -g pm2
  ```
- [ ] Criar arquivo ecosystem.config.js:
  ```javascript
  module.exports = {
    apps: [{
      name: "reset-primal-webhook",
      script: "./api/webhook.js",
      instances: 1,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }]
  };
  ```
- [ ] Iniciar com PM2:
  ```bash
  cd /var/www/reset-primal
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  ```
- [ ] Verificar status:
  ```bash
  pm2 status
  pm2 logs reset-primal-webhook
  ```

#### Task 5: Testar Todas as URLs (20 min)
- [ ] Landing Page:
  ```bash
  curl https://resetprimal.com.br
  # Esperado: HTML completo
  ```
- [ ] E-book:
  ```bash
  curl https://resetprimal.com.br/ebook
  # Esperado: HTML do e-book
  ```
- [ ] Webhook (POST):
  ```bash
  curl -X POST https://resetprimal.com.br/webhook/hotmart \
       -d '{}' -H 'Content-Type: application/json'
  # Esperado: HTTP 401 (signature inválida, normal)
  ```
- [ ] Verificar logs:
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  pm2 logs reset-primal-webhook
  ```

### 🧪 Validação & Testes

**Checklist de produção:**
```bash
# 1. Serviços rodando?
systemctl status nginx
pm2 status

# 2. Certificado SSL válido?
curl -I https://resetprimal.com.br
# Esperado: HTTP/2 200 (não HTTP 302)

# 3. Proxy funciona?
curl https://resetprimal.com.br/webhook/hotmart
# Esperado: conecta ao webhook Node.js

# 4. Firewall permite tráfego?
sudo ufw status
# Porta 443 (HTTPS) deve estar aberta

# 5. Logs estão sendo gravados?
ls -la /var/log/nginx/
ls -la /var/www/reset-primal/logs/
```

### 🎯 Entrega Esperada

**Configuração pronta:**
- [ ] Nginx servindo LP e E-book
- [ ] SSL/HTTPS ativo
- [ ] Proxy webhook funcionando
- [ ] PM2 gerenciando webhook com auto-restart
- [ ] Logs configurados e acessíveis
- [ ] Monitoramento rodando

**Status antes do go-live:**
- [ ] Todas URLs respondendo com HTTP 200/301
- [ ] HTTPS forçado
- [ ] Webhook respondendo em `/webhook/hotmart`
- [ ] Sem erros em logs

---

## 📊 FUNÇÃO 4: PRODUCT MANAGER

### 📋 Responsabilidades
- ✅ Obter credenciais do Hotmart (link, token, etc)
- ✅ Criar propriedade GA4 e obter IDs
- ✅ Criar Facebook Pixel e obter IDs
- ✅ Organizar timeline e sincronizar equipe
- ✅ Revisar fluxo completo
- ✅ Assinatura final do checklist

### 📚 Documentos de Referência
1. **ROADMAP-IMPLEMENTACAO.md** (30 min) - PRINCIPAL
   - Seções: 2 (sequência)
   - Seções: 3 (impacto)
   
2. **CHECKLIST-LANCAMENTO.md** (90 min) - PRINCIPAL
   - Todas as seções para validação final

### 📋 Checklist Técnico

**HOJE (2.5 horas):**

#### Task 1: Obter Credenciais Hotmart (30 min)
**Local:** https://app.hotmart.com

- [ ] **Link de Venda:**
  - [ ] Ir em: Meus Produtos → Seu Produto
  - [ ] Procurar: "Link de Acesso" ou "URL de Acesso"
  - [ ] Copiar link completo (começa com https://pay.hotmart.com/)
  - [ ] Exemplo: `https://pay.hotmart.com/S96024805Y`
  - [ ] Compartilhar com Frontend Dev (colará na LP)

- [ ] **Webhook Secret:**
  - [ ] Ir em: Meus Dados → Webhooks
  - [ ] Clique em: "Novo Webhook" ou "Adicionar"
  - [ ] URL: `https://resetprimal.com.br/webhook/hotmart`
  - [ ] Marcar: Venda Realizada, Reembolso, Chargeback
  - [ ] Salvar (Hotmart gera token automático)
  - [ ] Copiar token gerado
  - [ ] Compartilhar com Backend Dev (irá para .env)

- [ ] Confirmar informações:
  ```
  HOTMART_AFFILIATE_LINK=https://pay.hotmart.com/S96024805Y
  HOTMART_WEBHOOK_SECRET=abc123def456...
  HOTMART_WEBHOOK_URL=https://resetprimal.com.br/webhook/hotmart
  ```

#### Task 2: Criar Google Analytics 4 (45 min)
**Local:** https://analytics.google.com

- [ ] **Criar Propriedade:**
  - [ ] Clique em: "Criar"
  - [ ] Nome: `Reset Primal`
  - [ ] Fuso horário: `America/Sao_Paulo`
  - [ ] Moeda: `BRL`
  - [ ] Confirmar

- [ ] **Criar Data Stream:**
  - [ ] Vá para: Data Streams
  - [ ] Clique em: "Adicionar Stream"
  - [ ] Plataforma: Web
  - [ ] URL: `https://resetprimal.com.br`
  - [ ] Nome: `Landing Page`
  - [ ] Criar

- [ ] **Obter IDs:**
  - [ ] Copiar: **Property ID** (ex: 123456789)
  - [ ] Copiar: **Measurement ID** (ex: G-XXXXXXXXX)
  - [ ] Compartilhar com Frontend Dev

- [ ] Confirmar informações:
  ```
  GA4_PROPERTY_ID=123456789
  GA4_MEASUREMENT_ID=G-XXXXXXXXX
  ```

#### Task 3: Criar Facebook Pixel (45 min)
**Local:** https://business.facebook.com

- [ ] **Criar Pixel:**
  - [ ] Vá para: Business Settings → Data Sources → Pixels
  - [ ] Clique em: "Create Pixel"
  - [ ] Nome: `Reset Primal Landing Page`
  - [ ] URL: `https://resetprimal.com.br`
  - [ ] Criar

- [ ] **Obter Pixel ID:**
  - [ ] Copiar: **Pixel ID** (ex: 123456789012345)
  - [ ] Compartilhar com Frontend Dev

- [ ] **Criar Conversão:**
  - [ ] Vá para: Events Manager
  - [ ] Clique no Pixel criado
  - [ ] Conversions → Create Conversion
  - [ ] Event source: Pixel
  - [ ] Event: Purchase
  - [ ] Criar

- [ ] Confirmar informações:
  ```
  FACEBOOK_PIXEL_ID=123456789012345
  ```

#### Task 4: Sincronizar e Organizar (30 min)
- [ ] **Reunião Kick-off (15 min):**
  - [ ] Compartilhar este documento com toda equipe
  - [ ] Confirmar que cada um entendeu suas responsabilidades
  - [ ] Confirmar que tem accesso aos docs
  - [ ] Marcar point de sincronização amanhã às 9h

- [ ] **Criar planilha de rastreamento:**
  ```
  TAREFA                          | RESPONSÁVEL    | STATUS | ENTREGA
  ─────────────────────────────────────────────────────────────────
  Integração Hotmart CTA          | Frontend Dev   | 🔄    | Hoje 5pm
  Instalação GA4                  | Frontend Dev   | 🔄    | Hoje 5pm
  Instalação FB Pixel             | Frontend Dev   | 🔄    | Hoje 5pm
  Configurar eventos              | Frontend Dev   | 🔄    | Hoje 5pm
  Webhook Node.js                 | Backend Dev    | 🔄    | Hoje 5pm
  Integração BD + Email           | Backend Dev    | 🔄    | Hoje 5pm
  Nginx + SSL                     | DevOps         | 🔄    | Hoje 5pm
  PM2 Webhook                     | DevOps         | 🔄    | Hoje 5pm
  Teste Completo                  | PM + Tech      | ⏳    | Amanhã 10am
  Checklist Lançamento            | PM             | ⏳    | Amanhã 2pm
  ```

- [ ] **Preparar ambiente comum:**
  - [ ] Criar canal #reset-primal no Slack/Discord
  - [ ] Compartilhar todos os docs ali
  - [ ] Criar thread para dúvidas
  - [ ] Avisar que qualquer bloqueio = comunicar ASAP

- [ ] **Definir pontos de sincronização:**
  - [ ] Hoje 5pm: Check-in entre Frontend + Backend
  - [ ] Hoje 6pm: Check-in entre Backend + DevOps
  - [ ] Amanhã 9am: Demo de tudo funcionando
  - [ ] Amanhã 11am: Teste fluxo completo
  - [ ] Amanhã 2pm: Checklist final + go/no-go

### 🎯 Entrega Esperada

**Arquivos preparados:**
- [ ] `.env.example` completo
- [ ] `.env` (com credenciais reais) distribuído
- [ ] Todos os IDs GA4, FB, Hotmart coletados
- [ ] Planilha de rastreamento criada
- [ ] Equipe sincronizada

**Status antes de lançar:**
- [ ] Todas credenciais validadas
- [ ] Todos docs compartilhados
- [ ] Timeline clara
- [ ] Bloqueadores identificados

---

## 🔄 SINCRONIZAÇÃO ENTRE EQUIPES

### Timeline Coordenada

```
┌─────────────────────────────────────────────────────────────────────┐
│ HOJE - IMPLEMENTAÇÃO PARALELA (4-5 horas)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ PARALELO 1: Frontend Dev (2h 30min)                                │
│ ├─ 10:00am: Recebe GA4_ID e FB_PIXEL_ID de Product ✅             │
│ ├─ 10:15am: Recebe HOTMART_LINK de Product ✅                      │
│ ├─ 10:30am: Começa integração (CTA, GA4, Pixel)                   │
│ ├─ 12:30pm: Testa localmente ✅                                    │
│ ├─ 1:00pm: Commit e push                                           │
│ └─ 1:15pm: Notifica Backend que terminou                           │
│                                                                      │
│ PARALELO 2: Backend Dev (2h 30min)                                 │
│ ├─ 10:00am: Recebe HOTMART_WEBHOOK_SECRET de Product ✅           │
│ ├─ 10:30am: Começa webhook (validação, BD, email) [AGUARDA: Frontend]
│ ├─ 12:00pm: Webhook respondendo em localhost:3000 ✅              │
│ ├─ 12:30pm: Testa com Hotmart webhook test ✅                     │
│ ├─ 1:00pm: Commit e push                                           │
│ └─ 1:15pm: Notifica DevOps que terminou                            │
│                                                                      │
│ PARALELO 3: DevOps (2h 30min)                                      │
│ ├─ 10:30am: Começa config Nginx [AGUARDA: Backend]                │
│ ├─ 11:00am: Nginx + SSL configurado                               │
│ ├─ 11:30am: PM2 webhook rodando                                   │
│ ├─ 12:00pm: Testa todas URLs                                      │
│ ├─ 12:30pm: Logs configurados ✅                                   │
│ ├─ 1:00pm: Tudo validado em produção                              │
│ └─ 1:15pm: Notifica Product que terminou                           │
│                                                                      │
│ PARALELO 4: Product Manager (2h 30min)                             │
│ ├─ 10:00am: Coleta credenciais Hotmart (30min)                    │
│ ├─ 10:30am: Coleta GA4 IDs (45min)                                │
│ ├─ 11:15am: Coleta FB Pixel ID (45min)                            │
│ ├─ 12:00pm: Cria .env e distribui                                 │
│ ├─ 12:30pm: Acompanha todo processo (disponível para bloqueadores)│
│ └─ 1:15pm: Agenda reunião de sincronização                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AMANHÃ - VALIDAÇÃO & LANÇAMENTO (2-3 horas)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ 9:00am   - Reunião: Status de cada tarefa                          │
│ 9:15am   - Frontend: Demonstra LP com CTA + Analytics             │
│ 9:30am   - Backend: Demonstra webhook testado                     │
│ 9:45am   - DevOps: Demonstra tudo rodando em produção             │
│ 10:00am  - TESTE COMPLETO: LP → Hotmart → Email → E-book        │
│ 11:00am  - Revisar CHECKLIST-LANCAMENTO.md (150+ itens)          │
│ 12:00pm  - Almoço                                                  │
│ 1:00pm   - Ajustes finais baseado em testes                       │
│ 2:00pm   - Checklist final + ASSINATURA                           │
│ 2:30pm   - GO/NO-GO Decision                                       │
│ 3:00pm   - LANÇAMENTO (se GO)                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pontos de Dependência

```
Product Manager
    ↓ (distribui credenciais)
    ├─→ Frontend Dev (GA4_ID, FB_PIXEL_ID, HOTMART_LINK)
    ├─→ Backend Dev (HOTMART_WEBHOOK_SECRET)
    └─→ DevOps (verifica infraestrutura)

Frontend Dev ✅
    ↓ (push com LP + GA4 + Pixel)
    └─→ DevOps (precisa da versão final para deploy)

Backend Dev ✅
    ↓ (push com webhook)
    └─→ DevOps (precisa rodar webhook em produção)

DevOps ✅
    ↓ (tudo rodando em produção)
    └─→ Product Manager (ready para teste completo)

Product Manager
    ↓ (teste fluxo completo LP → Hotmart → Webhook → Email)
    └─→ GO/NO-GO para lançamento
```

---

## 📋 CHECKLIST DE ENTREGA POR FUNÇÃO

### Frontend Dev - Entrega Esperada
- [ ] `landing-page/grand-slam/index.html` com:
  - [ ] 3 botões CTA com link Hotmart
  - [ ] GA4 script em `<head>`
  - [ ] Facebook Pixel script em `<head>`
  - [ ] Eventos customizados (GA4 + FB)
  - [ ] Sem erros no console
  - [ ] Responsividade OK (mobile/desktop)
- [ ] Git commit: `feat: integrate hotmart, analytics, events`
- [ ] Testado localmente? SIM ✅

### Backend Dev - Entrega Esperada
- [ ] `/api/webhook.js` com:
  - [ ] Validação de signature Hotmart
  - [ ] Resposta HTTP 200
  - [ ] Registra venda em BD
  - [ ] Envia email confirmação
  - [ ] Notifica Telegram (opcional)
  - [ ] Logs detalhados
- [ ] Git commit: `feat: implement webhook + db + email`
- [ ] Testado com Hotmart webhook test? SIM ✅
- [ ] BD criada e funcionando? SIM ✅

### DevOps - Entrega Esperada
- [ ] Nginx configurado e testado:
  - [ ] LP carregando em /
  - [ ] E-book carregando em /ebook
  - [ ] Webhook proxyando em /webhook/hotmart
  - [ ] SSL/HTTPS ativo
- [ ] PM2 rodando webhook com auto-restart
- [ ] Logs configurados (Nginx + Node.js)
- [ ] Todas URLs respondendo HTTP 200/301
- [ ] Git commit: `chore: nginx + pm2 + ssl setup`
- [ ] Testado em produção? SIM ✅

### Product Manager - Entrega Esperada
- [ ] `.env` completo com:
  - [ ] HOTMART_AFFILIATE_LINK
  - [ ] HOTMART_WEBHOOK_SECRET
  - [ ] GA4_PROPERTY_ID
  - [ ] GA4_MEASUREMENT_ID
  - [ ] FACEBOOK_PIXEL_ID
  - [ ] SENDGRID_API_KEY
  - [ ] Outros (Telegram, Slack, etc)
- [ ] Planilha de rastreamento atualizada
- [ ] Equipe sincronizada
- [ ] Teste completo agendado para amanhã
- [ ] CHECKLIST-LANCAMENTO.md revisado
- [ ] Assinatura final de go/no-go

---

## 🎯 CRITÉRIOS DE SUCESSO

### Para cada pessoa poder sair do projeto:

**Frontend Dev:**
- ✅ LP renderiza sem erro em navegador
- ✅ 3 botões CTA presentes e funcionando
- ✅ GA4 eventos disparam quando clica/scrolls
- ✅ FB Pixel detectado pelo Pixel Helper
- ✅ Responsividade mantida (mobile 360px até desktop 1920px)

**Backend Dev:**
- ✅ Webhook responde HTTP 200
- ✅ Hotmart webhook test dispara com sucesso
- ✅ Dados salvos em BD com todos campos
- ✅ Email enviado após webhook chega
- ✅ Logs mostram completo (não silencioso)

**DevOps:**
- ✅ LP acessível em https://resetprimal.com.br
- ✅ E-book acessível em https://resetprimal.com.br/ebook
- ✅ Webhook respondendo em /webhook/hotmart
- ✅ SSL válido (sem avisos)
- ✅ PM2 mantendo webhook rodando

**Product Manager:**
- ✅ Todas credenciais obtidas e validadas
- ✅ .env distribuído com sucesso
- ✅ Equipe sincronizada e alinhada
- ✅ Timeline cumprida
- ✅ Teste completo agendado

---

## ⚠️ ESCALAÇÃO DE BLOQUEADORES

**Se alguém ficar bloqueado:**

1. **Comunicar IMEDIATAMENTE** no canal #reset-primal
2. **Identifique a dependência:**
   - Frontend bloqueado por Product? → PM prioriza credenciais
   - Backend bloqueado por Frontend? → Frontend faz push urgente
   - DevOps bloqueado por Backend? → Backend envia código para teste
3. **Escalação:**
   - Primeiro nível: Comunicar ao PM
   - Segundo nível: PM ativa outro time member
   - Terceiro nível: PM bloqueia progresso e marca reunião

**Nada deve ser surpresa** - comunicar problemas antecipadamente!

---

## 📞 CONTATOS IMPORTANTES

- **Product Manager:** _________________ (Slack/Email)
- **Frontend Dev:** _________________ (Slack/Email)
- **Backend Dev:** _________________ (Slack/Email)
- **DevOps:** _________________ (Slack/Email)
- **Backup (se alguém sair):** _________________ (Slack/Email)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Hoje 10am:** Compartilhar este documento com toda equipe
2. ✅ **Hoje 10:15am:** Reunião kick-off (15 minutos)
3. ✅ **Hoje 10:30am:** Cada pessoa começa sua tarefa
4. ✅ **Hoje 1:00pm:** First sync entre Frontend + Backend
5. ✅ **Hoje 1:30pm:** Second sync entre Backend + DevOps
6. ✅ **Hoje 5:00pm:** Reunião final - status completo
7. ✅ **Amanhã 9am:** Demo de tudo funcionando
8. ✅ **Amanhã 11am:** Teste fluxo completo ponta a ponta
9. ✅ **Amanhã 2pm:** Checklist final + go/no-go
10. ✅ **Amanhã 3pm:** LANÇAMENTO (se GO)

---

**Criado:** 27 de janeiro de 2026  
**Status:** Pronto para implementação  
**Total de horas:** ~10 horas distribuídas  
**Timeline:** Hoje + Amanhã (2 dias)

Boa sorte! 🚀

— Morgan, planejando o futuro 📊