# 🖥️ IMPLEMENTAÇÃO DEVOPS - STEP BY STEP
## Reset Primal - Nginx + SSL + PM2 + Logs

**Data:** 27 de janeiro de 2026  
**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Ambiente:** Linux (Ubuntu 20.04+) com Nginx  

---

## 📋 ANTES DE COMEÇAR

### Pré-requisitos:
- [ ] Acesso SSH ao servidor
- [ ] Domínio `resetprimal.com.br` apontando para IP do servidor
- [ ] Nginx instalado
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Sudo access

### Verificar Ambiente:

```bash
# Verificar Node.js
node --version
npm --version

# Verificar Nginx
nginx -v

# Verificar Git
git --version

# Verificar acesso sudo
sudo echo "OK"
```

---

## ✅ TASK 1: ESTRUTURA DE PRODUÇÃO
**Tempo:** 30 minutos  
**Resultado:** Diretórios configurados e arquivos em lugar correto

### 1.1 - Criar Estrutura de Pastas

```bash
# Criar diretório principal
sudo mkdir -p /var/www/reset-primal
sudo mkdir -p /var/www/reset-primal/landing-page
sudo mkdir -p /var/www/reset-primal/ebook
sudo mkdir -p /var/www/reset-primal/api
sudo mkdir -p /var/www/reset-primal/logs
sudo mkdir -p /var/www/reset-primal/scripts

# Definir proprietário (seu usuário)
sudo chown -R $USER:$USER /var/www/reset-primal
sudo chmod -R 755 /var/www/reset-primal
```

### 1.2 - Estrutura Final

```bash
# Verificar que foi criado
ls -la /var/www/reset-primal/

# Esperado:
# drwxr-xr-x  landing-page
# drwxr-xr-x  ebook
# drwxr-xr-x  api
# drwxr-xr-x  logs
# drwxr-xr-x  scripts
```

### 1.3 - Clone/Setup da Aplicação

```bash
# Se usar git (recomendado):
cd /var/www/reset-primal
git clone https://seu-repo.git .

# Ou copiar arquivos manualmente:
# cp -r /source/landing-page /var/www/reset-primal/
# cp -r /source/ebook /var/www/reset-primal/
# cp -r /source/api /var/www/reset-primal/
```

### 1.4 - Setup da Aplicação Node.js

```bash
# Entrar na pasta api
cd /var/www/reset-primal/api

# Instalar dependências
npm install

# Verificar que tudo instalou
ls -la node_modules/ | wc -l
# Esperado: 100+ pastas

# Criar arquivo .env (copiar de template)
cp .env.example .env

# Editar .env com credenciais reais
nano .env
# (Editar: HOTMART_WEBHOOK_SECRET, SENDGRID_API_KEY, etc)
```

### 1.5 - Criar Arquivo de Logs

```bash
# Criar arquivo de log
touch /var/www/reset-primal/logs/app.log
touch /var/www/reset-primal/logs/webhook.log
touch /var/www/reset-primal/logs/error.log

# Definir permissões
chmod 755 /var/www/reset-primal/logs/
chmod 644 /var/www/reset-primal/logs/*.log

# Verificar
ls -la /var/www/reset-primal/logs/
```

### 1.6 - Criar Script de Startup

**Arquivo: `/var/www/reset-primal/scripts/start.sh`**

```bash
#!/bin/bash

# Script de inicialização da aplicação

cd /var/www/reset-primal/api

# Carregar variáveis de ambiente
export $(cat .env | grep -v '#' | xargs)

# Iniciar servidor
node server.js >> /var/www/reset-primal/logs/app.log 2>&1
```

**Dar permissão de execução:**

```bash
chmod +x /var/www/reset-primal/scripts/start.sh
```

✅ **TASK 1 CONCLUÍDA**

---

## ✅ TASK 2: CONFIGURAR NGINX
**Tempo:** 1 hora  
**Resultado:** Nginx servindo LP + E-book + Proxy webhook

### 2.1 - Criar Arquivo de Configuração Nginx

**Arquivo: `/etc/nginx/sites-available/resetprimal.com.br`**

```bash
# Criar arquivo
sudo nano /etc/nginx/sites-available/resetprimal.com.br
```

**Conteúdo do arquivo:**

