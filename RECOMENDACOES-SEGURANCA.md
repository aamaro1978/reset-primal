# 🔐 RECOMENDAÇÕES DE SEGURANÇA - Reset Primal

**Data:** 28 de janeiro de 2026
**Status:** ⚠️ CRÍTICO - Implementar ANTES do lançamento

---

## 📋 CHECKLIST DE SEGURANÇA (IMPLEMENTAÇÃO)

### Fase 1: CRÍTICA (Fazer HOJE)
- [ ] Substituir `webhook-hotmart.js` pela versão corrigida
- [ ] Implementar validação de ENV com `validate-env.sh`
- [ ] Usar SendGrid em vez de Gmail
- [ ] Adicionar timingSafeEqual para comparação HMAC
- [ ] Rate limiting no webhook
- [ ] Validar assinatura ANTES de processar

### Fase 2: ALTA (Esta Semana)
- [ ] CORS configurado corretamente
- [ ] HTTPS/TLS obrigatório
- [ ] Logging seguro (sem dados sensíveis)
- [ ] Backup de banco de dados
- [ ] Monitoramento ativo
- [ ] Plano de incident response

### Fase 3: MÉDIA (Este Mês)
- [ ] Testes de penetração
- [ ] Code review por terceiros
- [ ] Auditoria de permissões
- [ ] Documentação de segurança
- [ ] Treinamento da equipe
- [ ] Rotação de secrets

---

## 🔐 SEGURANÇA DO WEBHOOK

### 1. VALIDAÇÃO DE ASSINATURA (CRÍTICA)

❌ **ANTES (vulnerável):**
```javascript
return computedSignature === signature; // Timing attack!
```

✅ **DEPOIS (seguro):**
```javascript
return crypto.timingSafeEqual(
  Buffer.from(computedSignature),
  Buffer.from(signature)
);
```

**Por quê?** A comparação com `===` leva o mesmo tempo independente de quantos caracteres correspondem. Um atacante pode medir o tempo para saber quando está "quase certo".

### 2. VALIDAR HEADER DE ASSINATURA (CRÍTICA)

❌ **ANTES (vulnerável):**
```javascript
const signature = req.headers['x-hotmart-signature'];
if (!verifyHotmartSignature(req.body, signature)) { // Se signature = undefined?
```

✅ **DEPOIS (seguro):**
```javascript
const signature = req.headers['x-hotmart-signature'];
if (!signature || !verifyHotmartSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### 3. NÃO LOGAR DADOS SENSÍVEIS

❌ **ANTES (vazamento):**
```javascript
console.log('[WEBHOOK] Recebido:', req.body); // ❌ Loga email, CPF, tudo!
```

✅ **DEPOIS (seguro):**
```javascript
logEvent('info', 'purchase_received', {
    buyer_domain: buyer.email.split('@')[1], // Apenas domínio
    purchase_id: purchase.id,
    amount: purchase.price
});
```

### 4. RATE LIMITING

✅ **IMPLEMENTAR:**
```javascript
const requestCache = new Map();
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000 // 1 minuto
};

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  // ... verificar se IP excedeu limite
}

app.use(rateLimitMiddleware);
```

**Benefícios:**
- Protege contra brute force
- Protege contra DDoS
- Reduz custos de infraestrutura

---

## 🔑 GERENCIAMENTO DE SEGREDOS

### 1. NÃO COMMITAR .env

✅ **Adicionar ao .gitignore:**
```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production
```

**Verificar:**
```bash
git ls-files | grep -i env # Não deve mostrar nada!
```

### 2. REGENERAR SECRETS COMPROMETIDOS

Se qualquer secret vazar:

```bash
# 1. Gerar novo secret no Hotmart
# 2. Atualizar .env localmente
# 3. Atualizar em servidor
# 4. Testar webhook
# 5. Comunicar à equipe

