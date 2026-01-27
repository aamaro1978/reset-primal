# CONFIGURAÇÃO DE WEBHOOKS HOTMART
## Reset Primal - Receber Notificações de Vendas

**Status:** CRÍTICO - Implementar ANTES do lançamento  
**Impacto:** Sem webhook, você não sabe quando alguém comprou  
**Tempo:** ~30 minutos para setup + teste  

---

## 1. O QUE É WEBHOOK?

**Webhook = URL que Hotmart chama quando evento acontece**

### Fluxo Normal (você verifica Hotmart)
```
Cliente compra → Você entra em Hotmart → Vê que vendeu
❌ Lento, reativo
```

### Fluxo com Webhook (automático)
```
Cliente compra → Hotmart dispara POST → Sua URL
                       ↓
            Seu servidor recebe JSON
                       ↓
            Registra venda em BD
                       ↓
            Envia email com e-book
                       ↓
            Notifica você em Telegram/Slack
✅ Automático, reativo, confiável
```

---

## 2. PASSO 1: GERAR WEBHOOK NO HOTMART

### 2.1 Acessar Painel de Webhooks

1. Acesse: https://app.hotmart.com
2. Clique no **menu ☰** (topo esquerdo)
3. Procure por: **Webhooks** (pode estar em "Configurações" ou "Integrações")
4. Ou acesse direto: https://app.hotmart.com/webhooks

### 2.2 Criar Novo Webhook

**Botão:** "Novo Webhook" ou "Adicionar Webhook"

Será solicitado:

#### Campo 1: **Nome**
```
Reset Primal - Notificação de Vendas
```

#### Campo 2: **URL**
```
https://resetprimal.com.br/webhook/hotmart
```

⚠️ **CRÍTICO:** 
- Deve ser HTTPS (seguro)
- Deve ser seu domínio REAL (não localhost)
- Deve estar acessível publicamente

#### Campo 3: **Eventos**
Marque APENAS estes:
```
☑ Venda Realizada (sale.completed)
☑ Reembolso (sale.refund)
☑ Chargeback (sale.chargeback)
☐ Assinatura Criada
☐ Assinatura Cancelada
☐ Chargeback Resolvido
```

#### Campo 4: **Token / Secret (será gerado)**

Hotmart vai gerar um token automático. Você precisa:
1. Copiar este token
2. Colar em `.env` como `HOTMART_WEBHOOK_SECRET=seu_token`

**Exemplo:**
```
HOTMART_WEBHOOK_SECRET=abc123def456ghi789jkl000mnopqr
```

### 2.3 Salvar

Clique em **"Salvar"** ou **"Criar"**

---

## 3. PASSO 2: PREPARAR SEU SERVIDOR

### 3.1 Endpoint no Node.js/Express (Exemplo)

Se seu servidor é Node.js, crie este arquivo:

**`server.js` ou `api/webhook.js`:**

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(express.json());

