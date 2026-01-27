# ✅ DEPLOYMENT CHECKLIST - Reset Primal

**Data Deploy:** ___________
**Responsável:** ___________

---

## FASE PRÉ-DEPLOY (Local/Desenvolvimento)

### Código e Configuração
- [ ] Git status limpo (sem arquivos não commitados importantes)
- [ ] .env criado com valores dummy válidos
- [ ] Landing page tem GA4 + Facebook Pixel integrados
- [ ] Landing page tem links Hotmart corretos (W103146395W)
- [ ] Webhook backend testado localmente (HTTP 200)
- [ ] HMAC-SHA256 validation funcionando
- [ ] Email template pronto

### Documentação
- [ ] CREDENTIALS-SETUP.md revisado
- [ ] FASE2-SETUP-PRODUCAO.md pronto
- [ ] TROUBLESHOOTING-PRODUCAO.md completo
- [ ] Todos os arquivos .md atualizados

### Código Review
- [ ] Sem console.log() em produção (apenas [WEBHOOK], [EMAIL], etc)
- [ ] Error handling robusto
- [ ] Sem secrets em código (tudo em .env)
- [ ] Sem dependencies inseguras (npm audit)

---

## FASE SETUP SERVIDOR

### Sistema Operacional
- [ ] Servidor Ubuntu 20.04+ ou Debian 11+
- [ ] SSH access testado
- [ ] Sudo rights confirmados
- [ ] Firewall habilitado (ufw)

### Instalações
- [ ] Node.js v18+ instalado
- [ ] NPM instalado
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Git instalado (opcional)

### Credenciais
- [ ] HOTMART_WEBHOOK_SECRET obtido
- [ ] GOOGLE_ANALYTICS_PROPERTY_ID obtido
- [ ] FACEBOOK_PIXEL_ID obtido
- [ ] GMAIL_USER + GMAIL_PASSWORD obtidos (com 2FA)
- [ ] .env preenchido NO SERVIDOR

### Projeto
- [ ] Código copiado para /var/www/reset-primal
- [ ] npm install --production executado
- [ ] Permissões corretas nos arquivos
- [ ] logs/ directory criado
- [ ] Webhook testado localmente

---

## FASE CONFIGURAÇÃO NGINX

### Config Validation
- [ ] nginx-reset-primal.conf copiado para /etc/nginx/sites-available/
- [ ] Symlink criado em /etc/nginx/sites-enabled/
- [ ] sudo nginx -t passou com sucesso
- [ ] Nenhum erro de syntax

### HTTP
- [ ] Port 80 aberto (ufw allow 80)
- [ ] HTTP redirect → HTTPS funcionando
- [ ] Landing page acessível em http://resetprimal.com.br

### HTTPS (Let's Encrypt)
- [ ] Certbot certificado gerado com sucesso
- [ ] /etc/letsencrypt/live/resetprimal.com.br/ existe
- [ ] fullchain.pem e privkey.pem presentes
- [ ] Port 443 aberto (ufw allow 443)
- [ ] HTTPS funcionando sem erros
- [ ] SSLLabs score A ou melhor

---

## FASE WEBHOOK

### Local Testing
- [ ] Health endpoint responde: curl http://localhost:3000/health
- [ ] POST com signature válida retorna HTTP 200
- [ ] POST com signature inválida retorna HTTP 401
- [ ] Evento PURCHASE_COMPLETE é processado
- [ ] Logs criados em /logs/webhook-hotmart.log

### PM2 Setup
- [ ] PM2 instalado globalmente
- [ ] Webhook iniciado: pm2 start api/webhook-hotmart.js
- [ ] Status "online": pm2 status
- [ ] Autostart configurado: pm2 startup && pm2 save
- [ ] Restart automático funcionando (testar: pm2 restart hotmart-webhook)

