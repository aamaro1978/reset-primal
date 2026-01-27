# 🛠️ Operational Procedures - Reset Primal

**Versão:** 1.0
**Data:** 2025-01-27
**Público:** Devops, Operações, Suporte

---

## 📚 Índice

1. [Checklist Diário](#checklist-diário)
2. [Monitoramento de Webhook](#monitoramento-de-webhook)
3. [Visualização de Logs](#visualização-de-logs)
4. [Backup & Segurança](#backup--segurança)
5. [Renovação de Certificados](#renovação-de-certificados)
6. [Escalation Procedures](#escalation-procedures)
7. [Comandos Úteis](#comandos-úteis)
8. [Alertas & Notificações](#alertas--notificações)

---

## Checklist Diário

Execute este checklist **toda manhã** para garantir que tudo está funcionando:

### ☀️ Morning Standup (5 minutos)

```bash
# 1. SSH no servidor
ssh root@64.225.44.199

# 2. Verificar se webhook está online
pm2 status
# Esperado: "hotmart-webhook  ▶  online"

# 3. Testar health endpoint
curl https://resetprimal.com.br/health
# Esperado: {"status":"ok","timestamp":"..."}

# 4. Verificar disco livre (alert se < 10%)
df -h | grep "/dev/"

# 5. Verificar memória
free -h

# 6. Verificar últimas compras
tail -5 /var/www/reset-primal/logs/webhook-hotmart.log | jq .

# 7. Verificar erros no Nginx
sudo tail -20 /var/log/nginx/error.log
```

**Se tudo OK:** ✅ Sistema verde, continuar dia normal
**Se algo falhar:** ⚠️ Vá para [Escalation Procedures](#escalation-procedures)

---

## Monitoramento de Webhook

### Setup: UptimeRobot (Recomendado)

Configure alertas automáticos para detectar downtime:

1. Acesse https://uptimerobot.com
2. Clique "Add Monitor"
3. Preencha:
   ```
   Monitor Type: HTTPS
   Friendly Name: Reset Primal Health Check
   URL: https://resetprimal.com.br/health
   Monitoring Interval: 5 minutes
   Notification: Email seu-email@gmail.com
   ```
4. Clique "Create Monitor"

**Agora você recebe email se o webhook ficar offline por mais de 5 minutos!**

### Setup: PM2 Email Alerts

Configure PM2 para enviar alertas automáticos:

```bash
# Criar arquivo de config
cat > /var/www/reset-primal/.pm2-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hotmart-webhook',
    script: '/var/www/reset-primal/api/webhook-hotmart.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/reset-primal/logs/webhook-error.log',
    out_file: '/var/www/reset-primal/logs/webhook-out.log'
  }]
};
EOF

# Carregar config
pm2 start .pm2-ecosystem.config.js

# Habilitar monitoramento
pm2 set pm2-auto-pull-on-push false
```

### Monitoramento Manual em Tempo Real

Para acompanhar compras enquanto acontecem:

```bash
# Terminal dedicado: Tail logs em tempo real
watch -n 5 'tail -10 /var/www/reset-primal/logs/webhook-hotmart.log'

# OU com formato mais legível
pm2 logs hotmart-webhook
```

**Saída esperada ao chegar uma compra:**
```
[WEBHOOK] Recebido: {type: 'PURCHASE_COMPLETE', ...}
[COMPRA] cliente@example.com - Produto: PROD_RESETPRIMAL_001
[EMAIL] Enviado para cliente@example.com
[GA4] Conversão rastreada para cliente@example.com
[FACEBOOK] Conversão rastreada para cliente@example.com
```

---

## Visualização de Logs

### Entender o Fluxo de Log

Cada compra gera 4 linhas de log:

```bash
# Ver as últimas 20 compras
tail -20 /var/www/reset-primal/logs/webhook-hotmart.log

# Saída:
# {"timestamp":"2025-01-27T10:30:45Z","buyer_email":"joao@example.com","buyer_name":"João","purchase_id":"P123","amount":97.00,"status":"completed"}
# {"timestamp":"2025-01-27T10:35:12Z","buyer_email":"maria@example.com","buyer_name":"Maria","purchase_id":"P456","amount":197.00,"status":"completed"}
```

### Analisar Logs com jq

```bash
# Contar total de compras
cat /var/www/reset-primal/logs/webhook-hotmart.log | wc -l

# Somar valores totais (receita)
cat /var/www/reset-primal/logs/webhook-hotmart.log | jq -r '.amount' | awk '{sum+=$1} END {print "Total: R$ " sum}'

# Buscar compra específica por email
grep "joao@example.com" /var/www/reset-primal/logs/webhook-hotmart.log | jq .

# Buscar por data
grep "2025-01-27" /var/www/reset-primal/logs/webhook-hotmart.log | wc -l

# Ver últimas compras com timestamps legíveis
tail -5 /var/www/reset-primal/logs/webhook-hotmart.log | jq '{timestamp, buyer_email, amount}'
```

### Filtrar Erros

```bash
# Ver erros de email
pm2 logs hotmart-webhook --lines 100 | grep -i "email.*erro"

# Ver tentativas com assinatura inválida
pm2 logs hotmart-webhook --lines 100 | grep "Invalid signature"

# Ver erros GA4
pm2 logs hotmart-webhook --lines 100 | grep "GA4.*Erro"

# Ver erros Facebook
pm2 logs hotmart-webhook --lines 100 | grep "FACEBOOK.*Erro"
```

### Limpar Logs Antigos

```bash
# Ver tamanho do arquivo
ls -lh /var/www/reset-primal/logs/webhook-hotmart.log

# Se ficar muito grande (> 100MB), limpar
> /var/www/reset-primal/logs/webhook-hotmart.log

# Ou com rotação automática (recomendado)
# Criar arquivo de logrotate
sudo tee /etc/logrotate.d/reset-primal > /dev/null << 'EOF'
/var/www/reset-primal/logs/webhook-hotmart.log {
    size 100M
    rotate 5
    copytruncate
    compress
    missingok
}
EOF

# Testar
sudo logrotate -f /etc/logrotate.d/reset-primal
```

---

## Backup & Segurança

### Backup Diário do .env

**NUNCA commitar `.env` no GitHub!** Mas fazer backup seguro:

```bash
# Opção 1: Backup local (seu computador)
scp root@64.225.44.199:/var/www/reset-primal/.env ~/backup-reset-primal-.env

# Opção 2: Backup no servidor (encrypted)
ssh root@64.225.44.199
cd /var/www/reset-primal
tar czf /home/backup-$(date +%Y-%m-%d).tar.gz .env

# Opção 3: Backup em nuvem (AWS S3, Google Drive)
aws s3 cp /var/www/reset-primal/.env s3://seu-bucket/reset-primal-backup/
```

### Segurança de Credenciais

✅ **Boas práticas:**

```bash
# 1. Verificar permissões de .env
ls -l /var/www/reset-primal/.env
# Esperado: -rw------- (600)

# 2. Garantir que só root pode ler
chmod 600 /var/www/reset-primal/.env

# 3. Verificar se .gitignore tem .env
cat /var/www/reset-primal/.gitignore | grep "\.env"
# Esperado: .env (listado)

# 4. Verificar se não foi commitado
git log --oneline -- .env
# Esperado: (vazio, .env nunca foi commitado)

# 5. Rotação de secrets (a cada 30 dias)
# - Hotmart: gerar novo webhook secret
# - Gmail: gerar novo app-specific password
# - Google Analytics: renovar API secret
# - Facebook: renovar token
```

### Verificação de Integridade

```bash
# Calcular hash dos arquivos críticos
sha256sum /var/www/reset-primal/api/webhook-hotmart.js \
          /var/www/reset-primal/landing-page/index.html \
          /var/www/reset-primal/.env > /var/www/reset-primal/checksums.txt

# Verificar depois
sha256sum -c /var/www/reset-primal/checksums.txt

# Se algo mudou, será alertado!
```

---

## Renovação de Certificados

### Verificar Validade Atual

```bash
# Ver dias até expiração
sudo certbot certificates

# Saída esperada:
# - reset-primal
#   Domains: resetprimal.com.br
#   Expiry Date: 2025-04-27
#   Valid for 90 days
```

### Renovação Manual

```bash
# Let's Encrypt certificados duram 90 dias
# Certbot auto-renova, mas fazer manual se necessário:

sudo certbot renew --force-renewal

# OU renovar apenas um domínio
sudo certbot renew -d resetprimal.com.br

# Testar renovação (sem aplicar)
sudo certbot renew --dry-run
```

### Auto-Renewal (Já Configurado)

```bash
# Verificar se está ativo
sudo systemctl status certbot.timer

# Habilitar se não estiver
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Ver próxima renovação agendada
sudo systemctl list-timers certbot.timer
```

### Troubleshooting: Certificado Expirado

```bash
# 1. Parar Nginx
sudo systemctl stop nginx

# 2. Renovar com standalone
sudo certbot certonly --standalone -d resetprimal.com.br

# 3. Iniciar Nginx
sudo systemctl start nginx

# 4. Verificar
curl -I https://resetprimal.com.br
# Esperado: HTTP/1.1 200
```

---

## Escalation Procedures

### Cenário 1: Landing Page Down (erro 502)

```
DIAGNÓSTICO (1 min):
1. pm2 status
   → Se "offline" ou "errored":
2. pm2 logs hotmart-webhook --lines 50
   → Ver erro específico
3. curl http://localhost:3000/health
   → Se não responde, problema no Node.js

AÇÃO (2-5 min):
1. Tentar restart:
   pm2 restart hotmart-webhook

2. Se não funcionar, investigar:
   tail -50 /var/www/reset-primal/logs/webhook-hotmart.log
   grep -i "erro\|error" /var/www/reset-primal/logs/webhook-hotmart.log

3. Se erro for ENOENT (arquivo não encontrado):
   mkdir -p /var/www/reset-primal/logs

4. Se erro for "Cannot find module":
   cd /var/www/reset-primal
   npm install --production

5. Se erro de .env vazio:
   Verificar se .env existe e tem credenciais
   nano /var/www/reset-primal/.env
   pm2 restart hotmart-webhook

ESCALATE SE (tempo > 5 min):
- [ ] Entrar em contato com DevOps
- [ ] Fornecer output de: pm2 logs + tail .log file
```

### Cenário 2: Email não é Enviado

```
DIAGNÓSTICO (2 min):
1. Verificar se compra chegou:
   tail -5 /var/www/reset-primal/logs/webhook-hotmart.log
   → Se vazio, webhook não recebeu POST

2. Verificar logs de email:
   pm2 logs hotmart-webhook --lines 100 | grep -i "email"

AÇÃO (5 min):
1. Se erro "Invalid login":
   - GMAIL_USER ou GMAIL_PASSWORD incorretos
   - Gerar novo app-specific password em myaccount.google.com

2. Se erro "Less secure app access":
   - Ativar em: https://myaccount.google.com/lesssecureapps

3. Se sem erro mas não chegou:
   - Verificar pasta de spam do cliente
   - Responder email cliente com link de download manual

4. Testar email manual:
   node -e "
   const nodemailer = require('nodemailer');
   require('dotenv').config();

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
   }, (err) => {
     console.log(err ? 'ERRO: ' + err.message : 'OK');
   });
   "

ESCALATE SE:
- Teste manual falhar
- Erro persistir após atualizar credenciais
```

### Cenário 3: GA4 ou Facebook não Rastreiam

```
DIAGNÓSTICO (2 min):
1. Verificar se evento foi enviado:
   pm2 logs hotmart-webhook --lines 50 | grep -i "ga4\|facebook"

2. Verificar credenciais:
   grep "GOOGLE_ANALYTICS\|FACEBOOK" /var/www/reset-primal/.env

AÇÃO (5 min):
1. GA4 levando tempo?
   - Pode levar até 24h
   - Verificar em Real-time primeiro
   - analytics.google.com → Real-time

2. Facebook levando tempo?
   - Pode levar 1-2 horas
   - Verificar em Events Manager
   - business.facebook.com → Events Manager

3. Se não aparecer em Real-time:
   - Verificar ID do GA4/Pixel está correto
   - Verificar API secret está preenchido
   - Fazer compra de teste

4. Se pior vir ao pior:
   - Implementar logging extra
   - node -e "console.log(process.env.GOOGLE_ANALYTICS_PROPERTY_ID)"

ESCALATE SE:
- Eventos não aparecem após 24h
- Credenciais parecem corretas mas falham
```

### Cenário 4: Webhook Recebe 401 (Signature Inválida)

```
DIAGNÓSTICO (1 min):
1. Ver logs
   pm2 logs hotmart-webhook --lines 20 | grep -i "401\|invalid"

2. Verificar secret no servidor
   grep "HOTMART_WEBHOOK_SECRET" /var/www/reset-primal/.env

AÇÃO (5 min):
1. Confirmou secret está igual no Hotmart?
   - app.hotmart.com → Integrações → Webhooks → Seu webhook
   - Comparar secret mostrado com .env do servidor

2. Secret mudou?
   - Gerar novo no Hotmart
   - Copiar e salvar em .env
   - pm2 restart hotmart-webhook

3. Se ainda falha:
   - Webhook pode estar recebendo payload em formato diferente
   - Pedir novo secret do Hotmart
   - Fazer testes em Sandbox do Hotmart

ESCALATE SE:
- Múltiplos 401s mesmo após atualizar secret
- Padrão de falhas específico
```

---

## Comandos Úteis

### Monitoramento

```bash
# Ver status do webhook
pm2 status

# Ver logs em tempo real
pm2 logs hotmart-webhook

# Ver últimas 100 linhas
pm2 logs hotmart-webhook --lines 100

# Ver apenas erros
pm2 logs hotmart-webhook --err

# Ver status do Nginx
sudo systemctl status nginx

# Ver status do Certbot (auto-renewal)
sudo systemctl status certbot.timer

# Ver espaço em disco
df -h

# Ver memória disponível
free -h

# Ver top processos
top -b -n 1 | head -20
```

### Gerenciamento

```bash
# Restart webhook
pm2 restart hotmart-webhook

# Parar webhook (sem remover)
pm2 stop hotmart-webhook

# Remover webhook
pm2 delete hotmart-webhook

# Salvar lista de apps (para auto-start)
pm2 save

# Recarregar Nginx
sudo systemctl reload nginx

# Parar Nginx
sudo systemctl stop nginx

# Iniciar Nginx
sudo systemctl start nginx
```

### Debugging

```bash
# Testar conexão com servidor
ssh -v root@64.225.44.199

# Testar DNS
nslookup resetprimal.com.br
dig resetprimal.com.br

# Testar se porta está aberta
curl -I https://resetprimal.com.br
curl -I http://localhost:3000/health

# Ver qual processo usa porta 3000
lsof -i :3000
netstat -tlnp | grep 3000

# Ver histórico de restarts
pm2 history
```

### Logs

```bash
# Ver arquivo completo de logs
cat /var/www/reset-primal/logs/webhook-hotmart.log

# Contar compras
wc -l /var/www/reset-primal/logs/webhook-hotmart.log

# Buscar por email
grep "email@example.com" /var/www/reset-primal/logs/webhook-hotmart.log

# Buscar por data
grep "2025-01-27" /var/www/reset-primal/logs/webhook-hotmart.log

# Limpar logs
> /var/www/reset-primal/logs/webhook-hotmart.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log (tráfego)
sudo tail -f /var/log/nginx/access.log
```

---

## Alertas & Notificações

### Setup: Email Alerts

Configure notificações automáticas para falhas críticas:

```bash
# 1. Criar script de monitoramento
cat > /usr/local/bin/reset-primal-monitor.sh << 'EOF'
#!/bin/bash

# Verificar webhook
if ! curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "ALERTA: Webhook offline" | \
    mail -s "[ALERTA] Reset Primal Webhook Down" seu-email@gmail.com
    exit 1
fi

# Verificar disco
DISK=$(df /var/www/reset-primal | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK -gt 90 ]; then
    echo "ALERTA: Disco acima de 90% ($DISK%)" | \
    mail -s "[ALERTA] Reset Primal Disco Cheio" seu-email@gmail.com
fi

# Verificar memória
MEM=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ $MEM -gt 85 ]; then
    echo "ALERTA: Memória acima de 85% ($MEM%)" | \
    mail -s "[ALERTA] Reset Primal Memória Alta" seu-email@gmail.com
fi

exit 0
EOF

# 2. Dar permissão
chmod +x /usr/local/bin/reset-primal-monitor.sh

# 3. Agendar para rodar a cada 5 minutos
crontab -e
# Adicionar: */5 * * * * /usr/local/bin/reset-primal-monitor.sh
```

### Setup: Slack Webhooks (Opcional)

```bash
# Criar webhook URL no Slack
# (Settings → Apps & integrations → Custom Integrations → Incoming Webhooks)

# Notificar Slack de cada compra
cat >> /var/www/reset-primal/api/webhook-hotmart.js << 'EOF'

// SLACK NOTIFICATION
async function notifySlack(buyer, purchase) {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackUrl) return;

    try {
        await fetch(slackUrl, {
            method: 'POST',
            body: JSON.stringify({
                text: `✅ Nova compra! ${buyer.name} - R$ ${purchase.price}`
            })
        });
    } catch (error) {
        console.error('[SLACK]', error);
    }
}
EOF

# Adicionar variável
echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL" >> .env
```

---

## Checklist Semanal

Toda segunda-feira (ou fim de semana):

```
SEGUNDA-FEIRA (30 minutos):
- [ ] Verificar total de compras (compararcom semana anterior)
- [ ] Revisar logs de erro
- [ ] Testar email (fazer compra teste em Sandbox)
- [ ] Verificar certificado SSL (dias até expiração)
- [ ] Fazer backup do .env
- [ ] Revisar alertas/emails de monitoramento
- [ ] Verificar uso de disco/memória
- [ ] Testar saúde geral (curl endpoints)
- [ ] Revisar comentários/feedback de clientes
- [ ] Documentar qualquer incidente ocorrido

CHECKLIST:
[ ] Compras: ____ (comparar com semana anterior)
[ ] Erros encontrados: Sim/Não
[ ] Teste de email: OK/Falha
[ ] Certificado expira em: ____ dias
[ ] Backup realizado: Sim/Não
[ ] Alertas revisados: Sim/Não
[ ] Performance OK: Sim/Não
```

---

## Contato & Escalation

Se você executou os [Escalation Procedures](#escalation-procedures) e ainda há problema:

**Reunir informações:**

```bash
# Sistema
uname -a
node --version
nginx -v

# Status
pm2 status
pm2 logs hotmart-webhook --lines 50

# Erros
sudo tail -50 /var/log/nginx/error.log

# Últimas compras
tail -10 /var/www/reset-primal/logs/webhook-hotmart.log | jq .
```

**Enviar para:** seu-email@gmail.com
**Assunto:** [ESCALATION] Reset Primal - Descrição do problema
**Incluir:** Informações acima + timeline (quando começou, último sucesso, etc)

---

**Versão:** 1.0
**Mantido por:** Reset Primal Team
**Última atualização:** 2025-01-27
**Próxima revisão:** 2025-02-27