// Variáveis de ambiente
const HOTMART_WEBHOOK_SECRET = process.env.HOTMART_WEBHOOK_SECRET;
const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════
// ENDPOINT WEBHOOK
// ════════════════════════════════════════════
app.post('/webhook/hotmart', async (req, res) => {
  try {
    // PASSO 1: Validar autenticidade (token)
    const signature = req.headers['x-hotmart-signature'] || 
                      req.headers['x-hotr-signature'];
    
    if (!validateSignature(req.body, signature)) {
      console.warn('⚠️  Webhook signature inválida!');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // PASSO 2: Extrair dados
    const event = req.body;
    console.log('✅ Webhook recebido:', event);

    // PASSO 3: Processar evento
    if (event.status === 'completed') {
      // Venda bem-sucedida
      const buyer = event.buyer;
      const saleId = event.sale?.id;
      const price = event.sale?.price;

      console.log(`💰 Nova venda! Comprador: ${buyer.email}, ID: ${saleId}`);

      // TODO: Adicionar ao banco de dados
      // TODO: Enviar email com link do e-book
      // TODO: Notificar em Telegram/Slack

      // Responder ao Hotmart com sucesso
      return res.status(200).json({ 
        status: 'received',
        message: 'Webhook processado com sucesso'
      });
    }

    if (event.status === 'refunded') {
      // Reembolso
      console.log(`❌ Reembolso: ${event.sale?.id}`);
      // TODO: Remover acesso ao e-book?
      return res.status(200).json({ status: 'received' });
    }

    // Responder ok para qualquer outro evento
    res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ════════════════════════════════════════════
// FUNÇÃO: Validar assinatura
// ════════════════════════════════════════════
function validateSignature(body, signature) {
  if (!signature || !HOTMART_WEBHOOK_SECRET) {
    return false;
  }

  // Hotmart envia signature como SHA-256 do body + secret
  const payload = JSON.stringify(body);
  const hash = crypto
    .createHmac('sha256', HOTMART_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

// ════════════════════════════════════════════
// INICIAR SERVIDOR
// ════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Webhook em http://localhost:${PORT}/webhook/hotmart`);
});

module.exports = app;
```

### 3.2 Alternativa: Python/Flask

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import json
import os

app = Flask(__name__)
HOTMART_WEBHOOK_SECRET = os.getenv('HOTMART_WEBHOOK_SECRET')

@app.route('/webhook/hotmart', methods=['POST'])
def webhook_hotmart():
    try:
        # Validar assinatura
        signature = request.headers.get('X-Hotmart-Signature', '')
        payload = request.get_data()
        
        expected_sig = hmac.new(
            HOTMART_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if signature != expected_sig:
            return {'error': 'Invalid signature'}, 401

        # Processar evento
        event = request.get_json()
        print(f'✅ Venda recebida: {event}')

        if event.get('status') == 'completed':
            buyer_email = event.get('buyer', {}).get('email')
            sale_id = event.get('sale', {}).get('id')
            
            # TODO: Registrar em BD
            # TODO: Enviar e-book
            
        return {'status': 'received'}, 200

    except Exception as e:
        print(f'❌ Erro: {e}')
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

### 3.3 Alternativa: PHP

```php
<?php
// webhook.php

$HOTMART_WEBHOOK_SECRET = getenv('HOTMART_WEBHOOK_SECRET');

// Receber dados brutos
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_HOTMART_SIGNATURE'] ?? '';

// Validar
$expected = hash_hmac('sha256', $payload, $HOTMART_WEBHOOK_SECRET);
if ($signature !== $expected) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Processar
$event = json_decode($payload, true);
error_log('✅ Webhook: ' . json_encode($event));

if ($event['status'] === 'completed') {
    $email = $event['buyer']['email'];
    $sale_id = $event['sale']['id'];
    
    // TODO: Registrar em BD
    // TODO: Enviar e-book
}

http_response_code(200);
echo json_encode(['status' => 'received']);
```

---

## 4. PASSO 3: FAZER DEPLOY

### 4.1 Servidor Já Rodando?

Se você já tem servidor rodando em `https://resetprimal.com.br`:

1. Upload do arquivo webhook para seu servidor
2. Restart do aplicação/servidor
3. Teste (ver passo 5)

### 4.2 Sem Servidor Ainda?

**Opções rápidas:**

**A) Heroku (Gratuito até 550h/mês)**
```bash
# Instalar CLI
npm install -g heroku-cli

# Login
heroku login

# Deploy
heroku create reset-primal-webhook
git push heroku main

# URL será: https://reset-primal-webhook.herokuapp.com/webhook/hotmart
```

**B) Render (Gratuito com limites)**
- https://render.com
- Conecta com GitHub
- Deploy automático

**C) Railway (Gratuito $5/mês)**
- https://railway.app
- Deploy fácil via GitHub

**D) LocalTunnel (teste local)**
```bash
# Instalar
npm install -g localtunnel

# Rodar seu servidor local (porta 3000)
npm start

# Criar túnel
lt --port 3000
# Saída: https://xyz123.loca.lt

# Usar em Hotmart: https://xyz123.loca.lt/webhook/hotmart
```