```nginx
# ════════════════════════════════════════════════════════
# REDIRECIONAR HTTP → HTTPS
# ════════════════════════════════════════════════════════
server {
    listen 80;
    listen [::]:80;
    server_name resetprimal.com.br www.resetprimal.com.br;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/reset-primal;
    }
    
    # Redirecionar tudo para HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# ════════════════════════════════════════════════════════
# SERVIDOR HTTPS (PRINCIPAL)
# ════════════════════════════════════════════════════════
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name resetprimal.com.br www.resetprimal.com.br;
    
    # Raiz dos arquivos estáticos
    root /var/www/reset-primal;
    index index.html;
    
    # ════════════════════════════════════════════════════
    # SSL/TLS (Let's Encrypt)
    # ════════════════════════════════════════════════════
    ssl_certificate /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resetprimal.com.br/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # ════════════════════════════════════════════════════
    # GZIP Compression
    # ════════════════════════════════════════════════════
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;
    
    # ════════════════════════════════════════════════════
    # LANDING PAGE (RAIZ)
    # ════════════════════════════════════════════════════
    location / {
        try_files $uri $uri/ /landing-page/grand-slam/index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML não deve ser cacheado (muda frequente)
        location ~* \.html$ {
            expires 1d;
            add_header Cache-Control "public, must-revalidate";
        }
        
        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
    
    # ════════════════════════════════════════════════════
    # E-BOOK
    # ════════════════════════════════════════════════════
    location /ebook {
        alias /var/www/reset-primal/ebook/diagramacao;
        try_files $uri $uri/ /ebook/diagramacao/index.html;
        
        # Cache para e-book assets
        location ~* \.(js|css|jpg|png|gif)$ {
            expires 7d;
            add_header Cache-Control "public";
        }
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # ════════════════════════════════════════════════════
    # WEBHOOK HOTMART (PROXY para Node.js)
    # ════════════════════════════════════════════════════
    location /webhook/hotmart {
        proxy_pass http://localhost:3000/webhook/hotmart;
        proxy_http_version 1.1;
        
        # Headers necessários
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts generosos para webhook
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # ════════════════════════════════════════════════════
    # PÁGINA DE SUCESSO (após compra)
    # ════════════════════════════════════════════════════
    location /sucesso {
        default_type text/html;
        return 200 '
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Compra Confirmada! 🎉</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                h1 { color: #4CAF50; }
                a { background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>Compra Confirmada! 🎉</h1>
            <p>Sua compra foi bem-sucedida.</p>
            <p>Verifique seu email para instruções.</p>
            <a href="/ebook">Ir para E-book →</a>
        </body>
        </html>
        ';
    }
    
    # ════════════════════════════════════════════════════
    # NEGAR ACESSO A ARQUIVOS SENSÍVEIS
    # ════════════════════════════════════════════════════
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ^/\.env {
        deny all;
        access_log off;
    }
    
    location ~ ^/api/ {
        deny all;
    }
    
    # ════════════════════════════════════════════════════
    # LOGS
    # ════════════════════════════════════════════════════
    access_log /var/www/reset-primal/logs/nginx_access.log;
    error_log /var/www/reset-primal/logs/nginx_error.log warn;
}
```

### 2.2 - Habilitar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/resetprimal.com.br \
           /etc/nginx/sites-enabled/

# Verificar se não está duplicado
ls -la /etc/nginx/sites-enabled/

# Testar sintaxe
sudo nginx -t

# Esperado:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 2.3 - Reiniciar Nginx

```bash
# Reiniciar
sudo systemctl restart nginx

# Verificar status
sudo systemctl status nginx

# Esperado: active (running)

# Ver logs
sudo tail -f /var/www/reset-primal/logs/nginx_error.log
```

### 2.4 - Testar Nginx

```bash
# Testar acesso HTTP (deve redirecionar para HTTPS)
curl -I http://resetprimal.com.br

# Esperado: HTTP/1.1 301 Moved Permanently
# Location: https://resetprimal.com.br/

# Testar acesso HTTPS (vai falhar porque não tem SSL ainda)
curl https://resetprimal.com.br

# Esperado: curl: (60) SSL: no certificate has been provided
# (Isso é normal, vamos setup SSL no próximo step)
```

✅ **TASK 2 CONCLUÍDA**

---

## ✅ TASK 3: CONFIGURAR SSL/HTTPS
**Tempo:** 30 minutos  
**Resultado:** Certificado Let's Encrypt instalado e HTTPS funcionando

### 3.1 - Instalar Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Verificar instalação
certbot --version

# Esperado: certbot 2.x.x
```

### 3.2 - Gerar Certificado

```bash
# Gerar certificado (Nginx vai tentar verificar automaticamente)
sudo certbot certonly --nginx -d resetprimal.com.br -d www.resetprimal.com.br

# Responder aos prompts:
# Enter email address: seu_email@gmail.com
# Agree to terms: Y
# Share email: N (optional)

