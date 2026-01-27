# 🚀 INSTRUÇÕES FINAIS DE DEPLOYMENT - Reset Primal

**Data:** 2025-01-27
**Servidor:** 64.225.44.199 (DigitalOcean)
**Domínio:** resetprimal.com.br
**Status:** Pronto para deploy

---

## ⏱️ TEMPO ESTIMADO: 1 HORA

---

## 📋 CHECKLIST PRÉ-DEPLOY

Antes de começar, verifique:

- [ ] Você tem acesso SSH ao servidor (root@64.225.44.199)
- [ ] Projeto está em `/var/www/reset-primal`
- [ ] Arquivo `.env` tem todas as credenciais preenchidas
- [ ] Domínio `resetprimal.com.br` aponta para `64.225.44.199`
- [ ] Email de contato pronto para Certbot

---

## 🔧 PASSO 1: CONECTAR AO SERVIDOR

```bash
# No seu computador local:
ssh root@64.225.44.199

# Você vai entrar em um terminal do servidor
```

---

## 📦 PASSO 2: VERIFICAR PROJETO NO SERVIDOR

```bash
# Verificar se projeto existe
ls -la /var/www/reset-primal/

# Deve mostrar:
# .env, landing-page/, api/, nginx-reset-primal.conf, etc

# Verificar .env preenchido
cat /var/www/reset-primal/.env | grep -v "^#" | grep -v "^$"

# Deve mostrar TODOS os valores (sem PLACEHOLDER):
# HOTMART_WEBHOOK_SECRET=upan5FYAJLzL2nA46gm9...
# GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
# FACEBOOK_PIXEL_ID=1164114415287965
# GMAIL_USER=singullarco@gmail.com
# GMAIL_PASSWORD=oxluiocfahqgmojz
```

Se tudo OK, continue. Se não, copie o projeto:

```bash
# Se ainda não tem projeto no servidor:
cd /var/www
git clone https://seu-repo-github.com/reset-primal.git reset-primal
# OU
scp -r /Users/acacioamaro/Projects/reset-primal/* root@64.225.44.199:/var/www/reset-primal/
```

---

## 🚀 PASSO 3: EXECUTAR DEPLOYMENT AUTOMÁTICO

No servidor, execute:

```bash
cd /var/www/reset-primal

# Dar permissão ao script
chmod +x deploy-producao.sh

# EXECUTAR DEPLOYMENT
sudo bash deploy-producao.sh
```

Este script vai fazer automaticamente:
1. ✅ Instalar Nginx
2. ✅ Copiar configuração
3. ✅ Testar e recarregar Nginx
4. ✅ Instalar Certbot
5. ✅ Gerar certificado SSL
6. ✅ Instalar PM2
7. ✅ Start webhook
8. ✅ Configurar autostart
9. ✅ Verificação final

**⏱️ Vai levar uns 2-3 minutos**

---

## ✅ VERIFICAR DEPLOYMENT

Depois que o script terminar, verifique:

### 1️⃣ Landing Page (HTTP → HTTPS)

```bash
# Testar redirect HTTP → HTTPS
curl -I http://resetprimal.com.br
# Deve retornar: HTTP/1.1 301 Moved Permanently
# E header: Location: https://resetprimal.com.br/

# Testar HTTPS
curl -I https://resetprimal.com.br
# Deve retornar: HTTP/1.1 200 OK
```

### 2️⃣ Webhook Health

```bash
# Testar health endpoint
curl http://localhost:3000/health
# Deve retornar: {"status":"ok","timestamp":"..."}

# Testar com Hotmart signature
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: test" \
  -d '{"type":"TEST"}'
# Deve retornar: {"error":"Invalid signature"} (esperado com signature inválida)
```

### 3️⃣ PM2 Status

```bash
# Ver webhook rodando
pm2 status

# Deve mostrar: hotmart-webhook  ▶  online

# Ver logs em tempo real
pm2 logs hotmart-webhook --lines 10
```

### 4️⃣ SSL Certificado

```bash
# Ver data de expiração
sudo openssl x509 -in /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem \
  -noout -enddate

# Certificados Let's Encrypt duram 90 dias
# Renewal automático configurado pelo Certbot
```

---

## 📋 PASSO 4: CONFIGURAR HOTMART (MANUAL)

**Isso você faz no navegador, não no servidor**

1. Acesse: https://app.hotmart.com
2. Produtos → Reset Primal → Integrações → Webhooks
3. Clique "Criar novo webhook"
4. Preencha:
   ```
   URL: https://resetprimal.com.br/webhook/hotmart
   Eventos: ☑️ PURCHASE_COMPLETE
           ☑️ PURCHASE_APPROVED
   ```
5. Clique "Gerar Secret"
6. **Copie o Secret** (exemplo: `upan5FYAJLzL2nA46gm9...`)
7. **Salve no .env do servidor** como `HOTMART_WEBHOOK_SECRET`

**Verificar se está correto no servidor:**

```bash
# No servidor:
grep "HOTMART_WEBHOOK_SECRET" /var/www/reset-primal/.env

# Deve mostrar: HOTMART_WEBHOOK_SECRET=upan5FYAJLzL2nA46gm9...
```

