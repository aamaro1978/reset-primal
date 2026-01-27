# 🆘 TROUBLESHOOTING - Reset Primal Produção

**Última atualização:** 2025-01-27
**Versão:** 1.0

---

## 🔴 PROBLEMA: Webhook não recebe POST do Hotmart

### Diagnóstico

```bash
# 1. Verificar se webhook está rodando
ps aux | grep "node api/webhook" | grep -v grep
# Ou
pm2 status

# 2. Verificar se porta 3000 está aberta
netstat -tlnp | grep 3000
# Ou
ss -tlnp | grep 3000

# 3. Ver logs do webhook
tail -50 /var/www/reset-primal/logs/webhook-hotmart.log

# 4. Ver logs do PM2
pm2 logs hotmart-webhook --lines 50
```

### Soluções Comuns

**Erro: "Address already in use"**
```bash
# Webhook já está rodando em outra porta
lsof -i :3000  # Ver qual processo
kill -9 <PID>  # Matar
pm2 restart hotmart-webhook
```

**Erro: "Cannot find module"**
```bash
# Dependências não instaladas
cd /var/www/reset-primal
npm install --production
```

**Erro: "ENOENT: no such file or directory, open 'logs/webhook-hotmart.log'"**
```bash
# Criar diretório de logs
mkdir -p /var/www/reset-primal/logs
chmod 755 /var/www/reset-primal/logs
pm2 restart hotmart-webhook
```

**Webhook não recebe POST do Hotmart**
- [ ] Verificar URL no Hotmart: `https://resetprimal.com.br/webhook/hotmart` (HTTPS!)
- [ ] Testar com curl: `curl -X GET https://resetprimal.com.br/health`
- [ ] Verificar firewall: `sudo ufw allow 443` e `sudo ufw allow 80`
- [ ] Verificar DNS: `nslookup resetprimal.com.br` (deve resolver)
- [ ] Verificar Nginx proxy: `sudo nginx -t && sudo systemctl restart nginx`

---

## 🔴 PROBLEMA: Landing Page não carrega

### Diagnóstico

```bash
# Testar acesso
curl -I https://resetprimal.com.br
# Deve retornar: HTTP/1.1 200

# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Ver logs do Nginx
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

### Soluções Comuns

**Erro 404 - Página não encontrada**
```bash
# Verificar path no Nginx
grep "root " /etc/nginx/sites-available/reset-primal
# Deve ser: root /var/www/reset-primal/landing-page;

# Verificar arquivo existe
ls -la /var/www/reset-primal/landing-page/index.html

# Verificar permissões
chmod 644 /var/www/reset-primal/landing-page/index.html
chmod 755 /var/www/reset-primal/landing-page/
```

**Erro 502 Bad Gateway**
```bash
# Webhook proxy não está respondendo
pm2 status  # Verificar se está online
curl http://localhost:3000/health  # Testar localmente

# Se não responde, reiniciar
pm2 restart hotmart-webhook
```

**SSL Certificate erro**
```bash
# Testar certificado
sudo openssl x509 -in /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem -text

# Se expirado, renovar
sudo certbot renew --force-renewal

# Verificar auto-renew
sudo systemctl status certbot.timer
```

---

## 🔴 PROBLEMA: Email não é enviado

### Diagnóstico

```bash
# Ver logs de email
grep "EMAIL" /var/www/reset-primal/logs/webhook-hotmart.log

# Ver erro específico
tail -100 /var/www/reset-primal/logs/webhook-hotmart.log | grep -A 5 "EMAIL"
```

### Soluções Comuns

**Erro: "Invalid login: 535-5.7.8"**
- Credenciais Gmail incorretas
- [ ] Verificar GMAIL_USER está correto
- [ ] Verificar GMAIL_PASSWORD (deve ser app-specific, não a senha normal)
- [ ] Verificar 2FA está ativado em myaccount.google.com
- [ ] Gerar nova app-specific password

**Erro: "Less secure app access"**
- Gmail bloqueou acesso
- [ ] Acessar: https://myaccount.google.com/lesssecureapps
- [ ] Ativar "Allow less secure apps"
- [ ] OU usar app-specific password (melhor)

**Teste manual:**
```bash
cd /var/www/reset-primal

