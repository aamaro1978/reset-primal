# DEPLOYMENT CHECKLIST - RESET PRIMAL

**Status:** READY TO DEPLOY
**Data:** 28 janeiro 2026
**Servidor:** root@Singullar-Server (64.225.44.199)

---

## 🚀 DEPLOY EM 5 PASSOS (30 minutos)

### PASSO 1: CONECTAR AO SERVIDOR

```bash
ssh root@64.225.44.199
# ou
ssh root@Singullar-Server
```

### PASSO 2: PREPARAR ESTRUTURA (5 min)

```bash
# Criar diretórios
mkdir -p /var/www/reset-primal
mkdir -p /var/log/nginx
cd /var/www/reset-primal

# Opção A: Git (recomendado)
git clone https://github.com/seu-usuario/reset-primal.git .
git pull origin main

# Opção B: SCP (local → servidor)
# Na sua máquina local:
scp -r ~/Projects/reset-primal/* root@64.225.44.199:/var/www/reset-primal/
```

### PASSO 3: INSTALAR DEPENDÊNCIAS (5 min)

```bash
cd /var/www/reset-primal

# Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar dependências do projeto
npm install

# Criar diretório de logs
mkdir -p logs && chmod 755 logs

# Copiar .env (CRÍTICO!)
# Opção A: SCP
scp ~/.env root@64.225.44.199:/var/www/reset-primal/.env

# Opção B: Criar manualmente
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
HOTMART_WEBHOOK_SECRET=seu_secret
SENDGRID_API_KEY=seu_key
SENDGRID_FROM_EMAIL=aka@resetprimal.com.br
GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
EOF
```

### PASSO 4: CONFIGURAR NGINX (10 min)

```bash
# Copiar configuração
sudo cp /var/www/reset-primal/nginx-reset-primal.conf \
        /etc/nginx/sites-available/reset-primal

# Habilitar site
sudo ln -s /etc/nginx/sites-available/reset-primal \
          /etc/nginx/sites-enabled/reset-primal

# Desabilitar default (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar config
sudo nginx -t
# ✅ Esperado: "nginx: the configuration file syntax is ok"

# Restart nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

### PASSO 5: INICIAR NODE.JS (5 min)

```bash
cd /var/www/reset-primal

# Opção A: PM2 (RECOMENDADO para produção)
npm install -g pm2
pm2 start api/webhook-hotmart.js --name "reset-primal"
pm2 save
pm2 startup
# Copiar e executar comando gerado
pm2 restart all
pm2 status

# Opção B: Systemd Service
sudo bash << 'EOF'
cat > /etc/systemd/system/reset-primal.service << 'SERVICE'
[Unit]
Description=Reset Primal Webhook Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/reset-primal
ExecStart=/usr/bin/node api/webhook-hotmart.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable reset-primal
systemctl start reset-primal
systemctl status reset-primal
EOF
```

---

## ✅ VERIFICAÇÕES PÓS-DEPLOY (5 min)

### 1. Testar Landing Page
```bash
curl -I https://resetprimal.com.br
# Esperado: HTTP/2 200
```

### 2. Testar HTTPS
```bash
curl -I https://resetprimal.com.br
# Esperado: HTTPS com certificado válido
# Verificar em: https://www.ssllabs.com/ssltest/?d=resetprimal.com.br
```

### 3. Testar Node.js
```bash
curl http://localhost:3000/health
# Esperado: {"status":"ok","timestamp":"...","uptime":...}
```

### 4. Testar Webhook
```bash
# Teste local no servidor
curl -X POST http://localhost:3000/webhook/hotmart \
  -H "Content-Type: application/json" \
  -d '{"test":"true"}' \
  -w "\n%{http_code}\n"
# Esperado: 200 OK
```

### 5. Verificar Logs
```bash
# Nginx
sudo tail -f /var/log/nginx/reset-primal-access.log
sudo tail -f /var/log/nginx/reset-primal-error.log

# Node.js (PM2)
pm2 logs reset-primal

