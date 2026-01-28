# 🔧 TROUBLESHOOTING GUIDE - Reset Primal

## Problemas Comuns e Soluções

---

## 🔴 FRONTEND

### Problema: GA4 não está rastreando

**Sintomas:**
- Console do navegador sem erros GA4
- GA4 dashboard mostra 0 eventos

**Soluções:**
```bash
# 1. Verificar ID no código
grep -n "G-" landing-page/grand-slam/index.html

# 2. Verificar no console do navegador
console.log(window.gtag ? '✅ GA4 OK' : '❌ GA4 falhou')

# 3. Abrir GA4 Real-time
# → https://analytics.google.com → seu property → Real-time

# 4. Se ainda não funcionar:
# → Limpar cache: Ctrl+Shift+Delete
# → Incognito/Private window para testar
# → Hard refresh: Ctrl+Shift+R
```

### Problema: Facebook Pixel não funciona

**Sintomas:**
- Pixel Helper mostra vermelha
- Eventos não disparam

**Soluções:**
```bash
# 1. Verificar Pixel ID no código
grep -n "123456789012345" landing-page/grand-slam/index.html

# 2. Instalar Pixel Helper
# → Chrome Web Store → Facebook Pixel Helper

# 3. Atualizar Pixel ID
# → Ir em: business.facebook.com
# → Verificar ID correto
# → Copiar para código

# 4. Testar inicialização
console.log(window.fbq ? '✅ Pixel OK' : '❌ Pixel falhou')
```

### Problema: CTA não redireciona para Hotmart

**Sintomas:**
- Botão não funciona
- Abre página em branco
- URL incorreta

**Soluções:**
```bash
# 1. Verificar URL no código
grep -n "pay.hotmart.com" landing-page/grand-slam/index.html

# 2. Testar link manualmente
# → Abrir em navegador
# → Deve ir para página Hotmart

# 3. Verificar sintaxe HTML
grep -n 'href="https://pay.hotmart' landing-page/grand-slam/index.html

# 4. Se link está errado:
# → Obter novo link de Hotmart dashboard
# → Atualizar todos 3 botões CTA
# → Testar novamente
```

---

## 🔧 BACKEND

### Problema: Webhook não recebe dados Hotmart

**Sintomas:**
- Hotmart teste webhook falha
- Nenhum log no servidor
- HTTP 500 error

**Soluções:**
```bash
# 1. Verificar se Node.js está rodando
pm2 status
# Esperado: reset-primal-webhook → online

# 2. Reiniciar se offline
pm2 start ecosystem.config.js

# 3. Verificar logs
pm2 logs reset-primal-webhook

# 4. Testar webhook manualmente
bash scripts/test-webhook.sh

# 5. Verificar credenciais .env
grep HOTMART /var/www/reset-primal/api/.env

# 6. Se configuração está errada:
# → Obter novo secret de Hotmart
# → Editar .env
# → Fazer restart: pm2 restart reset-primal-webhook
```

### Problema: Email não é enviado após webhook

**Sintomas:**
- Webhook recebe OK (status 200)
- Email nunca chega
- Sem logs de email

**Soluções:**
```bash
# 1. Verificar logs detalhados
pm2 logs reset-primal-webhook | grep -i email

# 2. Verificar credenciais SendGrid
grep SENDGRID /var/www/reset-primal/api/.env

# 3. Se API key está errada:
# → Ir em: sendgrid.com → Settings → API Keys
# → Gerar novo key
# → Atualizar .env
# → Restart: pm2 restart reset-primal-webhook

# 4. Testar SendGrid diretamente
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"sender@example.com"},"subject":"Test","content":[{"type":"text/plain","value":"Hello"}]}'

# 5. Se email ainda não funciona:
# → Verificar pasta spam
# → Verificar se domínio está verificado em SendGrid
# → Usar Gmail como backup
```

### Problema: Banco de dados não está salvando vendas

**Sintomas:**
- Webhook responde 200
- Dados não aparecem no banco
- Sem erro de database