# NÃO FAZER PUSH com secret comprometido!
```

### 3. DIFERENTES SECRETS POR AMBIENTE

```
.env.development   → para localhost
.env.staging       → para servidor de teste
.env.production    → para produção
```

**Nunca usar os mesmos secrets em diferentes ambientes!**

### 4. ROTAÇÃO DE SECRETS (TRIMESTRAL)

```bash
# A cada 3 meses:
# 1. SendGrid - gerar nova API key
# 2. Hotmart - regenerar webhook secret
# 3. Google Analytics - renovar credentials
# 4. Facebook - renovar access token
# 5. Telegram - criar novo bot
```

---

## 📧 EMAIL - SENDGRID vs GMAIL

### Por que SendGrid é melhor:

| Aspecto | Gmail | SendGrid |
|--------|-------|----------|
| Autenticação | App Password (deprecated) | API Key |
| Entregabilidade | 💔 Baixa | ✅ Excelente |
| Segurança | ⚠️ Média | ✅ Alta |
| Escalabilidade | ❌ Limitado | ✅ Sem limite |
| Suporte | 🤷 Comunidade | ✅ Profissional |
| Custo | 💰 Gratuito | 💲 Barato (primeiros 100 free) |

### Setup SendGrid Correto:

```bash
# 1. Criar conta: sendgrid.com
# 2. Verificar domínio (DKIM/SPF)
# 3. Gerar API Key (Mail Send permission)
# 4. Adicionar ao .env:
SENDGRID_API_KEY=SG.abc123...
SENDGRID_FROM_EMAIL=noreply@suaempresa.com
```

### Validação de DKIM/SPF:

```bash
# Verificar SPF
dig suaempresa.com txt | grep v=spf1

# Verificar DKIM
dig default._domainkey.suaempresa.com txt

# Verificar DMARC
dig _dmarc.suaempresa.com txt
```

---

## 🌐 CORS e HTTPS

### 1. CORS Seguro

✅ **Implementar:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://resetprimal.com.br', 'https://www.resetprimal.com.br'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-hotmart-signature']
}));
```

❌ **NÃO FAZER:**
```javascript
app.use(cors()); // ❌ Permite qualquer origem!
```

### 2. HTTPS OBRIGATÓRIO

```bash
# No Nginx (nginx-reset-primal.conf):
server {
    listen 80;
    server_name resetprimal.com.br;
    return 301 https://$server_name$request_uri; # Redirecionar HTTP → HTTPS
}

server {
    listen 443 ssl http2;
    server_name resetprimal.com.br;
    ssl_certificate /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resetprimal.com.br/privkey.pem;
    ...
}
```

### 3. Security Headers

```bash
# No Nginx:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer" always;
```

---

## 📊 GOOGLE ANALYTICS 4 - SETUP CORRETO

### 1. Measurement ID

```bash
# Obter em: GA4 > Admin > Propriedade > Detalhes da Propriedade
# Formato: G-XXXXXXXXXX (11 caracteres)
GOOGLE_ANALYTICS_PROPERTY_ID=G-1A2B3C4D5E6
```

### 2. API Secret (Para Server-Side)

```bash
# Obter em: GA4 > Admin > Data Streams > Web > Measurement Protocol API Secrets
# Clicar em "Criar" e copiar o secret
GOOGLE_ANALYTICS_API_SECRET=seu_secret_aqui
```

### 3. Query String CORRETA

✅ **CORRETO:**
```javascript
const params = new URLSearchParams({
    measurement_id: GA_MEASUREMENT_ID,
    api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET
});
const url = `https://www.google-analytics.com/mp/collect?${params}`;
```

❌ **ERRADO:**
```javascript
// Isto NÃO funciona:
qs: {
    measurement_id: GA_MEASUREMENT_ID
}
```

---

## 📱 FACEBOOK PIXEL - SETUP CORRETO

### 1. Pixel ID

```bash
# Obter em: Facebook Business Manager > Events Manager > Pixel ID
# Formato: número como 123456789012345
FACEBOOK_PIXEL_ID=123456789012345
```

### 2. Access Token (Server-Side)

```bash
# Para rastreamento server-side (mais confiável):
# 1. Facebook Business Manager > Settings > Users
# 2. Gerar novo token com permissão "ads_management"
FACEBOOK_PIXEL_TOKEN=EAAxxxxx...
```

### 3. Conversão Correta

```javascript
// Hash do email com SHA-256
const hashedEmail = crypto.createHash('sha256')
    .update(email.toLowerCase())
    .digest('hex');