### Hotmart Integration
- [ ] Webhook cadastrado em app.hotmart.com
- [ ] URL: https://resetprimal.com.br/webhook/hotmart
- [ ] Eventos: PURCHASE_COMPLETE + PURCHASE_APPROVED marcados
- [ ] Secret fornecido e comparado com .env
- [ ] Webhook testado em sandbox

---

## FASE ANALYTICS

### Google Analytics 4
- [ ] ID real substituído no HTML (2 ocorrências)
- [ ] Sem "G-PLACEHOLDER" no código
- [ ] GA4 property criada e acessível
- [ ] Event rastreamento configurado (purchase, begin_checkout)
- [ ] Real-time reporting testado

### Facebook Pixel
- [ ] ID real substituído no HTML (2 ocorrências)
- [ ] Sem "PIXEL-PLACEHOLDER" no código
- [ ] Pixel ativo em Events Manager
- [ ] Events rastreados: Purchase, InitiateCheckout
- [ ] Pixel Helper extension validou

### Email
- [ ] Gmail 2FA ativado
- [ ] App-specific password gerado
- [ ] GMAIL_USER + GMAIL_PASSWORD em .env
- [ ] Email template pronto
- [ ] Teste manual passou

---

## FASE PRODUÇÃO - PRIMEIRA COMPRA TESTE

### Transação
- [ ] Compra teste realizada (R$ 97 ou sandbox)
- [ ] Hotmart confirma pagamento
- [ ] Webhook recebeu POST

### Email
- [ ] Email "Bem-vindo ao Reset Primal" recebido
- [ ] Link e-book funciona
- [ ] Template HTML renderiza corretamente
- [ ] Timestamp correto

### Analytics
- [ ] GA4 mostra evento "purchase" em Real-time
- [ ] Valor de conversão: R$ 97.00
- [ ] Transaction ID registrado
- [ ] Facebook Pixel mostra evento "Purchase"
- [ ] Hashed email correto

### Logs
- [ ] /logs/webhook-hotmart.log tem entrada
- [ ] Timestamp, email, purchase_id registrados
- [ ] Nenhum erro visível

---

## FASE SEGURANÇA E OTIMIZAÇÃO

### Segurança
- [ ] .env nunca foi commitado (git log --all -- .env)
- [ ] .env em .gitignore
- [ ] SSL certificate válido (90 dias)
- [ ] Security headers ativos (HSTS, CSP, X-Frame-Options)
- [ ] Node.js rodando como usuário não-root
- [ ] PM2 configurado para reiniciar após reboot

### Performance
- [ ] PageSpeed Insights >80
- [ ] Time to First Byte < 1s
- [ ] Lighthouse score > 80
- [ ] Imagens otimizadas
- [ ] Cache headers corretos (1 year para assets)

### Backup e Recovery
- [ ] .env backup em local seguro
- [ ] Git repository pronto (sem secrets)
- [ ] PM2 ecosystem.config.js criado
- [ ] Rotina de logs (não crescer infinito)
- [ ] Plano de rollback documentado

---

## FASE PÓS-DEPLOY (24-48h)

### Monitoramento
- [ ] UptimeRobot configurado para alertas
- [ ] Sentry (ou similar) para erro tracking
- [ ] Email alert rules configuradas
- [ ] Webhook response times monitorados

### Vendas
- [ ] Primeira venda real confirmada
- [ ] Email + GA4 + Facebook funcionando
- [ ] Nenhum customer complaint

### Analytics
- [ ] Dashboard GA4 criado (Conversions, Revenue, etc)
- [ ] Facebook Pixel data em Events Manager
- [ ] Remarketing audience acumulando dados

---

## SIGN-OFF

**Deploy executado por:** ___________
**Data/Hora:** ___________
**Duração total:** ___________
**Status:** ☐ SUCCESS ☐ PARTIAL ☐ ROLLBACK

**Observações:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

**Próximas ações:** ___________

---

**Versão:** 1.0
**Data criação:** 2025-01-27
**Última atualização:** 2025-01-27