---

## 5. PASSO 4: TESTAR WEBHOOK

### 5.1 Teste no Painel Hotmart

1. Acesse: https://app.hotmart.com/webhooks
2. Localize seu webhook
3. Clique em **"Enviar Teste"** ou **"Test Webhook"**
4. Hotmart envia um evento de teste para sua URL

**Resultado esperado:**
```
Status: 200 OK
✅ Webhook recebido com sucesso
```

**Se não funcionar:**
- [ ] URL está correta? (`https://resetprimal.com.br/webhook/hotmart`)
- [ ] Servidor está rodando?
- [ ] HTTPS está ativo?
- [ ] Firewall permite conexão?
- [ ] Código retorna HTTP 200?

### 5.2 Teste com Compra Real (Opcional)

Você pode fazer uma compra simulada:

1. Acesse seu produto no Hotmart
2. Use cartão de teste: `4111 1111 1111 1111` (MasterCard teste)
3. Complete compra
4. Webhook dispara automaticamente
5. Verifique logs

---

## 6. MONITORAR WEBHOOKS

### 6.1 Ver Histórico de Webhooks

No painel Hotmart:
1. Webhooks → Seu webhook
2. Aba: **"Histórico"** ou **"Logs"**

Mostra:
- ✅ Webhooks enviados com sucesso
- ❌ Webhooks com erro
- Hora e dados enviados

### 6.2 Adicionar Logs

**Node.js:**
```javascript
console.log(`[${new Date().toISOString()}] ✅ Webhook: ${event.status}`);

// Ou salvar em arquivo
const fs = require('fs');
fs.appendFileSync('logs/webhooks.log', 
  `${new Date().toISOString()} - ${event.status}\n`
);
```

**Python:**
```python
import logging
logging.basicConfig(filename='webhooks.log', level=logging.INFO)
logging.info(f'Webhook: {event}')
```

---

## 7. ESTRUTURA DE DADOS RECEBIDA

### 7.1 Evento: Venda Bem-Sucedida

```json
{
  "event_id": "evt_123abc",
  "event_type": "sale.completed",
  "status": "completed",
  "created_at": "2026-01-27T14:30:00Z",
  
  "buyer": {
    "id": "buyer_123",
    "email": "cliente@email.com",
    "name": "João Silva",
    "document": "12345678901",
    "phone": "11999999999"
  },
  
  "sale": {
    "id": "sale_abc123xyz",
    "code": "ABC123XYZ",
    "status": "completed",
    "price": 97.00,
    "currency": "BRL",
    "payment_method": "credit_card",
    "date": "2026-01-27T14:30:00Z"
  },
  
  "product": {
    "id": "prod_reset_primal",
    "name": "Reset Primal",
    "price": 97.00
  },
  
  "affiliate": {
    "id": "aff_123",
    "name": "Seu Nome",
    "commission": 0
  }
}
```

### 7.2 Evento: Reembolso

```json
{
  "event_type": "sale.refund",
  "status": "refunded",
  "reason": "requested_by_buyer",
  "sale": { "id": "sale_abc123xyz" },
  "refund_date": "2026-01-28T10:00:00Z"
}
```

### 7.3 Evento: Chargeback

```json
{
  "event_type": "sale.chargeback",
  "status": "chargeback",
  "sale": { "id": "sale_abc123xyz" },
  "chargeback_date": "2026-02-05T14:30:00Z"
}
```

---

## 8. O QUE FAZER COM OS DADOS

### 8.1 Salvar em Banco de Dados

```javascript
// Exemplo: MongoDB
const db = require('./db');

async function procesarVenda(event) {
  const venda = {
    hotmart_id: event.sale.id,
    comprador_email: event.buyer.email,
    comprador_nome: event.buyer.name,
    comprador_cpf: event.buyer.document,
    valor: event.sale.price,
    data_compra: event.sale.date,
    metodo_pagamento: event.sale.payment_method,
    status: event.status,
    criado_em: new Date()
  };
  
  await db.vendas.insertOne(venda);
  console.log(`✅ Venda salva: ${venda.hotmart_id}`);
}
```