# Webhook
tail -f /var/www/reset-primal/logs/webhook-hotmart.log
```

---

## 📋 CHECKLIST COMPLETO

### Pré-Deploy (Local)
- [ ] `.env` completado com todos os tokens?
- [ ] Landing page tem 3 CTAs com link Hotmart correto?
- [ ] GA4 ID preenchido na LP?
- [ ] Facebook Pixel ID preenchido na LP?
- [ ] `npm install` rodou sem erro?
- [ ] `npm start` inicia sem erro?
- [ ] Arquivo `.env` está em `.gitignore`?

### Servidor (Preparação)
- [ ] SSH conectado ao servidor?
- [ ] `/var/www/reset-primal` criado?
- [ ] Estrutura copiada (Git ou SCP)?
- [ ] `.env` copiado com valores corretos?
- [ ] `npm install` rodou sem erro?
- [ ] `logs/` diretório criado?

### Nginx
- [ ] Config copiado em `/etc/nginx/sites-available/reset-primal`?
- [ ] Symlink criado em `/sites-enabled/`?
- [ ] `sudo nginx -t` sem erros?
- [ ] `sudo systemctl restart nginx` executado?
- [ ] Default site desabilitado?
- [ ] Status Nginx OK?

### Node.js
- [ ] PM2 ou Systemd iniciado?
- [ ] `pm2 status` ou `systemctl status` mostra "running"?
- [ ] Logs não têm erros?
- [ ] Health check responde?
- [ ] Porta 3000 acessível localmente?

### Testes
- [ ] `curl https://resetprimal.com.br` → HTTP 200?
- [ ] HTTPS é válido (SSL A+)?
- [ ] GA4 rastreia eventos?
- [ ] Facebook Pixel ativo?
- [ ] Links CTA funcionam?
- [ ] E-book carrega?
- [ ] Webhook teste dispara com sucesso?

### Monitoramento
- [ ] Logs sendo criados?
- [ ] Nenhum erro nos últimos 5 minutos?
- [ ] Uptime robot configurado (opcional)?
- [ ] Email teste pode ser enviado?

---

## 🔗 URLs PARA VERIFICAR

| URL | Esperado |
|-----|----------|
| https://resetprimal.com.br | Landing page com GA4 + FB Pixel |
| https://resetprimal.com.br/ebook | E-book viewer |
| https://www.ssllabs.com/ssltest/?d=resetprimal.com.br | SSL Grade A+ |
| https://pagespeed.web.dev/?url=https://resetprimal.com.br | PageSpeed Score |
| https://analytics.google.com | GA4 rastreando eventos |
| https://business.facebook.com | Facebook Pixel rastreando |

---

## 🔑 DADOS IMPORTANTE

### Hotmart
- **Link do Produto:** https://go.hotmart.com/W103146395W
- **Webhook URL:** https://resetprimal.com.br/webhook/hotmart

### Google Analytics
- **Property ID:** G-KKTGW6BEJP
- **Measurement ID:** G-KKTGW6BEJP

### Facebook
- **Pixel ID:** 1164114415287965

### Email
- **De:** aka@resetprimal.com.br
- **SendGrid Key:** (em .env)

### Server
- **IP:** 64.225.44.199
- **Domínio:** resetprimal.com.br
- **Node.js Port:** 3000
- **Nginx Port:** 80 (HTTP) / 443 (HTTPS)

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Erro: "Connection refused" em HTTPS
```bash
# Verificar se Nginx está rodando
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Logs
sudo tail -f /var/log/nginx/reset-primal-error.log
```

### Erro: "Cannot find module"
```bash
# Instalar dependências
cd /var/www/reset-primal
npm install

# Limpar cache
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo na porta 3000
sudo lsof -i :3000

# Matar processo (se necessário)
sudo kill -9 PID

# Ou usar outra porta
PORT=3001 npm start
```

### Erro: SSL Certificate not found
```bash
# Gerar certificado Let's Encrypt
sudo certbot certonly --nginx -d resetprimal.com.br

# Renovar se necessário
sudo certbot renew
```

### Erro: Webhook não recebe dados
```bash
# Verificar se Node.js está rodando
pm2 list
# ou
sudo systemctl status reset-primal

# Reiniciar
pm2 restart all
# ou
sudo systemctl restart reset-primal

# Verificar logs
pm2 logs reset-primal
tail -f /var/www/reset-primal/logs/webhook-hotmart.log
```

---

## 📊 MONITORAMENTO CONTÍNUO

```bash
# Ver status de tudo
watch -n 2 'echo "=== NGINX ===" && \
  sudo systemctl status nginx --no-pager | head -5 && \
  echo "" && echo "=== NODE.JS ===" && \
  pm2 status'

# Ver logs em tempo real (em 3 abas diferentes)
# Aba 1: Nginx access
sudo tail -f /var/log/nginx/reset-primal-access.log

# Aba 2: Nginx errors
sudo tail -f /var/log/nginx/reset-primal-error.log

# Aba 3: Node.js logs
pm2 logs reset-primal
```

---

## 🎉 DEPLOYMENT CONCLUÍDO!

Quando tudo estiver funcionando:
1. Acessar https://resetprimal.com.br
2. Fazer uma compra teste em Hotmart
3. Verificar se:
   - ✅ Webhook disparou
   - ✅ Email foi enviado
   - ✅ GA4 rastreou compra
   - ✅ Facebook rastreou compra
4. Comemorar! 🎊

---

**Tempo total:** ~30 minutos
**Dificuldade:** ⭐⭐⭐ (Intermediária)
**Precisa de ajuda?** Consulte `ESTRUTURA-PRODUCAO-VALIDADA.md`

Preparado por: Claude Code (Morgan - PM)
Data: 28 janeiro 2026
