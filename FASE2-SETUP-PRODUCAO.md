# 🚀 FASE 2: Setup Produção - Guia Completo

**Data:** 2025-01-27
**Status:** ✅ Testes locais completos - Pronto para deploy
**Tempo estimado:** 1.5-2.5 horas (dependendo do servidor)

---

## 📋 PRÉ-REQUISITOS

Antes de começar, você deve ter:

- [ ] Servidor Linux (Ubuntu 20.04+, Debian 11+) com acesso SSH
- [ ] 5 credenciais reais (ver seção "Credenciais Necessárias" abaixo)
- [ ] Domínio `resetprimal.com.br` apontando para o servidor
- [ ] Acesso sudo no servidor

### Credenciais Necessárias

```bash
# 1. Hotmart Webhook Secret (de app.hotmart.com)
HOTMART_WEBHOOK_SECRET=seu_secret_aqui

# 2. Google Analytics 4 (de analytics.google.com)
GOOGLE_ANALYTICS_PROPERTY_ID=G-XXXXX

# 3. Facebook Pixel (de business.facebook.com)
FACEBOOK_PIXEL_ID=123456789

# 4. Gmail (myaccount.google.com → Security → App passwords, COM 2FA)
GMAIL_USER=seu-email@gmail.com
GMAIL_PASSWORD=seu_app_password_aqui
```

**Não tem essas credenciais?** Leia `CREDENTIALS-SETUP.md` primeiro!

---

## PASSO 1: Conexão SSH ao Servidor

```bash
# Conectar ao servidor
ssh root@seu_servidor_ip

# Ou com user específico
ssh usuario@seu_servidor_ip

# Criar pasta do projeto
mkdir -p /var/www/reset-primal
cd /var/www/reset-primal
```

---

## PASSO 2: Clonar/Copiar Projeto

**Opção A: Via Git (recomendado)**
```bash
git clone https://github.com/seu-usuario/reset-primal.git .
cd /var/www/reset-primal
```

**Opção B: Via SCP (se não tiver Git)**
```bash
scp -r /Users/acacioamaro/Projects/reset-primal/* root@seu_servidor:/var/www/reset-primal/
ssh root@seu_servidor
cd /var/www/reset-primal
```

---

## PASSO 3: Instalar Dependências do Sistema

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL/HTTPS)
sudo apt install -y certbot python3-certbot-nginx

# Verificar versões
node --version
npm --version
nginx -v
certbot --version
```

---

## PASSO 4: Preencher Credenciais Reais

No servidor:

```bash
# Editar .env com suas credenciais reais
sudo nano /var/www/reset-primal/.env
```

**Substituir:**
```env
HOTMART_WEBHOOK_SECRET=seu_webhook_secret_aqui
HOTMART_AFFILIATE_LINK=https://pay.hotmart.com/W103146395W
GOOGLE_ANALYTICS_PROPERTY_ID=G-SEU_ID_AQUI
FACEBOOK_PIXEL_ID=seu_pixel_id_aqui
GMAIL_USER=seu-email@gmail.com
GMAIL_PASSWORD=seu_app_password_aqui
EBOOK_DOWNLOAD_URL=https://resetprimal.com.br/ebook
PORT=3000
NODE_ENV=production
```

**Verificar:**
```bash
cat .env | grep -v "^#" | grep -v "^$"
# Deve mostrar TODOS os valores sem "seu_" ou "PLACEHOLDER"
```

---

## PASSO 5: Instalar Dependências Node

```bash
cd /var/www/reset-primal
npm install --production

# Verificar
ls -la node_modules | head -5
```

---

## PASSO 6: Substituir IDs no HTML

**No servidor:**

```bash
# Substituir GA4 ID
sed -i 's/G-PLACEHOLDER/G-SEU_GA4_ID/g' landing-page/index.html

# Verificar
grep "G-" landing-page/index.html | head -1

# Substituir Facebook Pixel ID
sed -i 's/PIXEL-PLACEHOLDER/SEU_PIXEL_ID/g' landing-page/index.html

# Verificar
grep "fbq('init'" landing-page/index.html
```

---

## PASSO 7: Configurar Nginx

```bash
# Copiar config para Nginx
sudo cp nginx-reset-primal.conf /etc/nginx/sites-available/reset-primal

# Criar symlink para ativar
sudo ln -s /etc/nginx/sites-available/reset-primal \
           /etc/nginx/sites-enabled/reset-primal

# Remover config padrão (optional)
sudo rm /etc/nginx/sites-enabled/default

# Validar config
sudo nginx -t
# Deve retornar: "successful" e "syntax is ok"

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
# Deve mostrar "active (running)"
```

---

## PASSO 8: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Gerar certificado
sudo certbot certonly --webroot \
  -w /var/www/reset-primal/landing-page \
  -d resetprimal.com.br \
  -d www.resetprimal.com.br

# Será pedido:
# 1. Email para notificações
# 2. Aceitar Terms of Service (A)
# 3. Compartilhar dados com EFF (N)

# Verificar certificado
sudo ls -la /etc/letsencrypt/live/resetprimal.com.br/

# Testar SSL
curl -I https://resetprimal.com.br
# Deve retornar: HTTP/1.1 200 (com cadeado SSL)

# Verificar com SSLLabs (opcional)
# https://www.ssllabs.com/ssltest/analyze.html?d=resetprimal.com.br
```