# Esperado: Successfully received certificate
# Certificate is saved at: /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem
```

### 3.3 - Verificar Certificado

```bash
# Listar certificados
certbot certificates

# Esperado: Certificate Name: resetprimal.com.br
#          Expiry Date: 202X-XX-XX
#          Renewal is not due

# Ver detalhes do certificado
sudo openssl x509 -in /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem -text -noout | head -20
```

### 3.4 - Configurar Auto-Renew

```bash
# Habilitar timer de renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verificar status
sudo systemctl status certbot.timer

# Testar renovação seca (não faz nada, só testa)
sudo certbot renew --dry-run

# Esperado: Congratulations, all renewals succeeded
```

### 3.5 - Testar HTTPS

```bash
# Testar acesso HTTPS
curl -I https://resetprimal.com.br

# Esperado: HTTP/1.1 200 OK

# Testar em navegador
# Abra: https://resetprimal.com.br
# Deve carregar a LP sem avisos de certificado

# Verificar certificado (em navegador)
# Clique no ícone de cadeado → View certificate
# Deve mostrar: resetprimal.com.br, válido por 90 dias
```

### 3.6 - Verificar Força SSL

```bash
# Teste online (opcional)
# Abra: https://www.ssllabs.com/ssltest/analyze.html?d=resetprimal.com.br
# Deve ter grade A ou A+
```

✅ **TASK 3 CONCLUÍDA**

---

## ✅ TASK 4: CONFIGURAR PM2
**Tempo:** 30 minutos  
**Resultado:** Node.js webhook rodando com PM2 e auto-restart

### 4.1 - Instalar PM2

```bash
# Instalar globalmente
sudo npm install -g pm2

# Verificar
pm2 --version

