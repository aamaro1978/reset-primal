# 📡 API & Webhook Reference - Reset Primal

**Versão:** 1.0
**Data:** 2025-01-27
**Status:** Production Ready

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints](#endpoints)
3. [Webhook Hotmart](#webhook-hotmart)
4. [Exemplos cURL](#exemplos-curl)
5. [Códigos de Erro](#códigos-de-erro)
6. [Segurança (HMAC-SHA256)](#segurança-hmac-sha256)
7. [Logs & Debugging](#logs--debugging)

---

## Visão Geral

A aplicação Reset Primal expõe 2 endpoints principais:

| Endpoint | Método | Propósito | Autenticação |
|----------|--------|-----------|--------------|
| `/health` | GET | Verificar status do servidor | Nenhuma |
| `/webhook/hotmart` | POST | Receber eventos de compra | HMAC-SHA256 |

**URL Base:** `https://resetprimal.com.br`
**Porta Local:** `3000`
**Stack:** Node.js + Express.js + Nodemailer

---

## Endpoints

### 1. GET /health

Verifica se o webhook está online e respondendo.

**Request:**
```bash
GET /health HTTP/1.1
Host: resetprimal.com.br
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T18:30:45.123Z"
}
```

**Uso:**
```bash
curl -I https://resetprimal.com.br/health
```

**Quando usar:**
- Monitoramento 24/7 (UptimeRobot, Pingdom, etc)
- Verificação antes de realizar testes
- Debugging de conectividade

---

### 2. POST /webhook/hotmart

Recebe notificações de compra do Hotmart. **Requer assinatura válida**.

**Request Headers:**
```
Content-Type: application/json
x-hotmart-signature: {HMAC-SHA256 hash}
```

**Request Body (PURCHASE_COMPLETE):**
```json
{
  "type": "PURCHASE_COMPLETE",
  "data": {
    "buyer": {
      "email": "cliente@example.com",
      "name": "João Silva",
      "phone": "+55 11 98765-4321",
      "document": "12345678901"
    },
    "purchase": {
      "id": "PURCHASE_ABC123XYZ",
      "product_id": "PROD_RESETPRIMAL_001",
      "price": 97.00,
      "status": "completed",
      "created_at": "2025-01-27T18:00:00Z"
    }
  }
}
```

**Request Body (PURCHASE_APPROVED):**
```json
{
  "type": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "cliente@example.com",
      "name": "Maria Santos"
    },
    "purchase": {
      "id": "PURCHASE_DEF456UVW",
      "product_id": "PROD_RESETPRIMAL_001",
      "price": 197.00,
      "status": "approved"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid signature"
}
```

**Response (500 Server Error):**
```json
{
  "error": "Error message describing the issue"
}
```

---

## Webhook Hotmart

### Configuração no Hotmart

1. **URL:** `https://resetprimal.com.br/webhook/hotmart`
2. **Eventos para habilitar:**
   - ✅ PURCHASE_COMPLETE
   - ✅ PURCHASE_APPROVED
3. **Secret:** Gere e salve em `.env` como `HOTMART_WEBHOOK_SECRET`

### Fluxo de Processamento

Quando uma compra é recebida:

```
1. POST /webhook/hotmart chega
   ↓
2. Validar assinatura HMAC-SHA256
   ↓
3. ✅ Válida → Processar compra
   ❌ Inválida → Retornar 401
   ↓
4. Se VALID, executar em paralelo:
   ├─ Salvar em logs/webhook-hotmart.log
   ├─ Enviar email com e-book via Gmail
   ├─ Registrar conversão em GA4
   └─ Registrar conversão no Facebook Pixel
   ↓
5. Retornar 200 OK ao Hotmart
```

### Dados Processados

**Salvos em arquivo:**
```json
{
  "timestamp": "2025-01-27T18:30:45.123Z",
  "buyer_email": "cliente@example.com",
  "buyer_name": "João Silva",
  "purchase_id": "PURCHASE_ABC123XYZ",
  "amount": 97.00,
  "status": "completed"
}
```

**Email enviado para:** buyer.email
**GA4 event:** purchase (com valor em BRL)
**Facebook event:** Purchase (com email hasheado em SHA256)

---

## Exemplos cURL

### Teste 1: Health Check

```bash
# Local
curl http://localhost:3000/health

# Produção
curl https://resetprimal.com.br/health
```

**Esperado:**
```json
{"status":"ok","timestamp":"2025-01-27T18:30:45.123Z"}
```

### Teste 2: Webhook com Signature Inválida

```bash
# Isso deve retornar 401
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: invalid_signature_here" \
  -d '{"type":"PURCHASE_COMPLETE","data":{"buyer":{"email":"test@example.com"}}}'
```

**Esperado:**
```json
{"error":"Invalid signature"}
```

### Teste 3: Webhook com Signature Válida (Simulado)

Para testar com signature válida, você precisa:

1. Gerar HMAC-SHA256 do payload
2. Usar a secret real do Hotmart

```bash
# Script para gerar signature válida
node -e "
const crypto = require('crypto');
const secret = process.env.HOTMART_WEBHOOK_SECRET || 'test-secret';
const payload = JSON.stringify({
  type: 'PURCHASE_COMPLETE',
  data: {
    buyer: {
      email: 'test@example.com',
      name: 'Test User'
    },
    purchase: {
      id: 'TEST123',
      product_id: 'PROD_001',
      price: 97,
      status: 'completed'
    }
  }
});

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('HMAC-SHA256:', signature);
console.log('Payload:', payload);
"
```

### Teste 4: Webhook Real (após obter signature)

```bash
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: abc123def456..." \
  -d '{
    "type": "PURCHASE_COMPLETE",
    "data": {
      "buyer": {
        "email": "cliente@example.com",
        "name": "João Silva"
      },
      "purchase": {
        "id": "PURCHASE_123",
        "product_id": "PROD_RESETPRIMAL",
        "price": 97.00,
        "status": "completed"
      }
    }
  }'
```

---

## Códigos de Erro

| HTTP | Erro | Significado | Solução |
|------|------|-------------|---------|
| 200 | OK | Processado com sucesso | ✅ Nada a fazer |
| 400 | Bad Request | JSON mal formatado | Verificar payload JSON |
| 401 | Unauthorized | Signature inválida | Verificar `HOTMART_WEBHOOK_SECRET` |
| 500 | Server Error | Erro interno do servidor | Verificar logs do PM2 |

### Erro 401: Invalid Signature

**Causa mais comum:** `HOTMART_WEBHOOK_SECRET` incorreto

**Verificar no servidor:**
```bash
grep "HOTMART_WEBHOOK_SECRET" /var/www/reset-primal/.env
```

**Se estiver vazio ou incorreto:**
```bash
# Editar arquivo
nano /var/www/reset-primal/.env

# Atualizar linha:
# HOTMART_WEBHOOK_SECRET=seu_secret_do_hotmart_aqui

# Salvar: Ctrl+X → Y → Enter

# Restart webhook
pm2 restart hotmart-webhook
```

### Erro 500: Server Error

**Causas possíveis:**
- Email não pode ser enviado (credenciais Gmail erradas)
- GA4 API secret inválido
- Facebook token inválido
- Diretório de logs não existe

**Verificar logs:**
```bash
pm2 logs hotmart-webhook --lines 50
```

---

## Segurança (HMAC-SHA256)

### Como Funciona

HMAC-SHA256 garante que o webhook recebido é realmente do Hotmart, não de um invasor.

**Processo:**

```
Hotmart:
  secret = "sua_secret_do_hotmart"
  payload = JSON completo
  signature = HMAC-SHA256(payload, secret)
  Enviar signature no header: x-hotmart-signature

Reset Primal (webhook):
  Recebe signature no header
  Recalcula: hmac = HMAC-SHA256(payload recebido, secret local)
  Se hmac === signature → Válido ✅
  Se hmac !== signature → Rejeitado ❌
```

### Implementação

Código no `api/webhook-hotmart.js`:

```javascript
function verifyHotmartSignature(body, signature) {
    const computedSignature = crypto
        .createHmac('sha256', HOTMART_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

    return computedSignature === signature;
}

app.post('/webhook/hotmart', async (req, res) => {
    const signature = req.headers['x-hotmart-signature'];

    if (!verifyHotmartSignature(req.body, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Processar compra...
});
```

### Boas Práticas

✅ **Fazer:**
- Guardar secret em variável de ambiente (`.env`)
- Validar TODA requisição POST
- Usar JSON.stringify() exatamente como Hotmart usa
- Logar tentativas falhadas (debugging)

❌ **NÃO fazer:**
- Hardcoded secret no código
- Confiar em IP do Hotmart (pode ser spoofado)
- Aceitar webhook sem validação
- Expor secret em logs públicos

---

## Logs & Debugging

### Localização dos Logs

**Webhook:**
```bash
# Arquivo de log (JSON lines format)
/var/www/reset-primal/logs/webhook-hotmart.log

# Em tempo real (via PM2)
pm2 logs hotmart-webhook
```

**Nginx:**
```bash
# Errors
sudo tail -f /var/log/nginx/error.log

# Access (requisições recebidas)
sudo tail -f /var/log/nginx/access.log
```

### Formato do Log

Cada compra registra uma linha JSON:

```json
{"timestamp":"2025-01-27T18:30:45.123Z","buyer_email":"cliente@example.com","buyer_name":"João Silva","purchase_id":"PURCHASE_123","amount":97.00,"status":"completed"}
{"timestamp":"2025-01-27T18:35:12.456Z","buyer_email":"maria@example.com","buyer_name":"Maria Santos","purchase_id":"PURCHASE_456","amount":197.00,"status":"completed"}
```

### Exemplo: Rastreando uma Compra Específica

```bash
# Buscar por email
grep "cliente@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Buscar por valor
grep "197.00" /var/www/reset-primal/logs/webhook-hotmart.log

# Ver últimas 10 compras
tail -10 /var/www/reset-primal/logs/webhook-hotmart.log | jq .
```

### Debugging: Webhook não recebe POST

```bash
# 1. Verificar se webhook está rodando
pm2 status

# 2. Testar health endpoint
curl https://resetprimal.com.br/health

# 3. Ver se há erros nos logs
pm2 logs hotmart-webhook --lines 50

# 4. Verificar se Nginx está redirecionando corretamente
curl -v https://resetprimal.com.br/webhook/hotmart

# 5. Verificar firewall
sudo ufw status
# Deve ter: 80/tcp ALLOW e 443/tcp ALLOW
```

### Debugging: Assinatura Inválida (401)

```bash
# 1. Verificar secret está correto
grep "HOTMART_WEBHOOK_SECRET" /var/www/reset-primal/.env

# 2. Testar com Node.js interativo
node -e "
require('dotenv').config();
const crypto = require('crypto');

const secret = process.env.HOTMART_WEBHOOK_SECRET;
const payload = '{\"type\":\"TEST\"}';
const sig = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Secret:', secret.substring(0, 10) + '...');
console.log('Signature:', sig);
"

# 3. Comparar com signature do Hotmart
```

---

## Resumo das Integrações

### 1. Email (Nodemailer + Gmail)

**Configuração:**
- `GMAIL_USER`: seu email (ex: seu-email@gmail.com)
- `GMAIL_PASSWORD`: app-specific password (16 chars)

**Template:**
```
Subject: 🎉 Seu E-book Reset Primal está pronto! - Link de acesso
Body: HTML com link para download do e-book
```

**Teste:**
```bash
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: 'seu-email@example.com',
  subject: 'Teste Email Reset Primal',
  html: '<h1>Teste</h1><p>Se recebeu, email está funcionando!</p>'
}, (err, info) => {
  if (err) console.error('ERRO:', err);
  else console.log('✅ EMAIL ENVIADO');
});
"
```

### 2. Google Analytics 4 (GA4)

**Endpoint:** `https://www.google-analytics.com/mp/collect`

**Parâmetros:**
- `measurement_id`: ID da propriedade (G-XXXXXXXXXX)
- `api_secret`: Secret do GA4 (em .env)

**Evento enviado:**
```json
{
  "name": "purchase",
  "params": {
    "value": 97.00,
    "currency": "BRL",
    "transaction_id": "1234567890"
  }
}
```

**Verificar no GA4:**
1. Acessar https://analytics.google.com
2. Reset Primal → Real-time
3. Procurar por evento "purchase"

### 3. Facebook Pixel

**Endpoint:** `https://graph.facebook.com/v18.0/{PIXEL_ID}/events`

**Parâmetros:**
- `data[0].event_name`: "Purchase"
- `data[0].user_data.em`: Email hasheado em SHA256
- `access_token`: Token de acesso do Pixel

**Verificar no Facebook:**
1. Acessar https://business.facebook.com
2. Events Manager
3. Seu Pixel → Eventos recentes

---

## Checklist de Integração

- [ ] Webhook configurado em `app.hotmart.com`
- [ ] URL webhook: `https://resetprimal.com.br/webhook/hotmart`
- [ ] Eventos habilitados: PURCHASE_COMPLETE + PURCHASE_APPROVED
- [ ] Secret copiado e salvo em `.env`
- [ ] Gmail app-specific password configurado
- [ ] GA4 ID preenchido em `.env`
- [ ] GA4 API secret preenchido em `.env`
- [ ] Facebook Pixel ID preenchido em `.env`
- [ ] Facebook token preenchido em `.env`
- [ ] `.env` salvo no servidor
- [ ] Webhook reiniciado: `pm2 restart hotmart-webhook`
- [ ] Teste de compra realizado em sandbox
- [ ] Email recebido? ✅
- [ ] GA4 rastreou? ✅
- [ ] Facebook rastreou? ✅

---

## Links Úteis

**Configuração:**
- [CREDENTIALS-SETUP.md](./CREDENTIALS-SETUP.md) - Passo a passo das credenciais
- [DEPLOY-INSTRUCOES-FINAIS.md](./DEPLOY-INSTRUCOES-FINAIS.md) - Deploy completo

**Troubleshooting:**
- [TROUBLESHOOTING-PRODUCAO.md](./TROUBLESHOOTING-PRODUCAO.md) - Erros comuns

**Monitoramento:**
- [OPERATIONAL-PROCEDURES.md](./OPERATIONAL-PROCEDURES.md) - Procedimentos diários

---

**Versão:** 1.0
**Mantido por:** Reset Primal Team
**Última atualização:** 2025-01-27