---

## PASSO 9: Testar Webhook Localmente (no Servidor)

```bash
# Terminal 1: Start webhook
cd /var/www/reset-primal
node api/webhook-hotmart.js

# Terminal 2 (em outro terminal SSH):
# Testar health
curl http://localhost:3000/health
# Deve retornar: {"status":"ok","timestamp":"..."}

# Parar webhook: Ctrl+C no Terminal 1
```

---

## PASSO 10: Configurar Webhook em Produção com PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Start webhook com PM2
pm2 start /var/www/reset-primal/api/webhook-hotmart.js \
  --name "hotmart-webhook" \
  --env production

# Configurar para restart automático
pm2 startup
pm2 save

# Verificar status
pm2 status
# Deve mostrar: "online"

# Ver logs em tempo real
pm2 logs hotmart-webhook
```

---

## PASSO 11: Configurar Webhook no Hotmart

**Em app.hotmart.com:**

```
1. Login com sua conta
2. Menu → Produtos → Reset Primal
3. Integrações → Webhooks
4. Criar novo webhook:
   - URL: https://resetprimal.com.br/webhook/hotmart
   - Eventos: ☑️ PURCHASE_COMPLETE, ☑️ PURCHASE_APPROVED
   - Clique "Gerar Secret"
   - Copie o secret → Atualize .env (HOTMART_WEBHOOK_SECRET)

5. Testar em sandbox:
   - Ir para "Produtos" → "Reset Primal"
   - Clicar "Modo Sandbox"
   - Fazer compra de teste (R$ 97)
   - Verificar se webhook foi acionado

6. Verificar logs:
   ssh root@servidor
   tail -50 /var/www/reset-primal/logs/webhook-hotmart.log
```

---

## PASSO 12: Primeira Compra Teste (Production)

```bash
# 1. Fazer compra real de R$ 97 ou em sandbox
# 2. Esperar confirmação do Hotmart

# 3. Verificar se webhook recebeu
tail -f /var/www/reset-primal/logs/webhook-hotmart.log
# Deve mostrar: [COMPRA] seu_email@email.com - Produto: ...

# 4. Verificar se email foi enviado
# Procurar email de "Reset Primal™" com link e-book

# 5. Verificar GA4
# Login em analytics.google.com
# Real-time → Deve mostrar evento "purchase"

# 6. Verificar Facebook
# business.facebook.com → Events Manager
# Deve mostrar evento "Purchase"
```

---

## ✅ Validação Final

Checklist para confirmar sucesso:

```
LANDING PAGE:
[ ] Acessar https://resetprimal.com.br (sem erros)
[ ] Página carrega rápido (PageSpeed > 80)
[ ] Links Hotmart funcionam
[ ] SSL válido (cadeado verde)

WEBHOOK:
[ ] GET https://resetprimal.com.br/health → 200
[ ] POST /webhook/hotmart funciona
[ ] Logs em /logs/webhook-hotmart.log

HOTMART INTEGRAÇÃO:
[ ] Webhook testado em sandbox
[ ] Email com e-book recebido
[ ] GA4 rastreou evento
[ ] Facebook Pixel rastreou evento

SEGURANÇA:
[ ] .env nunca foi commitado (no .gitignore)
[ ] Certificado SSL válido
[ ] Headers de segurança ativos
[ ] PM2 com restart automático
```

---

## 🆘 Troubleshooting

### Webhook não recebe POST
```bash
# Verificar se está rodando
pm2 status

# Ver logs
pm2 logs hotmart-webhook

# Testar localmente
curl http://localhost:3000/health

# Verificar firewall
sudo ufw allow 3000
```

### Email não chega
```bash
# Verificar .env
grep GMAIL .env

# Testar envio manual
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: { user: 'seu@gmail.com', pass: 'app_password' }
});
transporter.sendMail({
  from: 'seu@gmail.com',
  to: 'destino@email.com',
  subject: 'Teste',
  text: 'Teste de email'
}, console.log);
"
```

### SSL não funciona
```bash
# Renovar certificado
sudo certbot renew --dry-run

# Ver status
sudo systemctl status certbot.timer

# Validar DNS
nslookup resetprimal.com.br
```

---

## 📊 Próximas Etapas (Fase 3)

Depois de produção ativa:

1. **Monitoramento** (Sentry, UptimeRobot)
2. **Email Campaigns** (SendGrid, automações)
3. **A/B Testing** (Google Optimize)
4. **Remarketing** (Facebook Ads, Google Ads)
5. **Analytics Avançadas** (Custom segments, funnels)

---

## 📞 Suporte

Se tiver problemas:

1. Verificar `TROUBLESHOOTING-PRODUCAO.md`
2. Consultar logs: `pm2 logs hotmart-webhook`
3. Testar endpoints manualmente
4. Verificar pertenças (.env, permissões, firewall)

---

**Status:** ✅ PRONTO PARA DEPLOY
**Última atualização:** 2025-01-27
**Próximo passo:** Preencher credenciais e seguir passos acima