**Soluções:**
```bash
# 1. Verificar se banco existe
ls -la /var/www/reset-primal/api/dev.db

# 2. Se não existe, criar
cd /var/www/reset-primal/api
npx prisma migrate dev --name init

# 3. Verificar schema Prisma
cat prisma/schema.prisma | grep -A 10 "model Venda"

# 4. Testar query manual
sqlite3 dev.db "SELECT * FROM Venda;"

# 5. Se banco quebrado, fazer reset
cd /var/www/reset-primal/api
rm dev.db
npx prisma migrate dev --name init
pm2 restart reset-primal-webhook
```

---

## 🌐 NGINX/DEVOPS

### Problema: Site não está acessível em HTTPS

**Sintomas:**
- HTTPS não funciona
- Certificado inválido
- Aviso de segurança

**Soluções:**
```bash
# 1. Testar conectividade
curl https://resetprimal.com.br -I

# 2. Verificar se Nginx está rodando
sudo systemctl status nginx

# 3. Testar config Nginx
sudo nginx -t

# 4. Se config incorreta, reverter
sudo cp /etc/nginx/sites-available/resetprimal.com.br.bak \
        /etc/nginx/sites-available/resetprimal.com.br
sudo systemctl reload nginx

# 5. Verificar certificado SSL
sudo openssl x509 -in /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem \
                   -noout -text | grep -A 2 "Validity"

# 6. Se certificado expirado
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Problema: Landing page não carrega, E-book funciona

**Sintomas:**
- GET https://resetprimal.com.br → 404
- GET https://resetprimal.com.br/ebook → 200
- Nginx funciona

**Soluções:**
```bash
# 1. Verificar configuração location raiz
grep -A 5 'location / {' /etc/nginx/sites-available/resetprimal.com.br

# 2. Verificar arquivo existe
ls -la /var/www/reset-primal/landing-page/grand-slam/index.html

# 3. Se não existe:
# → Frontend Dev fez push?
# → Pull código: cd /var/www/reset-primal && git pull
# → Verificar novamente: curl https://resetprimal.com.br

# 4. Se arquivo existe mas não carrega:
# → Permissões podem estar erradas
sudo chown -R www-data:www-data /var/www/reset-primal
sudo chmod -R 755 /var/www/reset-primal
```

### Problema: 502 Bad Gateway

**Sintomas:**
- HTTPS carrega mas mostra 502
- Nginx está OK
- Webhook quebrado

**Soluções:**
```bash
# 1. Verificar se Node.js webhook está rodando
pm2 status reset-primal-webhook

# 2. Se offline, iniciar
pm2 start ecosystem.config.js

# 3. Verificar porta 3000
lsof -i :3000

# 4. Se porta ocupada por outro processo
# → Matar processo
kill -9 [PID]
# → Reiniciar webhook
pm2 start ecosystem.config.js

# 5. Verificar logs Node.js
pm2 logs reset-primal-webhook -n 50

# 6. Se erro de módulo:
cd /var/www/reset-primal/api
npm install
pm2 restart reset-primal-webhook
```

### Problema: Certificado SSL expira em menos de 7 dias

**Sintomas:**
- Health check avisa expirando
- Aviso de segurança pode aparecer
- Time running out

**Soluções:**
```bash
# 1. Verificar expiração
echo | openssl s_client -servername resetprimal.com.br \
      -connect resetprimal.com.br:443 2>/dev/null | \
      openssl x509 -noout -dates

# 2. Se expirando, renovar AGORA
sudo certbot renew --force-renewal --no-eff-email

# 3. Verificar se foi renovado
sudo ls -la /etc/letsencrypt/live/resetprimal.com.br/

# 4. Recarregar Nginx
sudo systemctl reload nginx

# 5. Testar renovação automática
sudo systemctl status certbot.timer
```

---

## 📊 PRODUTO/COORDENAÇÃO

### Problema: PM2 está consumindo muita memória

**Sintomas:**
- Servidor lento
- PM2 mostra alto % memory
- Sistema quase travando

**Soluções:**
```bash
# 1. Verificar uso de memória
pm2 monit

