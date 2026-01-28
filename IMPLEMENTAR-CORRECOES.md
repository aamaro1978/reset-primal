# 🔧 GUIA DE IMPLEMENTAÇÃO - Correções de Código

**Data:** 28 de janeiro de 2026
**Tempo Estimado:** 30-45 minutos
**Prioridade:** 🔴 CRÍTICA

---

## 📋 RESUMO DAS CORREÇÕES

| # | Arquivo | Problema | Severidade | Status |
|---|---------|----------|-----------|--------|
| 1 | webhook-hotmart.js | Validação HMAC insegura | 🔴 CRÍTICA | ✅ Corrigido |
| 2 | webhook-hotmart.js | Sem validação de header | 🔴 CRÍTICA | ✅ Corrigido |
| 3 | webhook-hotmart.js | Logging de dados sensíveis | 🟠 ALTA | ✅ Corrigido |
| 4 | webhook-hotmart.js | Sem rate limiting | 🟠 ALTA | ✅ Corrigido |
| 5 | webhook-hotmart.js | GA4 query string errada | 🟠 ALTA | ✅ Corrigido |
| 6 | webhook-hotmart.js | Gmail (deprecated) | 🟠 ALTA | ✅ Corrigido |
| 7 | .env | Sem template completo | 🟠 ALTA | ✅ Criado |
| 8 | scripts | Sem validação de env | 🟡 MÉDIA | ✅ Criado |

---

## 🚀 PASSO A PASSO DE IMPLEMENTAÇÃO

### PASSO 1: Backup (2 min)

```bash
# 1. Entrar na pasta do projeto
cd /Users/acacioamaro/Projects/reset-primal

# 2. Criar backup do arquivo atual
cp api/webhook-hotmart.js api/webhook-hotmart.js.BACKUP-$(date +%s)

# 3. Verificar backup foi criado
ls -la api/webhook-hotmart.js*
```

**Resultado esperado:**
```
webhook-hotmart.js
webhook-hotmart.js.BACKUP-1706427600
webhook-hotmart-CORRIGIDO.js
```

---

### PASSO 2: Substituir Arquivo Principal (1 min)

```bash
# 1. Remover arquivo antigo
rm api/webhook-hotmart.js

# 2. Renomear arquivo corrigido para principal
mv api/webhook-hotmart-CORRIGIDO.js api/webhook-hotmart.js

# 3. Verificar
ls -la api/webhook-hotmart.js
```

**Verificação:**
```bash
# Deve mostrar webhook-hotmart.js e webhook-hotmart.js.BACKUP
ls -la api/webhook-hotmart.js*

# Deve ter as correções
grep -n "timingSafeEqual" api/webhook-hotmart.js # Deve encontrar
grep -n "rateLimitMiddleware" api/webhook-hotmart.js # Deve encontrar
```

---

### PASSO 3: Configurar .env Correto (5 min)

```bash
# 1. Copiar template completo
cp .env.template-COMPLETO .env

# 2. Editar .env com seus valores reais
nano .env

# 3. Preencher:
# - HOTMART_WEBHOOK_SECRET (de Hotmart > Integrações > Webhooks)
# - SENDGRID_API_KEY (de sendgrid.com > API Keys)
# - SENDGRID_FROM_EMAIL (seu email verificado no SendGrid)
# - GOOGLE_ANALYTICS_PROPERTY_ID (GA4 Measurement ID)
```

**Exemplo:**
```bash
NODE_ENV=development
PORT=3000

HOTMART_WEBHOOK_SECRET=abc123def456ghi789jkl012mno345pqr
SENDGRID_API_KEY=SG.aBc123XyZ456...
SENDGRID_FROM_EMAIL=noreply@resetprimal.com.br
GOOGLE_ANALYTICS_PROPERTY_ID=G-1A2B3C4D5E
```

---

### PASSO 4: Instalar Dependências (3 min)

```bash
# 1. Entrar pasta API
cd api

# 2. Instalar @sendgrid/mail (antes usava Gmail)
npm install @sendgrid/mail

# 3. Verificar instalação
npm list @sendgrid/mail
```

**Verificação:**
```bash
# Deve mostrar versão
npm list @sendgrid/mail
# @sendgrid/mail@7.x.x
```

---

### PASSO 5: Validar Variáveis de Ambiente (3 min)

```bash
# Voltar para root
cd ..

# Executar validação
bash scripts/validate-env.sh
```

**Resultado esperado:**
```
🔍 Validando variáveis de ambiente...

✅ Arquivo .env encontrado

📋 Validando variáveis OBRIGATÓRIAS:
  ✅ HOTMART_WEBHOOK_SECRET: OK
  ✅ SENDGRID_API_KEY: OK
  ✅ SENDGRID_FROM_EMAIL: OK
  ✅ GOOGLE_ANALYTICS_PROPERTY_ID: OK

📋 Validando variáveis OPCIONAIS:
  ⚠️  FACEBOOK_PIXEL_ID: NÃO CONFIGURADA (opcional)

✅ VALIDAÇÃO OK - Variáveis de ambiente corretas!
```

---

### PASSO 6: Testar Localmente (5 min)

```bash
# 1. Iniciar servidor
npm start

# Deve aparecer:
# ✅ Variáveis de ambiente validadas
# ✅ Webhook Hotmart rodando em http://localhost:3000
```

**Em outro terminal:**
```bash
# 2. Testar health check
curl http://localhost:3000/health

# Deve retornar:
# {"status":"ok","timestamp":"2026-01-28T10:00:00.000Z","uptime":5.123}

# 3. Testar webhook (deve retornar 401 - assinatura inválida)
bash scripts/test-webhook.sh localhost

# Esperado:
# [DEV] Teste 1: POST sem assinatura (esperado: 401)
# HTTP Status: 401
```

