# ESTRUTURA DE PRODUÇÃO - Reset Primal
## Arquitetura Completa: LP → Hotmart → E-book

**Status:** CRÍTICO - Clarificar ANTES de lançar  
**Impacto:** Sem clareza de estrutura, deployment é arriscado  
**Tempo para ler:** ~20 minutos  

---

## 1. VISÃO GERAL DO FLUXO

```
                    VISITANTE
                        ↓
            https://resetprimal.com.br
            (LANDING PAGE - Nginx)
                        ↓
                  Lê conteúdo
                  Clica CTA
                        ↓
        https://pay.hotmart.com/S96024805Y
            (HOTMART CHECKOUT)
                        ↓
            Preenche: email, CPF, cartão
                        ↓
                  Hotmart processa
                        ↓
        ┌─── SUCESSO ───┐ └─── ERRO ───┐
        ↓                               ↓
    Webhook POST          Tela de erro (retry)
    /webhook/hotmart
        ↓
    Seu servidor:
    1. Recebe dados
    2. Registra em BD
    3. Envia email
        ↓
    Email: "Seu e-book está pronto!"
    Link: https://resetprimal.com.br/ebook
        ↓
    https://resetprimal.com.br/ebook
    (E-BOOK VIEWER - HTML/CSS)
        ↓
    Lê e-book (180 páginas)
```

---

## 2. ARQUITETURA FÍSICA

### 2.1 Domínios

| Domínio | Servidor | Porta | Protocolo | Conteúdo |
|---------|----------|-------|-----------|----------|
| **resetprimal.com.br** | SEU IP/Nginx | 443 | HTTPS | Landing Page + E-book + Webhooks |
| **pay.hotmart.com** | Hotmart | 443 | HTTPS | Checkout (gerenciado por eles) |

### 2.2 Estrutura de Arquivos (no seu servidor)

```
/var/www/reset-primal/
├── landing-page/
│   └── grand-slam/
│       └── index.html           ← LANDING PAGE PRINCIPAL
│           ├── HTML (completo)
│           ├── CSS (embarcado)
│           ├── JS (scripts inline)
│           └── Meta tags (GA4, FB Pixel)
│
├── ebook/
│   └── diagramacao/
│       ├── index.html           ← E-BOOK VIEWER
│       ├── sumario.html
│       ├── capitulos/
│       │   ├── cap01.html
│       │   ├── cap02.html
│       │   ├── ... (70+ capítulos)
│       │   └── cap99.html
│       ├── css/
│       │   └── styles.css       ← E-book styles
│       ├── js/
│       │   └── app.js          ← E-book scripts
│       └── images/
│           └── ... (imagens do e-book)
│
├── api/
│   └── webhook.js              ← WEBHOOK HOTMART
│       (Recebe notificações de vendas)
│
├── uploads/
│   └── (se tiver upload de arquivo)
│
├── logs/
│   ├── webhooks.log
│   ├── errors.log
│   └── access.log
│
└── .env                         ← VARIÁVEIS (NÃO fazer commit!)
    (HOTMART_WEBHOOK_SECRET, GA4_ID, FB_PIXEL, etc)
```

### 2.3 Nginx Configuration