# 2. Verificar limite configurado
cat /var/www/reset-primal/api/ecosystem.config.js | grep max_memory

# 3. Se limite baixo, aumentar
# → Editar ecosystem.config.js
# → max_memory_restart: '1000M' (aumentar de 500M para 1000M)
# → pm2 restart all

# 4. Se problema continua:
# → Pode haver memory leak
# → Verificar logs para padrão
# → Contactar Backend Dev para análise
```

### Problema: Equipe perdeu contato com documentação

**Sintomas:**
- Ninguém sabe o que fazer
- Links quebrados
- Documentação desapareceu

**Soluções:**
```bash
# 1. Todos os docs estão aqui:
ls -la /Users/acacioamaro/Projects/reset-primal/IMPLEMENTACAO-*

# 2. Compartilhar links novamente
# DELEGACAO-RESUMO.txt (5 min overview)
# DELEGACAO-POR-ESPECIALIDADE.md (detalhado)
# IMPLEMENTACAO-[ROLE]-STEP-BY-STEP.md (seu role específico)

# 3. Se git está fora de sync
cd /Users/acacioamaro/Projects/reset-primal
git pull origin main

# 4. Se documentação está desatualizada
git log --oneline | head -10
# → Encontrar commit com alteração
# → Checkout se necessário
```

---

## 🆘 EMERGÊNCIA - TUDO QUEBROU

### Opção 1: Reset Rápido (5 minutos)

```bash
# 1. Parar tudo
pm2 kill
sudo systemctl stop nginx

# 2. Fazer backup
cp -r /var/www/reset-primal /var/www/reset-primal-BACKUP-$(date +%s)

# 3. Limpar cache/temp
rm -rf /var/www/reset-primal/api/node_modules/.cache
pm2 cache clear

# 4. Reinstalar
cd /var/www/reset-primal/api
npm install
pm2 start ecosystem.config.js

# 5. Reiniciar services
sudo systemctl start nginx

# 6. Testar
curl https://resetprimal.com.br
```

### Opção 2: Rollback Completo (10 minutos)

```bash
# Execute script de emergência
bash scripts/rollback.sh
```

### Opção 3: Contactar Emergência

```
DevOps: [TELEFONE/SLACK]
Backend: [TELEFONE/SLACK]
Product Manager: [TELEFONE/SLACK]
```

---

## ✅ CHECKLIST DE DIAGNÓSTICO RÁPIDO

```
1. [ ] Frontend
   [ ] GA4 está carregando? (console.log)
   [ ] Pixel Helper mostra verde?
   [ ] CTA redirecionam para Hotmart?

2. [ ] Backend
   [ ] pm2 status mostra online?
   [ ] pm2 logs mostra atividade?
   [ ] Test webhook com: bash scripts/test-webhook.sh

3. [ ] DevOps/Nginx
   [ ] sudo systemctl status nginx (active?)
   [ ] sudo nginx -t (ok?)
   [ ] curl https://resetprimal.com.br (200?)

4. [ ] SSL
   [ ] curl -v https://resetprimal.com.br (sem avisos?)
   [ ] Certificado válido?

5. [ ] Database
   [ ] Dados sendo salvos?
   [ ] Emails sendo enviados?
   [ ] Logs mostram sucesso?
```

---

## 📞 ESCALAÇÃO

**Problema não resolvido?**

1. Reúna informações:
   - Mensagem de erro exato
   - Logs completos
   - Passos para reproduzir

2. Contacte:
   - Se Frontend: @frontend-dev no Slack
   - Se Backend: @backend-dev no Slack
   - Se DevOps: @devops no Slack
   - Se crítico: @product-manager

3. Inclua no ticket:
   - Nome do problema
   - O que você tentou
   - Resultado esperado vs real
   - Logs relevantes

---

**Guia criado:** 27 de janeiro de 2026
**Status:** Pronto para usar
**Última atualização:** [Data]

Boa sorte! 🚀