### 8.2 Enviar Email com E-book

```javascript
// Exemplo: SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function enviarEbook(email, nome) {
  const msg = {
    to: email,
    from: 'noreply@resetprimal.com.br',
    subject: 'Seu Reset Primal está pronto!',
    html: `
      <h2>Bem-vindo, ${nome}!</h2>
      <p>Sua compra foi confirmada. Aqui está seu e-book:</p>
      <a href="https://resetprimal.com.br/ebook">
        Acessar Reset Primal →
      </a>
      <p>Qualquer dúvida, entre em nosso grupo Telegram.</p>
    `
  };
  
  await sgMail.send(msg);
  console.log(`📧 Email enviado: ${email}`);
}
```

### 8.3 Notificar em Telegram

```javascript
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function notificarTelegram(event) {
  const msg = `
💰 NOVA VENDA!
👤 ${event.buyer.name}
📧 ${event.buyer.email}
💵 R$ ${event.sale.price}
🆔 ID: ${event.sale.id}
  `;
  
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg);
}
```

---

## 9. TROUBLESHOOTING

### ❌ Webhook não dispara após compra
**Causa:** Hotmart não está recebendo resposta 200 de sua URL

**Solução:**
1. Teste manualmente: https://resetprimal.com.br/webhook/hotmart (deve dar erro 405, ok)
2. Teste com Postman (simular POST)
3. Verifique logs do servidor
4. Seu código retorna HTTP 200?
5. Tente desativar validação de signature temporariamente

### ❌ "Invalid signature" sempre
**Causa:** Token webhook está errado

**Solução:**
1. Copiar token EXATO de Hotmart
2. Colar em `.env` sem espaços extras
3. Reiniciar servidor após mudar .env
4. Verificar se Hotmart e seu código usam mesmo algoritmo (SHA-256)

### ❌ URL "não encontrada" (404)
**Causa:** Endpoint não existe no seu servidor

**Solução:**
1. Arquivo webhook.js está no lugar certo?
2. Rota `/webhook/hotmart` está registrada?
3. POST está permitido (não apenas GET)?
4. Se usar framework, middleware está configurado?

### ❌ Timeout (webhook expira)
**Causa:** Seu servidor demora muito para responder

**Solução:**
1. Responda rápido: registrar e processar depois (assíncrono)
2. Não fazer operações pesadas dentro do webhook
3. DB muito lento? Usar fila (Redis, Bull)

### ❌ Webhook recebido mas email não enviado
**Causa:** Lógica de envio email tem erro

**Solução:**
1. Testar SendGrid/seu email service separadamente
2. Adicionar logs detalhados
3. Usar try/catch e logar erros
4. API key de email está correta?

---

## 10. CHECKLIST DE LANÇAMENTO

Antes de lançar:

- [ ] Webhook criado em Hotmart
- [ ] URL é HTTPS (segura)
- [ ] Token webhook copiado para `.env`
- [ ] Código webhook implementado (Node/Python/PHP)
- [ ] Servidor rodando e acessível
- [ ] Teste webhook do Hotmart dispara com sucesso
- [ ] Logs são gerados quando webhook chega
- [ ] Email é enviado após compra
- [ ] BD é atualizado após compra
- [ ] Notificação Telegram/Slack funciona
- [ ] Signature validation está ativo
- [ ] Erro handling implementado

---

## 11. PRÓXIMOS PASSOS

1. ✅ Webhook configurado → `docs/ESTRUTURA-PRODUCAO.md`
2. ✅ Analytics → `docs/ANALYTICS-SETUP.md`
3. ✅ Conversões → `docs/CONVERSAO-TRACKING.md`

---

**Status:** ✅ Pronto para implementação  
**Tempo total:** ~30 minutos  
**Crítico?** SIM - sem webhook, não sabe quando vende

Dúvidas? Ver `docs/TROUBLESHOOTING.md`