**Arquivo:** `/etc/nginx/sites-available/resetprimal.com.br`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name resetprimal.com.br;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name resetprimal.com.br;
    
    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resetprimal.com.br/privkey.pem;
    
    # Raiz dos arquivos
    root /var/www/reset-primal;
    index index.html;
    
    # ════════════════════════════════════════════
    # LANDING PAGE (raiz)
    # ════════════════════════════════════════════
    location / {
        try_files $uri $uri/ /landing-page/grand-slam/index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache: HTML não cache (muda frequente)
        # CSS/JS cache por 30 dias
        location ~* \.(css|js|jpg|jpeg|png|gif|svg)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # ════════════════════════════════════════════
    # E-BOOK
    # ════════════════════════════════════════════
    location /ebook {
        alias /var/www/reset-primal/ebook/diagramacao;
        try_files $uri $uri/ /ebook/diagramacao/index.html;
        
        # Cache para assets
        location ~* \.(css|js|jpg|png|gif)$ {
            expires 7d;
            add_header Cache-Control "public";
        }
    }
    
    # ════════════════════════════════════════════
    # WEBHOOK HOTMART (API)
    # ════════════════════════════════════════════
    location /webhook/hotmart {
        # Proxy para Node.js rodando em porta 3000
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout: webhook pode levar alguns segundos
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Headers customizados
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ════════════════════════════════════════════
    # PÁGINA DE SUCESSO (após compra)
    # ════════════════════════════════════════════
    location /sucesso {
        return 200 "<!DOCTYPE html>
        <html>
        <head>
            <title>Compra Confirmada!</title>
            <meta charset='utf-8'>
        </head>
        <body>
            <h1>Compra Confirmada! 🎉</h1>
            <p>Sua compra foi bem-sucedida.</p>
            <p>Verifique seu email para instruções de acesso ao e-book.</p>
            <a href='/ebook'>Ir para E-book →</a>
        </body>
        </html>";
        
        add_header Content-Type text/html;
    }
    
    # ════════════════════════════════════════════
    # PÁGINA DE ERRO (se compra falhar)
    # ════════════════════════════════════════════
    location /erro {
        return 200 "<!DOCTYPE html>
        <html>
        <head>
            <title>Erro na Compra</title>
            <meta charset='utf-8'>
        </head>
        <body>
            <h1>Ops! Erro na Compra ❌</h1>
            <p>Não conseguimos processar seu pagamento.</p>
            <p>Tente novamente ou entre em contato conosco.</p>
            <a href='/'>Voltar →</a>
        </body>
        </html>";
        
        add_header Content-Type text/html;
    }
    
    # ════════════════════════════════════════════
    # Negar acesso a arquivos sensíveis
    # ════════════════════════════════════════════
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/\.env {
        deny all;
    }
}
```

**Ativar configuração:**
```bash
sudo ln -s /etc/nginx/sites-available/resetprimal.com.br \
           /etc/nginx/sites-enabled/

sudo nginx -t              # Testar
sudo systemctl restart nginx  # Restart
```

---

## 3. SERVIÇOS RODANDO

### 3.1 Nginx (Web Server)
```bash
# Status
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3.2 Node.js (Webhook API)
```bash
# Iniciar
node server.js

# Ou usar PM2 (recomendado para produção)
npm install -g pm2
pm2 start server.js --name "reset-primal-webhook"
pm2 save
pm2 startup

# Logs
pm2 logs reset-primal-webhook
```

### 3.3 SSL Certificate (Let's Encrypt)
```bash
# Instalar
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --nginx -d resetprimal.com.br

# Auto-renew (cron job)
sudo certbot renew --dry-run
```

---

## 4. FLUXO DETALHADO

### 4.1 Visitante entra na Landing Page

```
GET https://resetprimal.com.br
         ↓
Nginx procura: /var/www/reset-primal/index.html
         ↓
Não encontra (porque landing page está em /landing-page/grand-slam/)
         ↓
Usa regra: try_files $uri $uri/ /landing-page/grand-slam/index.html
         ↓
Serve: /var/www/reset-primal/landing-page/grand-slam/index.html
         ↓
HTML carrega:
  ✓ CSS (embarcado)
  ✓ JS (embarcado)
  ✓ GA4 script
  ✓ Facebook Pixel
         ↓
Navegador renderiza landing page
```

### 4.2 Visitante Clica CTA

```
<a href="https://pay.hotmart.com/S96024805Y">Quero Começar</a>
         ↓
JavaScript dispara:
  • GA4: gtag('event', 'click_cta')
  • Facebook: fbq('track', 'InitiateCheckout')
         ↓
Abre NOVA ABA: https://pay.hotmart.com/S96024805Y
         ↓
Hotmart checkout carrega
```

### 4.3 Visitante Preenche Dados e Clica "Comprar"

```
Email: cliente@email.com
CPF: 123.456.789-00
Cartão: 4111 1111 1111 1111
         ↓
Clica "Pagar"
         ↓
Hotmart processa pagamento
         ↓
Validação com processadora de cartão
         ↓
SE APROVADO:
  ├─ Registra venda em BD do Hotmart
  ├─ Dispara POST para: https://resetprimal.com.br/webhook/hotmart
  ├─ Redireciona para: https://pay.hotmart.com/sucesso
  └─ GA4 rastreia: evento "purchase"
```

### 4.4 Webhook Recebe Notificação

```
POST https://resetprimal.com.br/webhook/hotmart
Corpo: {
  status: "completed",
  buyer: { email: "cliente@email.com", name: "João" },
  sale: { id: "ABC123", price: 97 }
}
         ↓
Nginx recebe POST
         ↓
Regra: location /webhook/hotmart
         ├─ proxy_pass http://localhost:3000
         └─ Encaminha para Node.js
         ↓
Node.js webhook.js recebe
         ↓
Valida signature (token)
         ↓
SE VÁLIDO:
  ├─ Registra venda em BD
  ├─ Envia email via SendGrid
  ├─ Notifica Telegram
  └─ Responde: HTTP 200 OK
```

### 4.5 Visitante Recebe Email

```
De: noreply@resetprimal.com.br
Para: cliente@email.com
Assunto: "Seu Reset Primal está pronto!"
         ↓
Clica: "Acessar E-book"
         ↓
Link: https://resetprimal.com.br/ebook
         ↓
Nginx regra: location /ebook
  └─ alias /var/www/reset-primal/ebook/diagramacao
         ↓
Serve: /var/www/reset-primal/ebook/diagramacao/index.html
         ↓
E-book viewer carrega (180 páginas)
         ↓
Pode ler todos os capítulos
```

---

## 5. VARIÁVEIS DE AMBIENTE

**Arquivo:** `/var/www/reset-primal/.env` (NÃO fazer commit!)

```bash
# Hotmart
HOTMART_WEBHOOK_SECRET=abc123def456...

# Google Analytics
GA4_PROPERTY_ID=G-XXXXXXXXX

# Facebook
FACEBOOK_PIXEL_ID=123456789

# SendGrid (email)
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@resetprimal.com.br

# Telegram (notificações)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=987654321

# Aplicação
NODE_ENV=production
APP_URL=https://resetprimal.com.br
```

---

## 6. URLS FINAIS

| Página | URL | Arquivo |
|--------|-----|---------|
| Landing Page | https://resetprimal.com.br | /landing-page/grand-slam/index.html |
| E-book | https://resetprimal.com.br/ebook | /ebook/diagramacao/index.html |
| Webhook | https://resetprimal.com.br/webhook/hotmart | /api/webhook.js (via proxy) |
| Sucesso | https://resetprimal.com.br/sucesso | (inline HTML) |
| Erro | https://resetprimal.com.br/erro | (inline HTML) |
| Hotmart | https://pay.hotmart.com/S96024805Y | (externo) |

---

## 7. CHECKLIST DE DEPLOYMENT

### Antes de Lançar

- [ ] Domínio está apontando para seu IP?
- [ ] SSL certificate está instalado (HTTPS ativo)?
- [ ] Nginx está configurado?
- [ ] Landing page está em `/var/www/reset-primal/landing-page/grand-slam/`?
- [ ] E-book está em `/var/www/reset-primal/ebook/diagramacao/`?
- [ ] Node.js webhook está rodando?
- [ ] Arquivo .env existe com todas variáveis?
- [ ] .env está no .gitignore?
- [ ] Firewall permite portas 80 e 443?

### Testes

- [ ] Acessar https://resetprimal.com.br (LP carrega)?
- [ ] Clicar CTA (vai para Hotmart)?
- [ ] GA4 rastreia clique?
- [ ] Facebook Pixel carrega?
- [ ] Hotmart webhook teste dispara?
- [ ] Webhook retorna HTTP 200?
- [ ] Email é enviado após "compra teste"?
- [ ] Acessar https://resetprimal.com.br/ebook (E-book carrega)?

---

## 8. MONITORAMENTO DIÁRIO

### Logs a Acompanhar

```bash
# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Node.js webhook
pm2 logs reset-primal-webhook

# Arquivo de log customizado
tail -f /var/www/reset-primal/logs/webhooks.log
```

### Métricas a Verificar

- ✅ Quantos visitantes por dia?
- ✅ Quantos cliques em CTA?
- ✅ Quantas conversões (vendas)?
- ✅ Taxa de conversão (cliques/vendas)?
- ✅ Erros de webhook?
- ✅ Emails entregues?

---

## 9. TROUBLESHOOTING

### ❌ Landing page retorna 404
**Solução:** Verificar se arquivo está em `/var/www/reset-primal/landing-page/grand-slam/index.html`

### ❌ E-book não carrega
**Solução:** Verificar se arquivos estão em `/var/www/reset-primal/ebook/diagramacao/`

### ❌ CTA leva a erro Hotmart
**Solução:** Verificar se link Hotmart está correto e produto está publicado

### ❌ Webhook não funciona
**Solução:** 
1. Testar POST manualmente
2. Verificar logs Node.js
3. Verificar Nginx está fazendo proxy corretamente

### ❌ SSL certificate error
**Solução:** Renovar certificado com `certbot renew`

---

## 10. ESCALABILIDADE FUTURA

Se receber muito tráfego:

**Opção 1: Aumentar servidor**
- Mais CPU/RAM

**Opção 2: CDN para assets**
- CloudFlare para CSS/JS/imagens
- Reduz carga do servidor

**Opção 3: Banco de dados separado**
- PostgreSQL/MySQL em servidor diferente

**Opção 4: Load balancer**
- Múltiplos servidores web
- Nginx load balancer na frente

---

## CONCLUSÃO

**Esta é a estrutura que permite:**
- ✅ Landing page rápida (Nginx estático)
- ✅ Checkout seguro (Hotmart gerencia)
- ✅ Webhooks confiáveis (seu servidor)
- ✅ Sem downtime (HTTPS sempre ativo)
- ✅ Escalável (pode crescer)

**Próximo passo:** Implementar Analytics (`docs/ANALYTICS-SETUP.md`)

---

**Status:** ✅ Estrutura definida  
**Tempo de leitura:** ~20 minutos  
**Crítico?** SIM - é o fundamento tudo