node -e "
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
  subject: 'Teste Email Reset Primal',
  html: '<h1>Teste</h1><p>Se recebeu, email está funcionando!</p>'
}, (err, info) => {
  if (err) console.error('ERRO:', err);
  else console.log('✅ EMAIL ENVIADO:', info.response);
});
"
```

---

## 🟠 PROBLEMA: GA4 não rastreia eventos

### Diagnóstico

```bash
# 1. Verificar ID no HTML
grep "G-PLACEHOLDER\|G-" /var/www/reset-primal/landing-page/index.html | head -1

# 2. Abrir em navegador e verificar console
# (F12 → Console → procurar por "gtag" ou erros)

# 3. Verificar se existe dataLayer
# console: window.dataLayer
```

### Soluções Comuns

**Problema: "G-PLACEHOLDER" ainda no HTML**
```bash
# ID não foi substituído
sed -i 's/G-PLACEHOLDER/G-SEU_ID_REAL/g' /var/www/reset-primal/landing-page/index.html

# Verificar
grep "G-" /var/www/reset-primal/landing-page/index.html | head -1
# Não deve ter PLACEHOLDER
```

**Problema: AdBlock ou extensões bloqueando**
- [ ] Testar em incógnito (sem extensões)
- [ ] Testar em navegador diferente
- [ ] Desativar AdBlock temporariamente

**Problema: GA4 property não existe**
- [ ] Acessar analytics.google.com
- [ ] Verificar se "Reset Primal" property existe
- [ ] Se não, criar novo
- [ ] Copiar ID correto (deve ser G-XXXXXXXXXX)

**Problema: Dados não aparecem em 24h**
- Isso é normal! GA4 pode levar até 24h para processar
- Verificar em Real-time (analytics.google.com → Real-time)
- Se aparecer em Real-time mas não em relatórios, esperar

---

## 🟠 PROBLEMA: Facebook Pixel não rastreia

### Diagnóstico

```bash
# 1. Verificar ID no HTML
grep "PIXEL-PLACEHOLDER\|fbq('init'" /var/www/reset-primal/landing-page/index.html | head -1

# 2. Instalar extensão "Facebook Pixel Helper" no Chrome
# https://chrome.google.com/webstore/detail/facebook-pixel-helper/

# 3. Visitar site e checar na extensão quais eventos foram rastreados
```

### Soluções Comuns

**Problema: "PIXEL-PLACEHOLDER" ainda no HTML**
```bash
# ID não foi substituído
sed -i 's/PIXEL-PLACEHOLDER/SEU_PIXEL_ID/g' /var/www/reset-primal/landing-page/index.html

# Verificar
grep "fbq('init'" /var/www/reset-primal/landing-page/index.html
# Não deve ter PLACEHOLDER
```

**Problema: Pixel Helper mostra "Pixel not found"**
- [ ] Verificar ID está correto
- [ ] Verificar se Pixel existe em business.facebook.com
- [ ] Criar novo Pixel se não existir
- [ ] Atualizar ID no HTML

**Problema: Eventos aparecem mas não conversões**
- Pode levar 1-2 horas para processar
- Verificar em Events Manager (business.facebook.com)
- Se eventos aparecem lá, está funcionando

---

## 🟠 PROBLEMA: SSL Certificate erro

### Diagnóstico

```bash
# Verificar certificado
sudo openssl x509 -in /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem -noout -dates

# Ver dias restantes
sudo certbot certificates

# Testar site
curl -I https://resetprimal.com.br
# Se erro, tentando renovar
```

### Soluções Comuns

**Erro: "Certificate has expired"**
```bash
# Renovar imediatamente
sudo certbot renew --force-renewal

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar
curl -I https://resetprimal.com.br
```

**Erro: "Domain not found"**
```bash
# DNS não aponta para servidor correto
nslookup resetprimal.com.br
# Deve retornar seu IP do servidor

# Verificar em seu registrador (ex: namecheap, godaddy)
# DNS A record deve apontar para: seu_servidor_ip
```

**Erro: "Connection refused" na renovação**
```bash
# Certbot não consegue acessar porta 80
sudo ufw allow 80
sudo ufw reload

# Tentar renovar
sudo certbot renew
```

---

## 🟡 PROBLEMA: Performance lenta

### Diagnóstico

```bash
# Verificar uso de CPU/Memória
top  # Pressionar 'q' para sair

