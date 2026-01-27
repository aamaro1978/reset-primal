# ❓ FAQ Completo - Reset Primal

**Versão:** 1.0
**Data:** 2025-01-27
**Status:** Production Ready

---

## 📚 Índice

1. [Perguntas sobre Compra](#perguntas-sobre-compra)
2. [Perguntas sobre Email & Acesso](#perguntas-sobre-email--acesso)
3. [Perguntas sobre Rastreamento](#perguntas-sobre-rastreamento)
4. [Perguntas Técnicas](#perguntas-técnicas)
5. [Perguntas sobre Operação](#perguntas-sobre-operação)
6. [Perguntas sobre Segurança](#perguntas-sobre-segurança)

---

## Perguntas sobre Compra

### P: Como rastrear uma compra específica?

**R:** Você pode rastrear compras de 3 formas:

**1. Arquivo de Logs (local)**
```bash
# SSH no servidor
ssh root@64.225.44.199

# Buscar por email do cliente
grep "cliente@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Resposta esperada (JSON 1 linha):
# {"timestamp":"2025-01-27T10:30:45.123Z","buyer_email":"cliente@example.com","buyer_name":"João","purchase_id":"P123","amount":97.00,"status":"completed"}
```

**2. Google Analytics (GA4)**
- Acesse: analytics.google.com
- Reset Primal → Relatórios → Conversão
- Filtrar por data
- Verá evento "purchase" com valor

**3. Facebook Events Manager**
- Acesse: business.facebook.com
- Events Manager → Seu Pixel
- Filtrar por data
- Verá evento "Purchase"

**4. Hotmart Dashboard**
- Acesse: app.hotmart.com
- Vendas → Procurar por email/nome
- Ver histórico da transação

---

### P: E se o cliente disser que pagou mas a compra não aparece?

**R:** Siga este checklist de diagnóstico:

```bash
# 1. Verificar se compra chegou ao webhook
grep "cliente@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Se ENCONTROU a compra:
✅ Webhook recebeu
→ Verificar se email foi enviado (ver seção "E se o email não chegar?")

# Se NÃO encontrou:
❌ Webhook não recebeu POST
→ Causas possíveis:
  1. Hotmart ainda processando (leva alguns minutos)
  2. Hotmart não tem webhook configurado no domínio certo
  3. Firewall bloqueando Hotmart
  4. URL no webhook está errada (deve ser https://resetprimal.com.br/webhook/hotmart)

# Verificações:
# 1. Testar se webhook está online
curl https://resetprimal.com.br/health
# Esperado: {"status":"ok",...}

# 2. Verificar Hotmart webhook config
# app.hotmart.com → Integrações → Webhooks
# Deve ter: URL = https://resetprimal.com.br/webhook/hotmart

# 3. Verificar logs em tempo real
pm2 logs hotmart-webhook --lines 50

# 4. Se webhook está offline
pm2 status
# Se mostra "offline" ou "stopped":
pm2 restart hotmart-webhook
```

---

### P: Posso mudar o link de compra do Hotmart?

**R:** Sim! Mas com cuidado. O link pode ser:

**Cenário 1: Mudar apenas a URL na Landing Page**
```bash
# Arquivo: landing-page/index.html

# Encontre:
https://pay.hotmart.com/W103146395W

# Substitua por seu link:
https://pay.hotmart.com/SEU_NOVO_LINK_AQUI

# Deploy:
git add landing-page/index.html
git commit -m "chore: update Hotmart affiliate link"
git push origin main
```

**Cenário 2: Usar variável de ambiente (melhor prática)**
```bash
# .env
HOTMART_AFFILIATE_LINK=https://pay.hotmart.com/SEU_NOVO_LINK

# api/webhook-hotmart.js (já faz isso!)
const HOTMART_AFFILIATE_LINK = process.env.HOTMART_AFFILIATE_LINK || 'https://pay.hotmart.com/W103146395W';
```

**⚠️ IMPORTANTE:** Quando mudar o link:
- Atualize AMBOS (no Hotmart AND no HTML)
- Faça um teste de compra em Sandbox
- Verifique se webhook continua funcionando
- Hotmart enviará webhook para URL configurada no Hotmart (não muda automaticamente)

---

### P: Qual é a margem de lucro esperada?

**R:** Isso depende de quanto você recebe do Hotmart vs custos:

```
Exemplo (fique à vontade para atualizar):
═══════════════════════════════════════════════════════════════

RECEITA:
- Preço ao cliente: R$ 97,00
- Hotmart comissão: -37,5% (ou valor que acordou)
- Seu recebimento: ~R$ 60,75

CUSTOS FIXOS/MÊS:
- Servidor DigitalOcean: $4-6/mês ≈ R$ 20
- Domínio: ≈ R$ 50/ano (negligenciável)
- Gmail (já tem): R$ 0
- Hotmart taxa (já descontada acima): R$ 0

CUSTOS POR VENDA:
- Email (Gmail): R$ 0
- GA4: R$ 0
- Facebook Pixel: R$ 0
- Overhead (servidor): ~R$ 0,10

LUCRO POR VENDA:
- R$ 60,75 (recebimento) - R$ 0,10 (custo) = R$ 60,65
- Margem: ~62%

BREAK-EVEN:
- 1 venda/mês = Pagou servidor + domínio
- 2 vendas/mês = Lucro de ~R$ 121
- 10 vendas/mês = Lucro de ~R$ 606
```

---

### P: Posso oferecer desconto ou cupom?

**R:** Sim, mas faça no Hotmart, não no código:

**Opção 1: Cupom de Desconto (Recomendado)**
1. app.hotmart.com → Produtos → Reset Primal
2. Promoções → Criar cupom
3. Configure desconto (ex: 20% off)
4. Gere código único (ex: PRIMEIRACOMPRA20)
5. Distribua para clientes

**Opção 2: Preço Diferente por Produto**
- Hotmart permite ter múltiplas "variações" de produto
- Exemplo: "Reset Primal - Oferta" (R$ 77) vs "Reset Primal" (R$ 97)
- Use links diferentes para cada

**⚠️ Cuidado:**
- Seu webhook continua funcionando igual
- Email e rastreamento automáticos
- Apenas o valor muda nos logs

---

## Perguntas sobre Email & Acesso

### P: E se o email não chegar?

**R:** Diagnóstico passo a passo:

```bash
# PASSO 1: Verificar se webhook processou
grep "cliente@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Se não encontrou:
→ Webhook não recebeu o POST (ver P: "E se o cliente disser que pagou?")

# Se encontrou:
→ Prosseguir para PASSO 2

# PASSO 2: Verificar logs de email
pm2 logs hotmart-webhook --lines 100 | grep "EMAIL"

# Procure por padrões:
# ✅ "[EMAIL] Enviado para cliente@example.com" = Sucesso
# ❌ "[EMAIL] Erro ao enviar" = Falha
```

**Se vê erro de email, as causas são:**

### Erro 1: "Invalid login: 535-5.7.8"

**Significado:** Gmail rejeitou credenciais

```bash
# Solução:
1. Verificar .env tem credenciais corretas
   grep "GMAIL_USER\|GMAIL_PASSWORD" /var/www/reset-primal/.env

2. Se errado, gerar novo app-specific password:
   - Acesse: https://myaccount.google.com
   - Security → 2-Step Verification (ativar se não tiver)
   - App passwords
   - Selecione: Mail + seu dispositivo
   - Google gera 16 caracteres
   - Copia INTEIRA

3. Atualizar .env:
   nano /var/www/reset-primal/.env
   GMAIL_PASSWORD=novo_password_aqui
   Salvar: Ctrl+X → Y → Enter

4. Restart webhook:
   pm2 restart hotmart-webhook

5. Fazer compra de teste para verificar
```

### Erro 2: "Less secure app access"

**Significado:** Gmail bloqueou acesso da app

```bash
# Solução:
1. Ativar "App passwords" (mais seguro):
   https://myaccount.google.com/apppasswords
   (ver Error 1 acima)

2. OU ativar "Less secure apps" (menos seguro):
   https://myaccount.google.com/lesssecureapps
   Clique "Turn on"
   (não recomendado, use app-specific password)
```

### Erro 3: "ECONNREFUSED" ou "timeout"

**Significado:** Não consegue conectar ao Gmail

```bash
# Solução:
1. Verificar conectividade
   nc -zv smtp.gmail.com 587
   # Esperado: "succeeded"

2. Testar email manualmente:
   node -e "
   require('dotenv').config();
   const nodemailer = require('nodemailer');

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
     subject: 'Teste',
     html: '<h1>Teste</h1>'
   }, (err, info) => {
     if (err) {
       console.error('ERRO:', err.message);
     } else {
       console.log('✅ EMAIL ENVIADO');
     }
   });
   "

3. Se ainda falhar, contatar suporte Gmail
```

### Erro 4: Email enviado mas caiu em Spam

**Significado:** Gmail enviou, mas chegou na pasta de Spam

```
Soluções para o cliente:
1. Procurar em "Spam" ou "Promoções"
2. Marcar como "Not Spam"
3. Adicionar seu email (singullarco@gmail.com) aos contatos

Soluções no código (investigação):
- Adicionar SPF record no domínio
- Adicionar DKIM record
- Adicionar DMARC record
- (Pedir ao DevOps para configurar)
```

---

### P: Cliente esqueceu o link de download?

**R:** 2 soluções:

**Solução 1: Cliente procura no email (24h anteriores)**
```
- Verificar "Recebidos"
- Procurar por "Reset Primal" ou seu email
- Se em Spam, marcar como "Not Spam"
- Clicar link 📥 BAIXAR MEU E-BOOK AGORA
```

**Solução 2: Você envia novo email manualmente**
```bash
# Encontrar compra anterior
grep "cliente@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Se encontrou:
→ Enviar email manualmente (ou resend via Hotmart)

# No Hotmart:
# 1. Vendas → Procurar cliente
# 2. Clicar em venda
# 3. Ações → Enviar novamente
# (Hotmart enviará novo email)
```

---

## Perguntas sobre Rastreamento

### P: Como saber se GA4 está funcionando?

**R:** 5 formas de verificar:

**Forma 1: Real-time (imediato)**
1. Acesse: https://analytics.google.com
2. Reset Primal → Real-time
3. Procure "Users" (se > 0, há tráfego)
4. Clique em um e veja seu atividade

**Forma 2: Fazer compra de teste**
```bash
# 1. Em Sandbox do Hotmart:
   app.hotmart.com → Produto → Modo Sandbox (ligar)

# 2. Fazer compra de teste (não paga)

# 3. Esperou 2 minutos

# 4. Volta em GA4 Real-time
   Procure por evento "purchase"
   Se vê, GA4 está funcionando ✅

# 5. Esperou 24h

# 6. Verifica em Relatórios → Conversão
   Deve mostrar o evento "purchase"
```

**Forma 3: Verificar no código**
```bash
# Procurar ID do GA4 no HTML
grep "G-" /var/www/reset-primal/landing-page/index.html

# Esperado: G-KKTGW6BEJP (seu ID real, não PLACEHOLDER)

# Se vê PLACEHOLDER:
sed -i 's/G-PLACEHOLDER/G-KKTGW6BEJP/g' /var/www/reset-primal/landing-page/index.html
```

**Forma 4: Verificar no navegador (F12)**
```javascript
// Abra a landing page em https://resetprimal.com.br
// Pressione F12 (Developer Console)
// Procure por:

window.dataLayer
// Deve mostrar array com eventos

// Procure por gtag
gtag('event', 'page_view', {page_path: '/'})
// Deve estar sendo chamado

// Ver requisições POST para GA4
// Aba Network → Filtrar "google-analytics"
// Deve haver requisição POST bem-sucedida (status 200 ou 201)
```

**Forma 5: Verificar logs do servidor**
```bash
# Ver se GA4 API foi chamada com sucesso
pm2 logs hotmart-webhook --lines 100 | grep "GA4"

# Esperado:
# [GA4] Conversão rastreada para cliente@example.com

# Se vê "[GA4] Erro":
# Verificar GOOGLE_ANALYTICS_API_SECRET em .env
```

---

### P: GA4 mostra conversões mas com valor R$ 0?

**R:** Problema: valor não está sendo enviado

**Diagnóstico:**
```bash
# 1. Verificar se parâmetro "value" está no código
grep -n "value.*97\|purchase.*value" /var/www/reset-primal/landing-page/index.html

# Se não encontrou, ou valor está 0:
# Arquivo: landing-page/index.html
# Procure por: gtag('event', 'purchase'
# Verifique que tem: 'value': 97.00

# Se não tem ou está 0:
# Editar e adicionar valor correto
```

**Solução:**
```bash
# Se landing page não tem, webhook envia valor correto
# GA4 precisa receber "value" no evento

# Verificar no webhook
grep -A 5 "trackConversionGA4" /var/www/reset-primal/api/webhook-hotmart.js

# Esperado:
# params: {
#   value: value,  ← valor da compra
#   currency: 'BRL'
# }
```

**Se webhook estiver OK:**
- GA4 está recebendo valor correto
- Problema pode ser relatório de GA4
- Esperar 24h para processar completamente

---

### P: Facebook Pixel não rastreia?

**R:** Diagnóstico similar ao GA4:

**Passo 1: Instalar Facebook Pixel Helper**
1. Chrome Web Store
2. Procurar: "Facebook Pixel Helper"
3. Adicionar extensão
4. Ir em resetprimal.com.br
5. Clique ícone extensão
6. Deve mostrar: "Pixel detected"
7. Se mostra "Pixel not found" = problema

**Passo 2: Verificar ID no HTML**
```bash
grep "fbq.*init\|PIXEL-PLACEHOLDER" /var/www/reset-primal/landing-page/index.html

# Esperado:
# fbq('init', '1164114415287965');

# Se vê PLACEHOLDER:
sed -i 's/PIXEL-PLACEHOLDER/1164114415287965/g' /var/www/reset-primal/landing-page/index.html
```

**Passo 3: Fazer compra de teste**
1. Hotmart Sandbox mode ligar
2. Fazer compra
3. Voltar para resetprimal.com.br
4. Abrir Pixel Helper
5. Ver se rastreia evento "Purchase"
6. Aguardar 1-2 horas para aparecer em Events Manager

---

## Perguntas Técnicas

### P: O que significa HMAC-SHA256?

**R:** É a "assinatura" que valida se o webhook é realmente do Hotmart:

```
HMAC-SHA256 = Hash-based Message Authentication Code com algoritmo SHA256

Analógico: Você enviam envelopes assinados

┌─────────────────────┐          ┌─────────────────────┐
│     HOTMART         │          │   RESET PRIMAL      │
├─────────────────────┤          ├─────────────────────┤
│ 1. Pega mensagem    │          │ 1. Recebe mensagem  │
│    (payload JSON)   │          │    + assinatura     │
│                     │          │                     │
│ 2. Pega chave secreta│          │ 2. Tem mesma chave  │
│    (seu webhook     │          │    (em .env)        │
│     secret)         │          │                     │
│                     │          │                     │
│ 3. Calcula HMAC:    │          │ 3. Recalcula HMAC   │
│    hash = HMAC-SHA256│         │    hash = HMAC-SHA256│
│    (payload, secret)│          │    (payload, secret)│
│                     │          │                     │
│ 4. Envia no header: │          │ 4. Compara:         │
│    x-hotmart-       │          │    se hash enviado  │
│    signature: hash  ├─────────►│    === hash local   │
│                     │          │    Válido! ✅       │
│                     │          │                     │
│                     │          │    Se não bater:    │
│                     │          │    Rejeitado! ❌    │
└─────────────────────┘          └─────────────────────┘
```

**Por que importa?**
- Garante que POST é realmente do Hotmart
- Evita que hackers façam fake webhooks
- Segurança de dados do cliente

**Implementação no Reset Primal:**
```javascript
function verifyHotmartSignature(body, signature) {
    const computedSignature = crypto
        .createHmac('sha256', HOTMART_SECRET)  ← sua secret
        .update(JSON.stringify(body))          ← payload
        .digest('hex');                        ← resultado

    return computedSignature === signature;   ← comparação
}
```

---

### P: Como testar webhook localmente?

**R:** 3 formas:

**Forma 1: Teste de health (mais simples)**
```bash
curl http://localhost:3000/health

# Resposta:
{"status":"ok","timestamp":"2025-01-27T18:30:45.123Z"}
```

**Forma 2: Teste webhook com signature inválida**
```bash
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: invalid" \
  -d '{"type":"PURCHASE_COMPLETE","data":{"buyer":{"email":"test@example.com"}}}'

# Resposta (esperada):
{"error":"Invalid signature"}
```

**Forma 3: Teste webhook com signature válida**
```bash
# Pega .env local
source .env

# Gera signature válida
SIGNATURE=$(node -e "
const crypto = require('crypto');
const payload = '{\"type\":\"PURCHASE_COMPLETE\",\"data\":{\"buyer\":{\"email\":\"test@example.com\",\"name\":\"Test\"},\"purchase\":{\"id\":\"123\",\"price\":97,\"status\":\"completed\"}}}';
const sig = crypto.createHmac('sha256', process.env.HOTMART_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');
console.log(sig);
")

# Usa signature
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: $SIGNATURE" \
  -d '{"type":"PURCHASE_COMPLETE","data":{"buyer":{"email":"test@example.com","name":"Test"},"purchase":{"id":"123","price":97,"status":"completed"}}}'

# Resposta (esperada):
{"status":"ok"}

# Verificar logs
tail -1 /var/www/reset-primal/logs/webhook-hotmart.log | jq .
```

---

### P: Como aumentar número de vendas rastreadas?

**R:** Tecnicamente, webhook rastreia TUDO que Hotmart envia. Mas você pode:

**1. Aumentar tráfego para landing page**
- Google Ads
- Facebook/Instagram Ads
- Email marketing
- Influencers

**2. Melhorar conversão (CTR)**
- A/B test headlines
- Melhorar video
- Depoimentos mais visíveis
- CTA mais agressivo

**3. Facilitar pagamento**
- Hotmart oferece múltiplas opções (automático)
- Coupon codes para incentivar
- Oferta limited-time

**4. Verificar tracking funciona**
```bash
# Garantir que GA4 e Facebook estão rastreando
# Se não rastrearem, otimizações baseadas em dados ficam erradas
```

---

## Perguntas sobre Operação

### P: Como fazer backup do projeto?

**R:** Backup diário essencial:

```bash
# BACKUP DO .ENV (CRÍTICO!)
scp root@64.225.44.199:/var/www/reset-primal/.env ~/backup-reset-primal-.env

# BACKUP DOS LOGS
scp -r root@64.225.44.199:/var/www/reset-primal/logs ~/backup-reset-primal-logs/

# BACKUP COMPLETO
scp -r root@64.225.44.199:/var/www/reset-primal ~/backup-reset-primal-complete/

# AUTOMATIZAR COM CRON
# Adicionar ao seu crontab local:
0 2 * * * scp root@64.225.44.199:/var/www/reset-primal/.env ~/backups/reset-primal-$(date +\%Y-\%m-\%d).env
0 3 * * 0 scp -r root@64.225.44.199:/var/www/reset-primal/logs ~/backups/logs-$(date +\%Y-\%m-\%d)/

# (Roda todo dia às 2am para .env, todo domingo às 3am para logs)
```

---

### P: Como atualizar landing page?

**R:** Passo a passo:

```bash
# 1. Editar arquivo local
nano landing-page/index.html
# (Fazer seus changes)

# 2. Testar localmente (abrir no navegador)
open landing-page/index.html

# 3. Enviar para servidor
scp landing-page/index.html root@64.225.44.199:/var/www/reset-primal/landing-page/

# 4. Ou usar Git (se está commitado)
git add landing-page/index.html
git commit -m "chore: update landing page copy"
git push origin main

# Depois no servidor:
cd /var/www/reset-primal
git pull origin main
```

---

### P: Como renovar certificado SSL?

**R:** Já é automático, mas manual também funciona:

```bash
# Ver próxima renovação
sudo certbot certificates

# Renovar agora
sudo certbot renew --force-renewal

# Se falhar, tentarstandalone
sudo systemctl stop nginx
sudo certbot certonly --standalone -d resetprimal.com.br
sudo systemctl start nginx

# Verificar
curl -I https://resetprimal.com.br
# Esperado: HTTP/1.1 200
```

---

### P: Como mudar credenciais (Hotmart, Gmail, etc)?

**R:** Safe procedure:

```bash
# 1. SSH no servidor
ssh root@64.225.44.199

# 2. Backup do .env atual
cp /var/www/reset-primal/.env ~/backup-.env.$(date +%Y-%m-%d)

# 3. Editar .env
nano /var/www/reset-primal/.env

# 4. Alterar credencial:
# HOTMART_WEBHOOK_SECRET=novo_secret_aqui
# OU
# GMAIL_PASSWORD=nova_password_aqui

# 5. Salvar: Ctrl+X → Y → Enter

# 6. Verificar mudança
grep "HOTMART_WEBHOOK_SECRET\|GMAIL_PASSWORD" /var/www/reset-primal/.env

# 7. Restart webhook
pm2 restart hotmart-webhook

# 8. Testar
curl https://resetprimal.com.br/health
# Esperado: {"status":"ok",...}

# 9. Fazer compra teste para validar
```

---

## Perguntas sobre Segurança

### P: O código tem vulnerabilidades?

**R:** Código foi revisado. Boas práticas:

✅ **Está certo:**
- HMAC-SHA256 validação obrigatória
- Credenciais em .env (não hardcoded)
- Email hashed em SHA256 para Facebook
- Async/await (sem blocking)
- Error handling com try/catch

⚠️ **Considerar:**
- Rate limiting no webhook (future enhancement)
- CORS headers (se expor API)
- Input validation (além de HMAC)
- SQL injection not applicable (não usa DB)
- XSS: Landing page tem conteúdo estático

❌ **Riscos atuais:**
- .env pode ser comprometido (sempre proteger)
- Gmail password em plain (use app-specific)
- Logs contém emails (GDPR concern)

---

### P: Como proteger .env?

**R:** Boas práticas:

```bash
# 1. Permissões do arquivo
ls -l /var/www/reset-primal/.env
# Esperado: -rw------- (600) ← somente leitura/escrita owner

chmod 600 /var/www/reset-primal/.env

# 2. Não commitar no Git
cat .gitignore | grep "\.env"
# Esperado: .env (ou *.env)

# 3. Nunca compartilhar em:
# - Email
# - Slack/Teams
# - GitHub (privado ou não)
# - Logs

# 4. Rotação de secrets (30 dias)
# - Hotmart: Gerar novo webhook secret
# - Gmail: Gerar novo app-specific password
# - GA4: Renovar API secret
# - Facebook: Renovar token

# 5. Backup seguro
# - Criptografar backup em casa
# - Não deixar em cloud público
```

---

### P: E se alguém roubar meu .env?

**R:** Plano de ação imediato:

```
HOTMART SECRET COMPROMETIDO:
1. Acesse app.hotmart.com
2. Integrações → Webhooks
3. Delete webhook antigo
4. Criar novo webhook
5. Copiar novo secret
6. Atualizar .env
7. Testar webhook

GMAIL PASSWORD COMPROMETIDO:
1. Acesse myaccount.google.com
2. Security → App passwords
3. Delete app password antigo
4. Gerar novo
5. Atualizar .env
6. Testar email

GA4 API SECRET:
1. Acessar analytics.google.com
2. Admin → Data API
3. Regenerar secret
4. Atualizar .env
5. Testar GA4

FACEBOOK TOKEN:
1. business.facebook.com
2. Settings → Access tokens
3. Revoke token antigo
4. Gerar novo
5. Atualizar .env
6. Testar Facebook

Depois, em todos os casos:
→ pm2 restart hotmart-webhook
→ Fazer compra teste
→ Verificar tudo funciona
```

---

### P: Meus dados de clientes estão seguros?

**R:** Segurança de dados:

✅ **O que é protegido:**
- HTTPS/SSL: Tráfego criptografado
- Email: Enviado via Gmail (enterprise)
- Webhook: Validado com HMAC-SHA256
- Firewall: UFW permite apenas 80, 443

⚠️ **O que você controla:**
- .env: Guardar em local seguro
- Logs: Contém emails dos clientes (implement GDPR deletion)
- Backups: Criptografar se possível

❌ **O que NÃO é seu responsabilidade:**
- Hotmart: Processa cartão (não você)
- Gmail: Armazena emails
- GA4: Google coleta analytics
- Facebook: Processa dados de conversão

**GDPR Compliance:**
- Você deveria deletar emails após 30-90 dias
- Implementar política de retenção de logs
- Ter "Política de Privacidade" na landing page
- Hotmart oferece ferramentas de GDPR

---

### P: Devo usar HTTPS mesmo em produção?

**R:** **SIM, absolutamente!**

```bash
# Verificar se redirecionando HTTP → HTTPS
curl -I http://resetprimal.com.br
# Esperado: 301 Moved Permanently
# Location: https://resetprimal.com.br/

# ✅ Correto:
# - HTTPS obrigatório
# - HTTP redireciona
# - Certificado Let's Encrypt (auto-renew)

# ❌ NUNCA:
# - HTTP sem HTTPS
# - Certificado self-signed em produção
# - Certificado expirado
```

---

## Resumo Rápido

| Pergunta | Resposta Rápida |
|----------|---|
| Como rastrear compra? | grep email em webhook-hotmart.log |
| Email não chega? | Verificar GMAIL_PASSWORD em .env |
| GA4 não funciona? | Verificar ID no HTML não tem PLACEHOLDER |
| Facebook não rastreia? | Instalar Pixel Helper, verificar ID |
| HMAC-SHA256? | Assinatura que valida webhook é do Hotmart |
| Testar webhook? | curl http://localhost:3000/health |
| Backup? | scp .env para seu PC diariamente |
| .env comprometido? | Regenerar todos secrets via Hotmart/Gmail/etc |
| HTTPS? | SIM, sempre! Redireciona automático |
| Deletar dados? | Implementar política GDPR, hotmart oferece |

---

## Escalation Flow

```
Problema → Verificar Logs → Diagnóstico → Ação → Teste

Exemplo:
"Email não cheira"
    ↓
grep "EMAIL" logs
    ↓
"[EMAIL] Erro ao enviar: Invalid login"
    ↓
Regenerar Gmail app-specific password
    ↓
pm2 restart + compra teste
    ↓
✅ Resolvido!
```

---

**Versão:** 1.0
**Data:** 2025-01-27
**Status:** Pronto para Suporte
**Próxima atualização:** 2025-02-27

---

### Links Importantes

- [API Reference](./API-WEBHOOK-REFERENCE.md) - Endpoints e payloads
- [Operational Procedures](./OPERATIONAL-PROCEDURES.md) - Day-to-day ops
- [Troubleshooting](./TROUBLESHOOTING-PRODUCAO.md) - Erros em produção
- [Arquitetura Visual](./ARQUITETURA-VISUAL.md) - Diagramas e fluxos

