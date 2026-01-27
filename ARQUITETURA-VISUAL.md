# 🏗️ Arquitetura Visual - Reset Primal

**Versão:** 1.0
**Data:** 2025-01-27
**Status:** Production Architecture

---

## 📚 Índice

1. [Fluxo de Vendas (Customer Journey)](#fluxo-de-vendas-customer-journey)
2. [Arquitetura de Sistema](#arquitetura-de-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Integração com Serviços Externos](#integração-com-serviços-externos)
6. [Fluxo de Webhook](#fluxo-de-webhook)
7. [Rastreamento & Analytics](#rastreamento--analytics)

---

## Fluxo de Vendas (Customer Journey)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE POTENCIAL                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  VISITA LANDING PAGE                                             │
│  URL: https://resetprimal.com.br                                │
│  Servidor: Nginx (porta 443/HTTPS)                              │
│  Conteúdo: HTML + CSS + JS (2.164 linhas)                       │
│  - Headlines persuasivos                                        │
│  - Vídeo demonstrativo                                          │
│  - Depoimentos de clientes                                      │
│  - CTA: "QUERO MINHA TRANSFORMAÇÃO"                             │
│  - GA4 tracking (pageview)                                      │
│  - Facebook Pixel tracking (PageView)                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Clica CTA)
┌─────────────────────────────────────────────────────────────────┐
│  HOTMART CHECKOUT                                                │
│  URL: https://pay.hotmart.com/W103146395W                        │
│  - Formulário de dados do cliente                               │
│  - Opções de pagamento (cartão, boleto, etc)                    │
│  - GA4 tracking (begin_checkout)                                │
│  - Facebook Pixel tracking (InitiateCheckout)                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Completa compra)
┌─────────────────────────────────────────────────────────────────┐
│  HOTMART PROCESSA PAGAMENTO                                      │
│  - Valida cartão/boleto                                         │
│  - Gera transação ID                                            │
│  - Aguarda confirmação da instituição                           │
│  - Status: PROCESSING → APPROVED → COMPLETE                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Pagamento confirmado)
┌─────────────────────────────────────────────────────────────────┐
│  HOTMART DISPARA WEBHOOK                                         │
│  POST https://resetprimal.com.br/webhook/hotmart                │
│  Headers: x-hotmart-signature: {HMAC-SHA256}                    │
│  Payload: {type, data: {buyer, purchase}}                       │
│  - Email do cliente                                             │
│  - Nome completo                                                │
│  - Valores da transação                                         │
│  - ID da compra                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (Webhook recebido)
┌─────────────────────────────────────────────────────────────────┐
│  RESET PRIMAL WEBHOOK PROCESSING                                │
│  Servidor: Node.js (porta 3000, atrás de Nginx proxy)           │
│  Processo:                                                       │
│  1. Validar HMAC-SHA256 da assinatura                           │
│  2. Extrair dados do cliente (email, nome, valor)               │
│  3. Salvar em logs/webhook-hotmart.log (JSON)                   │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
    │  ENVIAR EMAIL  │  │  RASTREAR GA4  │  │  RASTREAR FB     │
    └────────────────┘  └────────────────┘  └──────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
    │  Gmail SMTP    │  │  GA4 API       │  │  Facebook API    │
    │  nodemailer    │  │  /mp/collect   │  │  /events         │
    └────────────────┘  └────────────────┘  └──────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
    │  CLIENTE INBOX │  │  ANALYTICS.    │  │  BUSINESS.FACEBOOK│
    │  "E-book ready"│  │  GOOGLE.COM    │  │  .COM Events     │
    │  Download link │  │  Real-time +   │  │  Manager         │
    │  + bônus       │  │  Relatórios    │  │  + Conversões    │
    └────────────────┘  └────────────────┘  └──────────────────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                        │
                        ▼
                ✅ CLIENTE SATISFEITO
                   Acesso ao e-book
                   3 fases do protocolo
                   + 47 receitas
                   + trackers
                   + guias de bônus
```

---

## Arquitetura de Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                        INTERNET / USUÁRIOS                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   DOMÍNIO DNS       │
                    │ resetprimal.com.br  │
                    │   A: 64.225.44.199  │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   FIREWALL / UFW    │
                    │  Allow: 80, 443     │
                    └─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │         NGINX (Port 443 HTTPS)             │
        ├─────────────────────────────────────────────┤
        │ - Reverse proxy                             │
        │ - SSL/TLS termination                       │
        │ - Cache estático                            │
        │ - Load balancing                            │
        │ - Compressão (gzip)                         │
        │ - Redirect HTTP → HTTPS                     │
        ├─────────────────────────────────────────────┤
        │ Configuração: /etc/nginx/sites-available/   │
        │              reset-primal                   │
        │ Certificado: Let's Encrypt (renova auto)    │
        │ Path: /etc/letsencrypt/live/resetprimal...  │
        └─────────────────────────────────────────────┘
               │                          │
               │ (/)                      │ (/webhook/hotmart)
               ▼                          ▼
        ┌──────────────┐          ┌──────────────────┐
        │   LANDING    │          │  NODE.JS WEBHOOK │
        │     PAGE     │          │    (Port 3000)   │
        ├──────────────┤          ├──────────────────┤
        │ /index.html  │          │ Express.js       │
        │ /css/        │          │ Nodemailer       │
        │ /js/         │          │ Crypto (HMAC)    │
        │ /ebook/      │          │ Fetch (GA4, FB)  │
        │ GA4 + FB     │          │                  │
        │ tracking     │          │ PM2 managed      │
        └──────────────┘          └──────────────────┘
               │                          │
               │ (HTML, JS)              │ (logs)
               ▼                          ▼
        ┌──────────────┐          ┌──────────────────┐
        │  USER BROWSER│          │  LOGS DIRECTORY  │
        │ - Renderiza  │          │ /var/www/reset-  │
        │   conteúdo   │          │ primal/logs/     │
        │ - GA4 track  │          │ webhook-hotmart. │
        │ - FB track   │          │ log (JSON lines) │
        │ - Click CTA  │          └──────────────────┘
        └──────────────┘
               │
               │ (POST /webhook/hotmart)
               ▼
        ┌──────────────────────────────────────────┐
        │     EXTERNAL SERVICES (Outbound)         │
        ├──────────────────────────────────────────┤
        │ 1. GMAIL SMTP (email)                    │
        │    host: smtp.gmail.com:587              │
        │    from: singullarco@gmail.com           │
        │    to: customer email                    │
        │                                          │
        │ 2. GOOGLE ANALYTICS 4                    │
        │    POST /mp/collect                      │
        │    event: purchase                       │
        │    property_id: G-KKTGW6BEJP            │
        │                                          │
        │ 3. FACEBOOK PIXEL API                    │
        │    POST /graph.facebook.com/v18.0/       │
        │    {PIXEL_ID}/events                     │
        │    event_name: Purchase                  │
        │    pixel_id: 1164114415287965           │
        └──────────────────────────────────────────┘
```

---

## Fluxo de Dados

```
ENTRADA DE DADOS:
═══════════════════════════════════════════════════════════════

1. VISITANTE ANONIMIZADO
   ├─ IP Address (salvo em Nginx logs)
   ├─ User Agent (browser/device)
   ├─ Referrer (de onde veio)
   └─ GA4: client_id (cookie)
   └─ Facebook: fbp cookie

2. COMPRADOR REGISTRADO (Hotmart)
   ├─ Email ✉️
   ├─ Nome completo 👤
   ├─ Telefone (opcional)
   ├─ CPF/CNPJ (não salvo localmente)
   ├─ Endereço (não salvo localmente)
   └─ Forma de pagamento (não salvo)

PROCESSAMENTO DE DADOS:
═══════════════════════════════════════════════════════════════

                 POST /webhook/hotmart
                        │
                        ▼
         ┌─────────────────────────────┐
         │  VALIDAÇÃO HMAC-SHA256      │
         │  Assinatura da Hotmart      │
         │  secret: HOTMART_WEBHOOK... │
         └─────────────────────────────┘
                        │
                    ✅ VÁLIDO
                        │
         ┌──────────────────────────────────────┐
         │  EXTRACTING & MAPPING                │
         │  Payload → Variáveis locais          │
         │  - buyer.email                       │
         │  - buyer.name                        │
         │  - purchase.price                    │
         │  - purchase.id                       │
         │  - purchase.status                   │
         └──────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
    SALVAR                        ENRICHING
    ├─ logs file                ├─ hash email (SHA256)
    │  webhook-hotmart.log      ├─ timestamp ISO
    │  JSON 1 linha             ├─ transaction ID
    │  (compra completada)      └─ currency (BRL)
    │
    └─ Estrutura:
       {
         "timestamp": "2025-01-27T...",
         "buyer_email": "...",
         "buyer_name": "...",
         "purchase_id": "...",
         "amount": 97.00,
         "status": "completed"
       }

SAÍDA DE DADOS:
═══════════════════════════════════════════════════════════════

┌─ EMAIL (CUSTOMER)
│  ├─ Recipients: buyer.email
│  ├─ Subject: 🎉 E-book Reset Primal...
│  ├─ Body: HTML template + nome do cliente
│  ├─ CTA: Download link + bônus
│  └─ Service: Gmail SMTP (singullarco@gmail.com)
│
├─ GA4 (ANALYTICS)
│  ├─ Event Name: "purchase"
│  ├─ Params:
│  │  ├─ value: R$ amount
│  │  ├─ currency: "BRL"
│  │  └─ transaction_id: timestamp
│  ├─ client_id: email (hash)
│  ├─ user_id: email
│  └─ Service: google-analytics.com/mp/collect
│
├─ FACEBOOK (PIXELS & CONVERSION)
│  ├─ Event Name: "Purchase"
│  ├─ Event Time: unix timestamp
│  ├─ User Data:
│  │  └─ em: SHA256(email)
│  ├─ Pixel ID: 1164114415287965
│  └─ Service: graph.facebook.com/v18.0/PIXEL_ID/events
│
└─ INTERNAL LOGS
   └─ webhook-hotmart.log (JSON, 1 linha por compra)

DATA RETENTION:
═══════════════════════════════════════════════════════════════
- Logs: Indefinido (rotação manual ou automática)
- GA4: 14 meses (política Google)
- Facebook: 7 dias (event history)
- Email: Inbox do cliente (sua responsabilidade)
- .env: NUNCA público/git (local server apenas)
```

---

## Estrutura de Pastas

```
reset-primal/
│
├── 📄 .env
│   └─ Credenciais (não commitar!)
│      ├─ HOTMART_WEBHOOK_SECRET
│      ├─ HOTMART_AFFILIATE_LINK
│      ├─ GOOGLE_ANALYTICS_PROPERTY_ID
│      ├─ FACEBOOK_PIXEL_ID
│      ├─ GMAIL_USER
│      ├─ GMAIL_PASSWORD
│      └─ (mais)
│
├── 📄 .env.example
│   └─ Template para credenciais (public)
│
├── 📄 package.json
│   └─ Dependências Node.js
│      ├─ express (framework web)
│      ├─ nodemailer (email)
│      └─ dotenv (variáveis ambiente)
│
├── 📄 README.md
│   └─ Documentação geral
│
├── 📁 landing-page/
│   ├── 📄 index.html (2.164 linhas)
│   │   ├─ Meta tags (SEO, OG)
│   │   ├─ GA4 tracking script
│   │   ├─ Facebook Pixel script
│   │   ├─ Conteúdo landing
│   │   ├─ Call-to-action (CTA)
│   │   └─ Email capture form
│   │
│   ├── 📁 css/
│   │   ├─ style.css (estilo principal)
│   │   └─ responsive.css (mobile)
│   │
│   ├── 📁 js/
│   │   ├─ analytics.js (GA4 tracking)
│   │   ├─ pixel.js (Facebook tracking)
│   │   └─ form.js (CTA behavior)
│   │
│   ├── 📁 images/
│   │   ├─ header-bg.jpg
│   │   ├─ testimonials/
│   │   └─ icons/
│   │
│   └── 📁 ebook/
│       └─ (bônus downloads, se houver)
│
├── 📁 api/
│   └── 📄 webhook-hotmart.js (274 linhas)
│       ├─ Express app setup
│       ├─ HMAC validation
│       ├─ POST /webhook/hotmart
│       ├─ GET /health
│       ├─ processPurchase()
│       ├─ sendEbookEmail()
│       ├─ trackConversionGA4()
│       ├─ trackConversionFacebook()
│       └─ Server start (port 3000)
│
├── 📁 logs/
│   └── 📄 webhook-hotmart.log
│       └─ JSON lines (1 linha = 1 compra)
│       └─ Exemplo: {"timestamp":"...","buyer_email":"...","amount":97}
│
├── 📁 docs/
│   ├── 📄 API-WEBHOOK-REFERENCE.md ← NOVO
│   ├── 📄 OPERATIONAL-PROCEDURES.md ← NOVO
│   ├── 📄 ARQUITETURA-VISUAL.md ← NOVO
│   ├── 📄 FAQ-COMPLETO.md ← NOVO
│   ├── 📄 DEPLOY-INSTRUCOES-FINAIS.md
│   ├── 📄 TROUBLESHOOTING-PRODUCAO.md
│   ├── 📄 CREDENTIALS-SETUP.md
│   └── (mais)
│
├── 📄 nginx-reset-primal.conf
│   └─ Configuração Nginx
│      ├─ HTTP redirect to HTTPS
│      ├─ SSL paths
│      ├─ Static files root (landing-page/)
│      ├─ Proxy para /webhook/* → localhost:3000
│      ├─ Cache headers
│      └─ Gzip compression
│
├── 📄 deploy-producao.sh
│   └─ Script de deploy automático
│      ├─ Instala/atualiza Nginx
│      ├─ Copia config
│      ├─ Instala/renova SSL
│      ├─ Instala PM2
│      ├─ Inicia webhook
│      └─ Configura auto-start
│
├── 📁 .git/
│   └─ Histórico de versões
│      ├─ 4 commits finalizados
│      └─ .gitignore (exclui .env)
│
└── 📁 node_modules/
    └─ Pacotes npm instalados
       ├─ express/
       ├─ nodemailer/
       ├─ dotenv/
       └─ (dependências transitivas)
```

---

## Integração com Serviços Externos

```
RESET PRIMAL CORE
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
  ┌─────────────┐                           ┌──────────────┐
  │   HOTMART   │                           │ SISTEMA LOCAL│
  ├─────────────┤                           ├──────────────┤
  │ URL:        │◄──── WEBHOOK POST ────────┤ /webhook/    │
  │ pay.hotmart │      com HMAC-SHA256      │  hotmart     │
  │ .com        │                           │              │
  │             │                           └──────────────┘
  │ Responsável:│                                  │
  │ -Checkout  │                                  │
  │ -Pagamento │                        ┌─────────┴──────────┐
  │ -Webhook   │                        │                    │
  └─────────────┘                        ▼                    ▼
                                    ┌─────────┐          ┌──────────┐
                                    │  GMAIL  │          │ GOOGLE   │
                                    │  SMTP   │          │ ANALYTICS│
                                    ├─────────┤          ├──────────┤
                                    │ Enviar  │          │ Rastrear │
                                    │ email   │          │ purchase │
                                    │ ao      │          │ evento   │
                                    │ cliente │          │          │
                                    │         │          │ Property:│
                                    │ Auth:   │          │ G-KKTGW  │
                                    │ singul  │          │ 6BEJP    │
                                    │ larco@  │          │          │
                                    │ gmail   │          │ Endpoint:│
                                    │ .com    │          │ /mp/     │
                                    │ Password│          │ collect  │
                                    │ (app-   │          │          │
                                    │ speci-  │          │ Method:  │
                                    │ fic)    │          │ POST     │
                                    └─────────┘          └──────────┘

                                        │
                                        │
                                        ▼
                                    ┌──────────┐
                                    │ FACEBOOK │
                                    │  PIXEL   │
                                    ├──────────┤
                                    │ Rastrear │
                                    │ purchase │
                                    │ conversão│
                                    │          │
                                    │ Pixel ID:│
                                    │ 116411   │
                                    │ 4415287  │
                                    │ 965      │
                                    │          │
                                    │ Endpoint:│
                                    │ /graph.f │
                                    │ acebook. │
                                    │ com/v18. │
                                    │ 0/{ID}/  │
                                    │ events   │
                                    │          │
                                    │ Method:  │
                                    │ POST     │
                                    └──────────┘

CONFIABILIDADE:
═══════════════════════════════════════════════════════════════

1. HOTMART → WEBHOOK
   ├─ Confiável: Hotmart envia com retry se falhar
   ├─ Esperado: Webhook responde com HTTP 200
   ├─ Se falhar: Hotmart retenta por 24-48h
   └─ Nota: Pode haver duplicatas (idempotent)

2. WEBHOOK → EMAIL
   ├─ Confiável: Gmail é enterprise-grade
   ├─ Possível falha: Credenciais Gmail erradas
   ├─ Se falhar: Log registra erro, cliente notificado
   └─ Recuperação: Update .env + restart

3. WEBHOOK → GA4
   ├─ Confiável: Google é enterprise-grade
   ├─ Possível falha: API secret errado
   ├─ Se falhar: Eventos não aparecem
   ├─ Latência: 24h para aparecer em relatórios
   └─ Verificação: Real-time → imediato

4. WEBHOOK → FACEBOOK
   ├─ Confiável: Facebook é enterprise-grade
   ├─ Possível falha: Pixel ID ou token errado
   ├─ Se falhar: Eventos não rastreiam
   ├─ Latência: 1-2h para processar
   └─ Verificação: Events Manager
```

---

## Fluxo de Webhook

```
┌─────────────────────────────────────────────────────────────┐
│                    HOTMART EVENT TRIGGER                    │
│                 (Compra confirmada)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    HTTP POST REQUEST
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
    URL Path:                              Headers:
    /webhook/hotmart                        x-hotmart-signature: abc123def...
                                            Content-Type: application/json

    Body:
    {
      "type": "PURCHASE_COMPLETE",
      "data": {
        "buyer": {
          "email": "cliente@example.com",
          "name": "João Silva",
          ...
        },
        "purchase": {
          "id": "PURCHASE_123",
          "price": 97.00,
          "status": "completed",
          ...
        }
      }
    }
                            │
                            ▼
                    ┌───────────────────┐
                    │  NGINX RECEBE      │
                    │  Port 443 (HTTPS)  │
                    └───────────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │  NGINX PROXY       │
                    │  Para localhost:   │
                    │  3000              │
                    └───────────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │  EXPRESS RECEBE    │
                    │  POST /webhook/    │
                    │  hotmart           │
                    └───────────────────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
            VALIDAÇÃO           EXTRAÇÃO
            HMAC-SHA256         DE DADOS
                │                   │
                ▼                   ▼
        ┌─────────────────┐  ┌────────────────┐
        │ Calcular HMAC   │  │ JSON.parse()   │
        │ com secret      │  │ Mapear campos  │
        └─────────────────┘  └────────────────┘
                │                   │
                ▼                   │
        ┌─────────────────┐         │
        │ Comparar hash   │         │
        │ enviado vs      │         │
        │ calculado       │         │
        └─────────────────┘         │
                │                   │
        ┌───────┴────────┐          │
        │                │          │
        ▼ (Match)        ▼ (Fail)   │
    VÁLIDO              401 Respons  │
        │                │          │
        │                └─► HTTP 401 (Unauthorized)
        │                     "error": "Invalid signature"
        │                     └─ Hotmart retenta depois
        │
        │ Armazena em memória
        │
        ▼ (processa)
    processPurchase(event)
        │
        ├─► 1️⃣ fs.appendFile()
        │   logs/webhook-hotmart.log
        │   Salva JSON 1 linha
        │
        ├─► 2️⃣ await sendEbookEmail()
        │   nodemailer.sendMail()
        │   Para: buyer.email
        │   Via: Gmail SMTP
        │   Assunto: 🎉 E-book pronto...
        │   Body: HTML com CTA download
        │
        ├─► 3️⃣ await trackConversionGA4()
        │   fetch() POST
        │   Para: google-analytics.com/mp/collect
        │   Event: purchase
        │   Valor: price em BRL
        │   Status: Google registra
        │
        └─► 4️⃣ await trackConversionFacebook()
            fetch() POST
            Para: graph.facebook.com/.../events
            Event: Purchase
            User: SHA256(email)
            Status: Facebook registra
            │
            └─ Todos rodando em paralelo (async)
                (não bloqueia um ao outro)
                            │
                            ▼
                    ┌───────────────────┐
                    │ HTTP 200 RESPONSE  │
                    │ {"status":"ok"}    │
                    └───────────────────┘
                            │
                            ▼
                    HOTMART CONFIRMA
                    E ninguém retenta

TEMPO TOTAL: ~2-3 segundos (até HTTP 200)
```

---

## Rastreamento & Analytics

```
ANTES DA COMPRA:
═══════════════════════════════════════════════════════════════

Visitante chega em resetprimal.com.br

┌─────────────────────────────────────┐
│ GOOGLE ANALYTICS 4                  │
├─────────────────────────────────────┤
│ Quando: Carrega landing page        │
│ Evento: "page_view"                 │
│ Propriedade ID: G-KKTGW6BEJP       │
│ Client ID: Cookie (gerado gtag)     │
│ Dados:                              │
│ - página_titulo                     │
│ - página_local                      │
│ - browser/device                    │
│ - país/cidade                       │
│                                     │
│ Relatório: Audience → Real-time    │
│ Dashboard: analytics.google.com     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ FACEBOOK PIXEL                      │
├─────────────────────────────────────┤
│ Quando: Carrega landing page        │
│ Evento: "PageView"                  │
│ Pixel ID: 1164114415287965         │
│ Cookie: fbp (gerado fbq)           │
│ Dados:                              │
│ - event_time                        │
│ - event_source_url                  │
│ - event_name                        │
│                                     │
│ Relatório: Events Manager           │
│ Dashboard: business.facebook.com    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ HOTMART AFFILIATE TRACKING          │
├─────────────────────────────────────┤
│ Quando: Clica "Comprar agora"      │
│ Faz POST para:                      │
│ https://pay.hotmart.com/            │
│ W103146395W?ref={affiliateID}      │
│ Função: Hotmart rastreia origem     │
│ Relatório: Hotmart dashboard        │
└─────────────────────────────────────┘


DURANTE A COMPRA:
═══════════════════════════════════════════════════════════════

Visitante completa checkout

┌─────────────────────────────────────┐
│ GOOGLE ANALYTICS 4                  │
├─────────────────────────────────────┤
│ Quando: Hotmart checkout inicia    │
│ Evento: "begin_checkout"            │
│ Valor: price                        │
│ Moeda: BRL                          │
│                                     │
│ Função: Rastrear interessados      │
│ Relatório: Conversion funnel        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ FACEBOOK PIXEL                      │
├─────────────────────────────────────┤
│ Quando: Hotmart checkout inicia    │
│ Evento: "InitiateCheckout"         │
│ Dados:                              │
│ - value: preço                      │
│ - currency: BRL                     │
│ - content_name: produto             │
│                                     │
│ Função: Rastrear possíveis buyers  │
│ Relatório: Conversion tracking      │
└─────────────────────────────────────┘


DEPOIS DA COMPRA (Webhook disparado):
═══════════════════════════════════════════════════════════════

POST /webhook/hotmart recebido e processado

┌─────────────────────────────────────┐
│ GOOGLE ANALYTICS 4                  │
├─────────────────────────────────────┤
│ Quando: Webhook processa compra    │
│ Evento: "purchase"                  │
│ Valores:                            │
│ {                                   │
│   "name": "purchase",               │
│   "params": {                       │
│     "value": 97.00,                │
│     "currency": "BRL",              │
│     "transaction_id": "12345..."    │
│   }                                 │
│ }                                   │
│ Client ID: email (anonymized)       │
│                                     │
│ Função: Rastrear conversões real    │
│ Tempo: Aparece em 24h em relatórios│
│ Real-time: Visível imediatamente   │
│ Relatório: analytics.google.com     │
│ Navegação: Real-time → Conversions │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ FACEBOOK PIXEL                      │
├─────────────────────────────────────┤
│ Quando: Webhook processa compra    │
│ Evento: "Purchase"                  │
│ Valores:                            │
│ {                                   │
│   "event_name": "Purchase",        │
│   "event_time": 1234567890,        │
│   "user_data": {                    │
│     "em": "SHA256(email)"          │
│   }                                 │
│ }                                   │
│                                     │
│ Função: Rastrear conversões real    │
│ Tempo: Processa em 1-2 horas       │
│ Relatório: business.facebook.com    │
│ Navegação: Events Manager           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ EMAIL CONFIRMAÇÃO                   │
├─────────────────────────────────────┤
│ Quando: Webhook dispara sendEmail  │
│ Para: buyer.email                   │
│ De: singullarco@gmail.com           │
│ Assunto: 🎉 E-book pronto...       │
│ Body:                               │
│ - HTML template                     │
│ - Nome do cliente personalizado     │
│ - Link de download                  │
│ - Bônus inclusos                    │
│ - CTAs                              │
│                                     │
│ Via: Gmail SMTP (port 587)          │
│ Logs: webhook-hotmart.log           │
│ Status: "EMAIL Enviado para..."     │
└─────────────────────────────────────┘


DASHBOARD UNIFICADO (recomendado):
═══════════════════════════════════════════════════════════════

Setup: Google Data Studio ou Tableau
┌─────────────────────────────────────┐
│ UNIFIED DASHBOARD                   │
├─────────────────────────────────────┤
│ Left: GA4 Conversions (últimas 24h) │
│ Center: Facebook Events (últimas 24h)
│ Right: Email Logs (últimas 10)     │
│ Bottom: Revenue trend (últimos 30d) │
│ Alert: Se <1% conversion rate       │
└─────────────────────────────────────┘

Atualização: Real-time (GA4 ≈ 5 min)
Acesso: analytics.google.com
        business.facebook.com
        resetprimal.com.br/logs
```

---

## Resumo de Responsabilidades

| Componente | Responsável | Funciona 24/7 | Crítico |
|-----------|-----------|---|---|
| Hotmart | Hotmart | ✅ | ✅ Sem isso, 0 vendas |
| Landing Page | Nginx | ✅ | ✅ Vitrine do negócio |
| Webhook | Node.js + PM2 | ✅ | ✅ Automação de vendas |
| Email | Gmail | ✅ | ⚠️ Delivery pode falhar |
| GA4 | Google | ✅ | ❌ Analytics only |
| Facebook | Facebook | ✅ | ❌ Analytics only |
| Certificado SSL | Let's Encrypt | ✅ | ✅ HTTPS obrigatório |
| Domínio | Registrador | ✅ | ✅ DNS essencial |

---

**Versão:** 1.0
**Criado:** 2025-01-27
**Próxima revisão:** 2025-03-27