# Verificar Node.js memoria
ps aux | grep "node api/webhook"

# Teste de carga no site
curl -w "@curl-format.txt" -o /dev/null -s https://resetprimal.com.br

# Usar PageSpeed Insights
# https://pagespeed.web.dev/?url=https://resetprimal.com.br
```

### Soluções Comuns

**Webhooks consumindo muita memória**
```bash
# Reiniciar PM2
pm2 restart hotmart-webhook

# Se persistir, otimizar logs
# Limitar tamanho de arquivo de logs
# Criar rotine com logrotate
```

**Landing page lenta**
- [ ] Comprimir imagens (ImageOptim, TinyPNG)
- [ ] Minificar CSS/JS
- [ ] Ativar cache do navegador (já configurado em Nginx)
- [ ] Usar CDN (Cloudflare grátis)

---

## 🟢 PROBLEMA: Tudo está funcionando, mas...

### "Primeira compra chegou mas sem email"
```bash
# Verificar logs
tail -100 /var/www/reset-primal/logs/webhook-hotmart.log | grep "EMAIL"

# Se houver erro, corrigir credenciais Gmail
# Se não houver entrada, webhook não recebeu POST
```

### "GA4 mostra eventos mas valor está zero"
```bash
# Verificar se valor está sendo enviado no evento
grep "gtag('event', 'purchase'" /var/www/reset-primal/landing-page/index.html
# Deve ter 'value': 97.00

# Se não tiver, atualizar HTML
```

### "PM2 não reinicia após reboot"
```bash
# Verificar startup
pm2 startup
# Se não estiver ativo:
pm2 startup systemd -u www-data --hp /var/www

# Depois:
pm2 save
```

---

## 📞 EMERGENCY PROCEDURES

### Se landing page está down

```bash
# 1. Verificar Nginx
sudo systemctl status nginx

# 2. Se não está rodando
sudo systemctl start nginx

# 3. Se dá erro na start
sudo nginx -t  # Ver erro específico

# 4. Se certificado expirou
sudo certbot renew --force-renewal
```

### Se webhook parou

```bash
# 1. Verificar PM2
pm2 status

# 2. Se offline, restart
pm2 restart hotmart-webhook

# 3. Se ainda offline
pm2 delete hotmart-webhook
pm2 start /var/www/reset-primal/api/webhook-hotmart.js --name "hotmart-webhook"

# 4. Se erro ao iniciar, ver logs
tail -50 /var/www/reset-primal/logs/webhook-hotmart.log
```

### Se SSL certbot falhar

```bash
# Parar Nginx
sudo systemctl stop nginx

# Renovar com certonly
sudo certbot certonly --standalone -d resetprimal.com.br

# Iniciar Nginx
sudo systemctl start nginx
```

---

## 💡 DICAS ÚTEIS

### Ver logs em tempo real
```bash
# Webhook
pm2 logs hotmart-webhook --lines 100

# Nginx error
sudo tail -f /var/log/nginx/error.log

# Nginx access
sudo tail -f /var/log/nginx/access.log | grep hotmart
```

### Limpar logs antigos
```bash
# Webhook
> /var/www/reset-primal/logs/webhook-hotmart.log

# Nginx (ativa auto-rotation)
sudo logrotate -f /etc/logrotate.d/nginx
```

### Backup rápido
```bash
# .env (NUNCA commitar!)
cp /var/www/reset-primal/.env ~/backup-.env

# Certificado
sudo cp -r /etc/letsencrypt ~/backup-letsencrypt
```

### Rollback
```bash
# Se deploy quebrou, voltar para versão anterior
git checkout HEAD~1
npm install --production
pm2 restart hotmart-webhook
```

---

## 📞 Quando chamar suporte

Se você já fez tudo acima e ainda não funciona:

1. **Reunir informações:**
   ```bash
   uname -a
   node --version
   nginx -v
   pm2 status
   pm2 logs hotmart-webhook --lines 50
   tail -50 /var/log/nginx/error.log
   ```

2. **Criar ticket com:**
   - Erro exato (mensagem completa)
   - Logs relevantes
   - Passos que já tentou
   - Timeline (quando funcionou, quando parou)

3. **Contato:** [seu email/suporte aqui]

---

**Versão:** 1.0
**Data:** 2025-01-27
**Mantido por:** Reset Primal Team