**Se precisar atualizar:**

```bash
ssh root@64.225.44.199
nano /var/www/reset-primal/.env
# Editar a linha HOTMART_WEBHOOK_SECRET
# Salvar: Ctrl+X → Y → Enter

# Depois restart o webhook
pm2 restart hotmart-webhook
```

---

## 🧪 PASSO 5: PRIMEIRA COMPRA TESTE

### ANTES de fazer compra real:

Teste em modo **Sandbox** do Hotmart:

1. https://app.hotmart.com
2. Produto Reset Primal → Modo Sandbox (ativar)
3. Vá para página: https://resetprimal.com.br
4. Clique no CTA "Comprar agora"
5. Fazer compra de teste (R$ 97 ou free)
6. Não pagar de verdade (é teste)

### DEPOIS que Hotmart confirma:

Verifique no servidor:

```bash
# Ver se webhook recebeu POST
tail -50 /var/www/reset-primal/logs/webhook-hotmart.log

# Deve mostrar:
# [COMPRA] seu-email@example.com - Produto: ...
# [EMAIL] Enviado para seu-email@example.com
# [GA4] Conversão rastreada
# [FACEBOOK] Conversão rastreada
```

### VALIDAR:

- [ ] ✅ Webhook recebeu POST (ver logs)
- [ ] ✅ Email enviado para seu-email@gmail.com?
- [ ] ✅ GA4 rastreou evento (analytics.google.com → Real-time)
- [ ] ✅ Facebook rastreou (business.facebook.com → Events Manager)

Se tudo OK, você está **pronto para vendas reais**! 🎉

---

## 🆘 TROUBLESHOOTING

### "Nginx não inicia"

```bash
# Ver erro
sudo nginx -t

# Procurar por erros na config
sudo cat /var/log/nginx/error.log | tail -20
```

### "Certbot falha"

```bash
# Se DNS não aponta ainda, usar modo manual:
sudo certbot certonly --standalone -d resetprimal.com.br

# Depois copiar certificados para Nginx
```

### "Webhook não responde"

```bash
# Ver logs
pm2 logs hotmart-webhook --lines 50

# Restart
pm2 restart hotmart-webhook

# Se ainda não funcionar
pm2 delete hotmart-webhook
pm2 start /var/www/reset-primal/api/webhook-hotmart.js --name "hotmart-webhook"
```

### "Email não chega"

```bash
# Verificar credenciais .env
grep "GMAIL" /var/www/reset-primal/.env

# Se errado, atualizar:
nano /var/www/reset-primal/.env

# Depois restart webhook:
pm2 restart hotmart-webhook
```

---

## 📊 MONITORAMENTO 24/7

Depois de deploy, configure alertas:

### 1️⃣ Uptime Monitoring (UptimeRobot)

```
Site: https://resetprimal.com.br
Tipo: HTTPS
Intervalo: 5 min
Email alerta: seu-email@gmail.com
```

### 2️⃣ Logs em Tempo Real

```bash
# Em um terminal dedicado:
ssh root@64.225.44.199
pm2 logs hotmart-webhook
```

### 3️⃣ Email Alertas (Webhook)

Se webhook falha 3x, você recebe email (pode configurar no PM2)

---

## 📞 COMANDOS ÚTEIS

Salve estes comandos para depois:

```bash
# Ver logs webhook
ssh root@64.225.44.199
pm2 logs hotmart-webhook

# Ver status
pm2 status

# Restart webhook se tiver problema
pm2 restart hotmart-webhook

# Ver Nginx errors
sudo tail -f /var/log/nginx/error.log

# Renovar certificado SSL (manual)
sudo certbot renew --force-renewal

# Ver arquivo .env (verificar credenciais)
cat /var/www/reset-primal/.env

# Ver últimas compras (logs)
tail -100 /var/www/reset-primal/logs/webhook-hotmart.log
```

---

## ✅ CHECKLIST FINAL

Depois de tudo:

```
DEPLOYMENT:
[ ] Script executado com sucesso
[ ] Nginx ativo
[ ] PM2 webhook online
[ ] SSL/HTTPS funcionando

HOTMART:
[ ] Webhook configurado
[ ] Secret salvo em .env
[ ] Teste em Sandbox passou

PRIMEIRA VENDA:
[ ] Email recebido
[ ] GA4 rastreou
[ ] Facebook rastreou
[ ] Logs sem erros

PRONTO PARA VENDER:
[ ] Produção validada
[ ] Monitoramento ativo
[ ] Backup feito
```

---

## 🎊 PARABÉNS!

**Reset Primal está LIVE em https://resetprimal.com.br** 🚀

Você tem:
- ✅ Landing page otimizada
- ✅ Webhook processando vendas
- ✅ Email automation
- ✅ GA4 rastreando
- ✅ Facebook Pixel ativo
- ✅ SSL/HTTPS seguro

**Próximas otimizações (semanas seguintes):**
1. A/B testing
2. Email campaigns
3. Remarketing ads
4. Performance optimization

---

**Status:** ✅ PRONTO PARA PRODUÇÃO
**Versão:** 1.0
**Data:** 2025-01-27
**Deploy Time:** ~1 hora
