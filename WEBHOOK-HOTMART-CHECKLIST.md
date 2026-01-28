# WEBHOOK HOTMART - CHECKLIST DE IMPLEMENTAÇÃO

**Status:** PRONTO PARA DEPLOY
**Data:** 28 jan 2026
**Arquivo Principal:** `/api/webhook-hotmart.js`

---

## ✅ PARTE 1: CÓDIGO IMPLEMENTADO

### Arquivo: `/api/webhook-hotmart.js`

- ✅ Endpoint POST `/webhook/hotmart` criado
- ✅ Validação HMAC-SHA256 implementada (timingSafeEqual)
- ✅ Rate limiting ativo (100 req/min)
- ✅ Processamento de eventos `PURCHASE_COMPLETE` e `PURCHASE_APPROVED`
- ✅ Envio de email via SendGrid com template HTML
- ✅ Rastreamento GA4 (Measurement Protocol)
- ✅ Rastreamento Facebook Conversion API
- ✅ Logging seguro (sem dados sensíveis)
- ✅ Error handling robusto
- ✅ Health check em `/health`

### Dependências Instaladas

```json
{
  "express": "^4.18.2",
  "@sendgrid/mail": "^8.1.6",
  "nodemailer": "^6.9.3",
  "cors": "^2.8.6",
  "helmet": "^8.1.0",
  "dotenv": "^16.0.3"
}
```

Status: ✅ **Todas instaladas**

---

## ✅ PARTE 2: VARIÁVEIS DE AMBIENTE

### Arquivo: `.env`

| Variável | Status | Valor |
|----------|--------|-------|
| `HOTMART_WEBHOOK_SECRET` | ✅ Preenchida | `upan5FYA...` |
| `SENDGRID_API_KEY` | ✅ Preenchida | `SG.TgzjcQ...` |
| `SENDGRID_FROM_EMAIL` | ✅ Preenchida | `aka@resetprimal.com.br` |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | ✅ Preenchida | `G-KKTGW6BEJP` |
| `GOOGLE_ANALYTICS_API_SECRET` | ⚠️ TODO | Precisa gerar em GA4 |
| `FACEBOOK_PIXEL_ID` | ⚠️ TODO | Opcional |
| `FACEBOOK_PIXEL_TOKEN` | ⚠️ TODO | Opcional |
| `EBOOK_DOWNLOAD_URL` | ✅ Preenchida | `https://resetprimal.com.br/ebook` |

---

## 🔧 PARTE 3: CONFIGURAÇÃO NO HOTMART

### PASSO 1: Acessar Webhooks no Hotmart

1. Acesse: https://app.hotmart.com
2. Faça login na sua conta
3. Vá em: **Configurações** → **Integrações** → **Webhooks**
4. Ou acesse direto: https://app.hotmart.com/webhooks

### PASSO 2: Criar Novo Webhook

**Clique em:** "Novo Webhook" ou "Adicionar Webhook"

### PASSO 3: Preencher Dados

| Campo | Valor |
|-------|-------|
| **Nome** | `Reset Primal - Webhook de Vendas` |
| **URL** | `https://resetprimal.com.br/webhook/hotmart` |
| **Eventos** | ✅ Venda Realizada (PURCHASE_COMPLETE) |
| | ✅ Venda Aprovada (PURCHASE_APPROVED) |
| | ✅ Reembolso (PURCHASE_REFUNDED) |
| | ✅ Chargeback (PURCHASE_CHARGEBACK) |

⚠️ **IMPORTANTE:**
- URL deve ser **HTTPS** (segura)
- Deve ser seu domínio real (não localhost)
- Deve estar acessível publicamente

### PASSO 4: Gerar e Salvar Token

1. Hotmart vai gerar um **Token/Secret** automaticamente
2. Copie o token exato
3. Se ainda não está em `.env`, adicione:
   ```
   HOTMART_WEBHOOK_SECRET=seu_token_aqui
   ```
4. Restart do servidor para carregar nova secret

### PASSO 5: Testar Webhook

**No painel Hotmart:**
1. Localize seu webhook na lista
2. Clique em **"Enviar Teste"** ou **"Test Webhook"**
3. Hotmart envia um evento fictício

**Resultado esperado:**
```
Status: 200 OK
✅ Webhook recebido com sucesso
```

**Se não funcionar:**
- [ ] URL está correta?
- [ ] Servidor está rodando e acessível?
- [ ] HTTPS está ativo?
- [ ] Firewall permite acesso?
- [ ] Token webhook está correto no `.env`?

---

## 🚀 PARTE 4: FLUXO DE FUNCIONAMENTO

### O que acontece quando uma venda é confirmada:

```
1. Cliente clica CTA → Hotmart Checkout
2. Preenche dados e clica "Comprar"
3. Hotmart processa pagamento
4. ✅ Pagamento APROVADO
   └─→ Hotmart faz POST para: https://resetprimal.com.br/webhook/hotmart
   └─→ Envia JSON com dados da compra + assinatura HMAC

5. Seu servidor recebe:
   ├─ Valida assinatura (segurança)
   ├─ Extrai dados do comprador
   ├─ Envia email com link e-book
   ├─ Rastreia em GA4
   ├─ Rastreia em Facebook
   └─ Responde HTTP 200 OK

6. Cliente recebe email:
   From: aka@resetprimal.com.br
   Subject: "🎉 Seu E-book Reset Primal está pronto!"
   └─→ Clica link para baixar e-book
```

---

## 📊 EVENTOS RASTREADOS

### Email
- ✅ Enviado via SendGrid para cliente
- ✅ Template HTML customizado
- ✅ Link para e-book incluído
- ⚠️ Requer `SENDGRID_API_KEY` válida

