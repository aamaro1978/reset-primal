#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Health Check para Reset Primal
# Uso: bash scripts/health-check.sh
# Para rodar a cada 5 minutos: */5 * * * * /path/to/health-check.sh
# ════════════════════════════════════════════════════════════════

set +e

DOMAIN="resetprimal.com.br"
LOG_FILE="/var/log/reset-primal-healthcheck.log"
ALERTS_EMAIL="admin@resetprimal.com.br"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Health Check iniciado" >> "$LOG_FILE"

# ════════════════════════════════════════════════════════════════
# 1. VERIFICAR LANDING PAGE
# ════════════════════════════════════════════════════════════════
LP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
if [ "$LP_STATUS" = "200" ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Landing Page OK ($LP_STATUS)" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ Landing Page ERROR ($LP_STATUS)" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 2. VERIFICAR E-BOOK
# ════════════════════════════════════════════════════════════════
EBOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/ebook")
if [ "$EBOOK_STATUS" = "200" ]; then
    echo "[$(date +'%H:%M:%S')] ✅ E-book OK ($EBOOK_STATUS)" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ E-book ERROR ($EBOOK_STATUS)" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 3. VERIFICAR WEBHOOK
# ════════════════════════════════════════════════════════════════
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://$DOMAIN/webhook/hotmart")
if [ "$WEBHOOK_STATUS" = "401" ] || [ "$WEBHOOK_STATUS" = "400" ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Webhook OK (respondendo: $WEBHOOK_STATUS)" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ Webhook ERROR ($WEBHOOK_STATUS)" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 4. VERIFICAR SSL CERTIFICADO
# ════════════════════════════════════════════════════════════════
CERT_DAYS=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
            openssl x509 -noout -dates 2>/dev/null | grep notAfter | \
            awk -F'=' '{print $2}' | \
            xargs -I {} date -d {} +%s)

CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( ($CERT_DAYS - $CURRENT_DATE) / 86400 ))

if [ $DAYS_LEFT -gt 30 ]; then
    echo "[$(date +'%H:%M:%S')] ✅ SSL Certificate OK ($DAYS_LEFT dias restantes)" >> "$LOG_FILE"
elif [ $DAYS_LEFT -gt 7 ]; then
    echo "[$(date +'%H:%M:%S')] ⚠️  SSL Certificate expira em $DAYS_LEFT dias" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ SSL Certificate expira em $DAYS_LEFT dias - RENOVAR JÁ" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 5. VERIFICAR PM2 WEBHOOK
# ════════════════════════════════════════════════════════════════
if pm2 list | grep -q "reset-primal-webhook"; then
    PM2_STATUS=$(pm2 describe reset-primal-webhook | grep status | grep -o "online\|stopped")
    if [ "$PM2_STATUS" = "online" ]; then
        echo "[$(date +'%H:%M:%S')] ✅ PM2 Webhook rodando" >> "$LOG_FILE"
    else
        echo "[$(date +'%H:%M:%S')] ❌ PM2 Webhook NÃO está rodando" >> "$LOG_FILE"
    fi
else
    echo "[$(date +'%H:%M:%S')] ⚠️  PM2 Webhook não encontrado" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 6. VERIFICAR NGINX
# ════════════════════════════════════════════════════════════════
if sudo systemctl is-active --quiet nginx; then
    echo "[$(date +'%H:%M:%S')] ✅ Nginx rodando" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ Nginx NÃO está rodando - REINICIAR!" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 7. VERIFICAR ESPAÇO EM DISCO
# ════════════════════════════════════════════════════════════════
DISK_USAGE=$(df /var/www | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "[$(date +'%H:%M:%S')] ✅ Espaço disco OK ($DISK_USAGE% usado)" >> "$LOG_FILE"
elif [ $DISK_USAGE -lt 90 ]; then
    echo "[$(date +'%H:%M:%S')] ⚠️  Disco 80%+ cheio ($DISK_USAGE% usado)" >> "$LOG_FILE"
else
    echo "[$(date +'%H:%M:%S')] ❌ DISCO CRÍTICO ($DISK_USAGE% usado) - LIMPAR JÁ" >> "$LOG_FILE"
fi

# ════════════════════════════════════════════════════════════════
# 8. RESUMO
# ════════════════════════════════════════════════════════════════
echo "[$(date +'%H:%M:%S')] ════════════════════════════════════════" >> "$LOG_FILE"

echo "Health check completo. Verifique: $LOG_FILE"