// Enviar para Facebook
fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events`, {
    method: 'POST',
    body: JSON.stringify({
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
                em: hashedEmail // Email hashado!
            }
        }],
        access_token: FACEBOOK_TOKEN
    })
});
```

---

## 📞 TELEGRAM - NOTIFICAÇÕES

### 1. Criar Bot

```bash
# Conversar com @BotFather no Telegram
# Comando: /newbot
# Nomear bot: ResetPrimalBot
# Copiar token: 123456789:ABCDefGHIjklMNOPqrst_UVWXYZ
TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIjklMNOPqrst_UVWXYZ
```

### 2. Obter Chat ID

```bash
# Enviar qualquer mensagem para seu bot no Telegram
curl https://api.telegram.org/bot{TOKEN}/getUpdates

# Procurar por: "chat":{"id":12345678
TELEGRAM_CHAT_ID=12345678
```

### 3. Usar para Notificações

```javascript
async function notifyTelegram(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    });
}

// Usar:
await notifyTelegram('🚨 Erro crítico no webhook!');
```

---

## 🔍 AUDITORIA E MONITORAMENTO

### 1. Verificar se Secrets Vazaram

```bash
# Instalar git-secrets
brew install git-secrets

# Configurar:
git secrets --install
git secrets --register-aws

# Testar:
git secrets --scan
```

### 2. Monitorar Logs

```bash
# Ver últimas compras:
tail -f logs/webhook-hotmart.log | grep purchase_received

# Ver erros:
tail -f logs/webhook-hotmart.log | grep error
```

### 3. Health Check

```bash
# Executar regularmente:
bash scripts/health-check.sh

# Adicionar a cron:
*/5 * * * * /path/to/health-check.sh
```

---

## 🆘 INCIDENT RESPONSE

Se houver vazamento de secrets:

### 1. IMMEDIATELY (primeiros 5 minutos):
```bash
# 1. Parar servidor
pm2 stop all

# 2. Regenerar secrets
# - Hotmart: nova webhook secret
# - SendGrid: nova API key
# - GA4: novo API secret
# - Facebook: novo token
```

### 2. IMMEDIATELY (próximos 30 minutos):
```bash
# 3. Atualizar .env
# 4. Fazer deploy novo
# 5. Comunicar à equipe

pm2 start ecosystem.config.js
```

### 3. SHORT TERM (próximas 24h):
```bash
# 6. Revisar logs por atividade suspeita
# 7. Fazer audit de todas as transações
# 8. Notificar Hotmart/SendGrid se necessário
```

---

## ✅ CHECKLIST PRÉ-LANÇAMENTO

- [ ] Todos secrets regenerados (não reutilizados)
- [ ] .env não está no Git
- [ ] HTTPS ativado com certificado válido
- [ ] Rate limiting ativado
- [ ] Logging seguro (sem dados sensíveis)
- [ ] HMAC com timingSafeEqual
- [ ] SendGrid testado e funcionando
- [ ] GA4 tracking confirmado
- [ ] Facebook Pixel confirmado
- [ ] Backup de banco de dados automático
- [ ] Health check em cron
- [ ] Monitoramento ativo
- [ ] Plano de rollback documentado
- [ ] Equipe treinada em segurança

---

## 📚 REFERÊNCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Hotmart Webhook Docs](https://developers.hotmart.com/docs/api-rest/)
- [SendGrid API Docs](https://docs.sendgrid.com/api-reference/)