---

### PASSO 7: Fazer Git Commit (3 min)

```bash
# 1. Verificar mudanças
git status

# 2. Adicionar arquivos
git add api/webhook-hotmart.js
git add .env.template-COMPLETO
git add scripts/validate-env.sh
git add ANALISE-CODIGO-COMPLETA.md
git add RECOMENDACOES-SEGURANCA.md
git add IMPLEMENTAR-CORRECOES.md

# 3. Verificar o que vai ser commitado
git diff --staged

# 4. Fazer commit
git commit -m "fix: correções críticas de segurança no webhook

- Usar timingSafeEqual para validação HMAC (evita timing attacks)
- Validar presença de header x-hotmart-signature
- Implementar rate limiting (100 req/min)
- Remover logging de dados sensíveis
- Corrigir query string do Google Analytics
- Substituir Gmail por SendGrid (mais seguro)
- Adicionar validação de ENV no startup
- Implementar error handling global
- Adicionar script de validação de ambiente

Severidade: CRÍTICA - Deploy antes de lançamento

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# 5. Verificar commit
git log --oneline | head -1

# 6. Fazer push
git push origin main
```

---

### PASSO 8: Verificar Deploy (2 min)

```bash
# 1. Ver commit no GitHub
git log --oneline | head -3

# 2. Verificar se push foi bem-sucedido
git status
# Deve mostrar: "On branch main, Your branch is up to date with 'origin/main'."

# 3. Testar webhook novamente
bash scripts/test-webhook.sh localhost
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de fazer push:
- [ ] Arquivo webhook-hotmart.js foi substituído
- [ ] npm install de @sendgrid/mail
- [ ] .env está preenchido com valores reais
- [ ] bash scripts/validate-env.sh passou
- [ ] npm start funciona sem erros
- [ ] curl http://localhost:3000/health retorna 200
- [ ] bash scripts/test-webhook.sh funciona
- [ ] .env NÃO foi commitado (verificar .gitignore)

### Após push:
- [ ] Git log mostra novo commit
- [ ] GitHub mostra novo commit
- [ ] Nenhum secret foi commitado (verificar)

---

## 🚨 SE ALGO DER ERRADO

### Erro: "HOTMART_WEBHOOK_SECRET é obrigatório"

```bash
# Solução: .env não foi carregado
source .env
bash scripts/validate-env.sh
```

### Erro: "Cannot find module @sendgrid/mail"

```bash
# Solução: Instalar dependências
cd api
npm install @sendgrid/mail
cd ..
npm start
```

### Erro: "SendGrid API key inválida"

```bash
# Verificar:
# 1. API key começa com SG.?
# 2. API key é de Mail Send (não Marketing)?
# 3. Copiar exatamente de sendgrid.com > Settings > API Keys
```

### Erro: "GA4 query string errado"

```bash
# Verificar que está usando URLSearchParams:
grep -A5 "new URLSearchParams" api/webhook-hotmart.js
# Deve mostrar o código novo
```

### Rollback (se necessário):

```bash
# 1. Restaurar backup
cp api/webhook-hotmart.js.BACKUP-* api/webhook-hotmart.js

# 2. Fazer revert no Git
git revert HEAD

# 3. Investigar problema
```

---

## 📊 ANTES vs DEPOIS

### ANTES (Vulnerável):
```javascript
// ❌ Timing attack possível
return computedSignature === signature;

// ❌ Sem validação de header
if (!verifyHotmartSignature(...))

// ❌ Loga email em console
console.log('[WEBHOOK] Recebido:', req.body);

// ❌ Sem rate limiting
app.post('/webhook/hotmart', ...)

// ❌ Query string errada no GA4
qs: { measurement_id: ... }
```

### DEPOIS (Seguro):
```javascript
// ✅ Evita timing attack
return crypto.timingSafeEqual(
  Buffer.from(computedSignature),
  Buffer.from(signature)
);

// ✅ Valida header antes
if (!signature || !verifyHotmartSignature(...))

// ✅ Log seguro sem dados pessoais
logEvent('info', 'purchase_received', {
    buyer_domain: buyer.email.split('@')[1],
    purchase_id: purchase.id
});

// ✅ Rate limiting implementado
app.use(rateLimitMiddleware);

// ✅ Query string corrigida
const params = new URLSearchParams({...});
const url = `https://...?${params}`;
```

---

## 🎯 PRÓXIMAS AÇÕES

### Imediatamente Após:
1. Testar webhook com assinatura real do Hotmart
2. Validar emails chegando via SendGrid
3. Confirmar GA4 rastreando conversões
4. Confirmar Facebook Pixel rastreando eventos

### Esta Semana:
1. Fazer load test (teste de carga)
2. Fazer security scan (validar vulnerabilidades)
3. Revisar logs em produção

### Este Mês:
1. Teste de penetração (pentesting)
2. Auditoria de código completa
3. Treinamento de segurança da equipe

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs:**
   ```bash
   tail -f logs/webhook-hotmart.log
   ```

2. **Validar .env:**
   ```bash
   bash scripts/validate-env.sh
   ```

3. **Testar webhook:**
   ```bash
   bash scripts/test-webhook.sh localhost
   ```

4. **Revisar documentação:**
   - ANALISE-CODIGO-COMPLETA.md (todos os problemas)
   - RECOMENDACOES-SEGURANCA.md (detalhes de segurança)