# Esperado: 5.x.x+
```

### 4.2 - Criar Arquivo de Configuração PM2

**Arquivo: `/var/www/reset-primal/ecosystem.config.js`**

```javascript
module.exports = {
  apps: [
    {
      name: 'reset-primal-webhook',
      script: './api/server.js',
      cwd: '/var/www/reset-primal',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/www/reset-primal/logs/pm2-error.log',
      out_file: '/var/www/reset-primal/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### 4.3 - Iniciar Aplicação com PM2

```bash
# Entrar na pasta
cd /var/www/reset-primal

# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Esperado:
# ┌─────────────────────────────┬─────┬──────────┬──────┬───────────┐
# │ Name                        │ id  │ mode     │ ↺    │ status    │
# ├─────────────────────────────┼─────┼──────────┼──────┼───────────┤
# │ reset-primal-webhook        │ 0   │ cluster  │ 0    │ online    │
# └─────────────────────────────┴─────┴──────────┴──────┴───────────┘

# Ver logs em tempo real
pm2 logs reset-primal-webhook
```

### 4.4 - Configurar Startup Automático

```bash
# Gerar comando de startup
pm2 startup

# Resultado: você vai receber um comando para copiar e executar
# Exemplo: sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u usuario --hp /home/usuario
# COPIAR E EXECUTAR

# Salvar configuração
pm2 save

# Verificar que foi salvo
pm2 startup

# Esperado: [PM2] You have to run this command as root
#           [PM2] Copy the following command and execute it:
#           [PM2] sudo ... (já executado anteriormente)
```

### 4.5 - Testar Auto-Restart

```bash
# Verificar que webhook está rodando
curl http://localhost:3000

# Esperado: {"status":"OK",...}

# Simular crash (reinicia em 4 segundos)
pm2 kill
sleep 5
pm2 status

# Esperado: webhook está online novamente (auto-reiniciou)

# Ver histórico de restarts
pm2 show reset-primal-webhook
```

### 4.6 - Configurar Monitoramento

```bash
# Ver dashboard com info de memória/CPU
pm2 monit

# Sair: Ctrl+C

# Gerar relatório
pm2 report

# Ver logs formatados
pm2 logs reset-primal-webhook --lines 50
```

✅ **TASK 4 CONCLUÍDA**

---

## ✅ TASK 5: TESTAR FLUXO COMPLETO
**Tempo:** 30 minutos  
**Resultado:** Toda infraestrutura validada

### 5.1 - Verificar Serviços

```bash
# Nginx
sudo systemctl status nginx
# Esperado: active (running)

# PM2
pm2 status
# Esperado: reset-primal-webhook | online

# Certificado
certbot certificates
# Esperado: Certificate Name: resetprimal.com.br, valid
```

### 5.2 - Testar URLs

```bash
# Landing Page (HTTP → HTTPS)
curl -I http://resetprimal.com.br
# Esperado: HTTP/1.1 301 Moved Permanently
# Location: https://resetprimal.com.br

# Landing Page (HTTPS)
curl -I https://resetprimal.com.br
# Esperado: HTTP/1.1 200 OK

# E-book
curl -I https://resetprimal.com.br/ebook
# Esperado: HTTP/1.1 200 OK

# Webhook (GET - deve retornar erro 405, GET não permitido)
curl -I https://resetprimal.com.br/webhook/hotmart
# Esperado: HTTP/1.1 405 Method Not Allowed

# Webhook (POST - vai dar erro 401 sem signature, é esperado)
curl -X POST https://resetprimal.com.br/webhook/hotmart \
  -d '{}' -H 'Content-Type: application/json' \
  -v

# Esperado: HTTP/1.1 401 Unauthorized
# {"error":"Invalid signature"}
```

### 5.3 - Verificar Logs

```bash
# Nginx access log
tail -f /var/www/reset-primal/logs/nginx_access.log

# Nginx error log
tail -f /var/www/reset-primal/logs/nginx_error.log

# PM2 log
pm2 logs reset-primal-webhook

# Esperado: Sem erros, apenas acessos normais
```

### 5.4 - Teste de Webhook via Hotmart

**Quando Backend estiver pronto:**

1. Configure webhook URL em Hotmart: `https://resetprimal.com.br/webhook/hotmart`
2. Clique em "Enviar Teste"
3. Verifique que:
   - Nginx log mostra POST em `/webhook/hotmart`
   - PM2 log mostra webhook recebido
   - Dados foram salvos em BD
   - Email foi enviado

✅ **TASK 5 CONCLUÍDA**

---

## 📋 VALIDAÇÃO FINAL - CHECKLIST DEVOPS

### Estrutura
- [ ] `/var/www/reset-primal/` criado com permissões OK?
- [ ] Landing page em `landing-page/grand-slam/`?
- [ ] E-book em `ebook/diagramacao/`?
- [ ] API em `api/` com `npm install` feito?
- [ ] Pastas de logs criadas?

### Nginx
- [ ] Arquivo `/etc/nginx/sites-available/resetprimal.com.br` criado?
- [ ] Link em `/etc/nginx/sites-enabled/` criado?
- [ ] `nginx -t` passou?
- [ ] Nginx status é `active (running)`?

### SSL
- [ ] Certificado Let's Encrypt em `/etc/letsencrypt/live/resetprimal.com.br/`?
- [ ] `certbot certificates` mostra certificado válido?
- [ ] Auto-renew configurado e testado?

### PM2
- [ ] PM2 instalado globalmente?
- [ ] `ecosystem.config.js` criado?
- [ ] `pm2 status` mostra webhook online?
- [ ] `pm2 save` foi executado?
- [ ] Startup automático configurado?

### Testes
- [ ] `curl -I http://resetprimal.com.br` redireciona para HTTPS?
- [ ] `curl -I https://resetprimal.com.br` retorna 200?
- [ ] `curl -I https://resetprimal.com.br/ebook` retorna 200?
- [ ] `curl -X POST /webhook/hotmart` retorna 401 (sem signature)?

### Logs
- [ ] Nginx access log registra requisições?
- [ ] PM2 log está limpo (sem erros)?
- [ ] Node.js webhook log mostra atividade?

---

## 🧪 TESTE PONTA-A-PONTA

### Teste 1: Fluxo Completo
```
1. Abrir navegador: https://resetprimal.com.br
2. Esperado:
   ✅ LP carrega sem avisos SSL
   ✅ Cadeado verde indica certificado válido
   ✅ Botões CTA presentes e clicáveis
   ✅ Responsividade OK (mobile + desktop)

3. Scroll até fundo
4. Clique botão CTA
5. Esperado:
   ✅ GA4 rastreando clique
   ✅ FB Pixel rastreando evento
   ✅ Abre nova aba com Hotmart
```

### Teste 2: E-book
```
1. Abrir: https://resetprimal.com.br/ebook
2. Esperado:
   ✅ E-book carrega
   ✅ 180 páginas navegáveis
   ✅ Sem erros 404
   ✅ Imagens carregam
```

### Teste 3: Webhook
```
(Quando Backend estiver pronto)

1. Hotmart dashboard → Webhooks → Teste
2. Esperado:
   ✅ Nginx log: POST /webhook/hotmart 200
   ✅ PM2 log: "Venda nova!"
   ✅ Dados em BD
   ✅ Email recebido
   ✅ Telegram notificado
```

### Teste 4: Performance
```
# Medir tempo de carregamento
curl -w "@curl-format.txt" -o /dev/null -s https://resetprimal.com.br

# Ou usar: https://www.webpagetest.org/

# Esperado:
✅ LP carrega em < 2s
✅ E-book carrega em < 1s
✅ Webhook responde em < 200ms
```

---

## ⚠️ TROUBLESHOOTING

### Problema: "Address already in use :3000"
**Solução:**
```bash
# Encontrar processo rodando em :3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Reiniciar PM2
pm2 restart reset-primal-webhook
```

### Problema: Nginx não reconhece certificado
**Solução:**
```bash
# Verificar certificado existe
ls -la /etc/letsencrypt/live/resetprimal.com.br/

# Regenerar se necessário
sudo certbot certonly --nginx -d resetprimal.com.br --force-renewal

# Recarregar Nginx
sudo systemctl reload nginx
```

### Problema: "502 Bad Gateway"
**Solução:**
```bash
# Verificar que webhook está rodando
pm2 status

# Se offline, reiniciar
pm2 restart reset-primal-webhook

# Ver logs de erro
pm2 logs reset-primal-webhook | grep ERROR

# Verificar que ouve em porta 3000
netstat -tlnp | grep 3000
```

### Problema: Webhook recebe mas não processa
**Solução:**
```bash
# Ver logs detalhados
pm2 logs reset-primal-webhook --lines 100

# Verificar .env em produção
cat /var/www/reset-primal/api/.env

# Verificar permissões de arquivo
ls -la /var/www/reset-primal/api/server.js
```

### Problema: "Too many certificates already issued"
**Solução:**
```bash
# Se erro de rate limit do Let's Encrypt
# Aguarde 7 dias ou use staging:

sudo certbot certonly --nginx -d resetprimal.com.br --test-mode

# Depois use cert real quando passed

# Ver limites usados
curl https://certs.isrg.org/
```

---

## 🔍 MONITORAMENTO CONTÍNUO

### Health Check Diário

```bash
# Criar script de health check
cat > /var/www/reset-primal/scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "=== Health Check Reset Primal ==="
echo ""

# 1. Nginx
echo "1. Nginx:"
sudo systemctl status nginx | grep active
if [ $? -eq 0 ]; then echo "   ✅ OK"; else echo "   ❌ ERRO"; fi

# 2. PM2
echo "2. PM2 Webhook:"
pm2 status | grep online
if [ $? -eq 0 ]; then echo "   ✅ OK"; else echo "   ❌ ERRO"; fi

# 3. HTTPS
echo "3. HTTPS:"
curl -s -I https://resetprimal.com.br | head -1

# 4. Certificado (dias até expirar)
echo "4. Certificado:"
certbot certificates | grep expiry

# 5. Webhook
echo "5. Webhook:"
curl -s http://localhost:3000 | grep status

echo ""
echo "=== End Health Check ==="
EOF

chmod +x /var/www/reset-primal/scripts/health-check.sh
```

**Executar:**
```bash
/var/www/reset-primal/scripts/health-check.sh
```

### Cron Job para Monitoramento Automático

```bash
# Abrir crontab
crontab -e

# Adicionar linha (verifica cada 6 horas):
0 */6 * * * /var/www/reset-primal/scripts/health-check.sh >> /var/www/reset-primal/logs/health-check.log 2>&1

# Salvar: Ctrl+X, Y, Enter
```

---

## 🎯 PRÓXIMO PASSO

Quando terminar esta task:

1. ✅ **Verificar que tudo funciona:**
   - [ ] Nginx servindo LP e E-book
   - [ ] SSL/HTTPS ativo
   - [ ] PM2 webhook rodando
   - [ ] Logs configurados
   - [ ] Todos os testes passando

2. ✅ **Commit seus changes:**
   ```bash
   cd /var/www/reset-primal
   git add .
   git commit -m "chore: configure nginx, ssl, pm2"
   git push
   ```

3. ✅ **Notificar Product Manager:**
   - "DevOps terminou, infraestrutura pronta"
   - URLs finais:
     - LP: https://resetprimal.com.br
     - E-book: https://resetprimal.com.br/ebook
     - Webhook: https://resetprimal.com.br/webhook/hotmart

4. ✅ **Aguardar Frontend + Backend:**
   - Frontend: CTA + GA4 + Pixel
   - Backend: Webhook + BD + Email

---

**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Próximo:** PM testa fluxo completo amanhã

Boa sorte! 🚀

— Morgan, planejando o futuro 📊