### GA4 (Measurement Protocol)
- ✅ Event: `purchase`
- ✅ Params: `value`, `currency`, `transaction_id`
- ⚠️ Requer `GOOGLE_ANALYTICS_API_SECRET` válida

### Facebook (Conversion API)
- ✅ Event: `Purchase`
- ✅ User data: Email (hasheado com SHA256)
- ⚠️ Opcional, requer `FACEBOOK_PIXEL_TOKEN`

---

## 🔒 SEGURANÇA IMPLEMENTADA

- ✅ Validação HMAC-SHA256 com `timingSafeEqual`
- ✅ Rate limiting (100 req/min por IP)
- ✅ Sem logging de dados sensíveis
- ✅ Helmet.js para headers de segurança
- ✅ Error handling robusto
- ✅ HTTPS obrigatório
- ✅ Variáveis sensíveis em `.env` (não no código)

---

## 📝 LOGS

### Arquivo: `logs/webhook-hotmart.log`

Registra:
- ✅ Webhooks recebidos com sucesso
- ✅ Erros de validação
- ✅ Emails enviados
- ✅ Rastreamento GA4 e Facebook
- ✅ Erro na processamento

**Exemplo de log:**
```json
{"timestamp":"2026-01-28T15:30:00Z","level":"info","event":"purchase_received","buyer_domain":"gmail.com","purchase_id":"ABC123","amount":97}
```

---

## ⚙️ COMO INICIAR SERVIDOR

### Opção 1: Desenvolvimento
```bash
npm install
npm start
```

Saída esperada:
```
✅ Webhook Hotmart rodando em http://localhost:3000
📝 Logs: logs/webhook-hotmart.log
```

### Opção 2: Produção (com PM2)
```bash
npm install -g pm2
pm2 start api/webhook-hotmart.js --name "reset-primal"
pm2 save
pm2 startup
```

### Opção 3: Docker
```bash
docker-compose -f docker-compose.production.yml up
```

---

## 🔗 URLs FINAIS

| Endpoint | URL | Método |
|----------|-----|--------|
| Webhook Hotmart | `/webhook/hotmart` | POST |
| Health Check | `/health` | GET |
| Landing Page | `https://resetprimal.com.br/` | GET |
| E-book | `https://resetprimal.com.br/ebook` | GET |

---

## 📋 CHECKLIST PRÉ-LANÇAMENTO

### Código
- [ ] Arquivo `/api/webhook-hotmart.js` existe
- [ ] `npm install` rodou com sucesso
- [ ] Nenhum erro no startup (`npm start`)
- [ ] Health check responde: `GET /health` → HTTP 200

### Variáveis de Ambiente
- [ ] `.env` tem `HOTMART_WEBHOOK_SECRET`
- [ ] `.env` tem `SENDGRID_API_KEY`
- [ ] `.env` tem `SENDGRID_FROM_EMAIL`
- [ ] `.env` tem `GOOGLE_ANALYTICS_PROPERTY_ID`
- [ ] `NODE_ENV=production` (se em produção)

### Hotmart
- [ ] Webhook criado em Hotmart
- [ ] URL: `https://resetprimal.com.br/webhook/hotmart`
- [ ] HTTPS verificado
- [ ] Eventos marcados (PURCHASE_COMPLETE, etc)
- [ ] Token copiado para `.env`
- [ ] Teste webhook disparado com sucesso

### Analytics
- [ ] GA4 Measurement ID preenchido
- [ ] Google Analytics API Secret gerado e adicionado ao `.env`
- [ ] Facebook Pixel ID (opcional)
- [ ] Facebook Conversion API Token (opcional)

### Email
- [ ] SendGrid API Key válida
- [ ] Email de teste enviado com sucesso
- [ ] Template HTML renderiza corretamente

### Monitoramento
- [ ] Logs sendo criados em `logs/webhook-hotmart.log`
- [ ] Alert configurado para erros (opcional)
- [ ] Backup de logs configurado (opcional)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **HOJE:**
   - [ ] Configurar webhook em Hotmart
   - [ ] Teste webhook disparando com sucesso
   - [ ] Email de teste enviado

2. **AMANHÃ:**
   - [ ] Monitorar logs
   - [ ] Fazer primeira compra teste
   - [ ] Validar email recebido

3. **PRÓXIMA SEMANA:**
   - [ ] Analisar conversões em GA4
   - [ ] Analisar eventos em Facebook
   - [ ] Otimizar conforme necessário

---

## 📞 TROUBLESHOOTING

### Problema: Webhook não dispara
**Solução:**
1. URL está correta em Hotmart?
2. Servidor está rodando?
3. HTTPS está ativo?
4. Teste webhook manual em Hotmart
5. Verifique logs: `tail -f logs/webhook-hotmart.log`

### Problema: "Invalid signature"
**Solução:**
1. Token webhook está exato em `.env`?
2. Não tem espaços extras?
3. Servidor foi restarted após mudar `.env`?
4. Token é do webhook correto?

### Problema: Email não é enviado
**Solução:**
1. SendGrid API Key válida?
2. Email de origem está verificado em SendGrid?
3. Verifique logs de erro
4. Teste SendGrid separadamente

### Problema: GA4 não rastreia
**Solução:**
1. API Secret foi gerado em GA4?
2. Measurement ID é o correto?
3. GA4 está em "Testing" ou "Verified"?
4. Verifique logs de erro

---

**Status: ✅ PRONTO PARA DEPLOY**

Implementado por: Claude Code (Morgan - PM)
Data: 28 janeiro 2026
Versão: 1.0
