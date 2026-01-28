#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Validar configuração Nginx
# Uso: bash scripts/validate-nginx.sh
# ════════════════════════════════════════════════════════════════

echo "🔍 Validando Nginx..."
echo ""

# 1. Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx NÃO está instalado"
    echo "   Instale com: sudo apt-get install nginx"
    exit 1
fi

echo "✅ Nginx instalado"

# 2. Verificar se arquivo config existe
CONFIG_FILE="/etc/nginx/sites-available/resetprimal.com.br"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  Config file NÃO encontrado: $CONFIG_FILE"
    echo "   (esperado em produção)"
else
    echo "✅ Config file encontrado: $CONFIG_FILE"
fi

# 3. Testar sintaxe Nginx
if sudo nginx -t 2>/dev/null; then
    echo "✅ Sintaxe Nginx OK"
else
    echo "❌ Sintaxe Nginx INVÁLIDA"
    echo "   Execute: sudo nginx -t"
    exit 1
fi

# 4. Verificar se Nginx está rodando
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "⚠️  Nginx NÃO está rodando"
    echo "   Inicie com: sudo systemctl start nginx"
fi

# 5. Verificar certificado SSL
CERT_FILE="/etc/letsencrypt/live/resetprimal.com.br/fullchain.pem"
if [ -f "$CERT_FILE" ]; then
    echo "✅ Certificado SSL encontrado"

    # Verificar validade
    EXPIRY=$(sudo openssl x509 -in "$CERT_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        echo "   Expira em: $EXPIRY"
    fi
else
    echo "⚠️  Certificado SSL NÃO encontrado: $CERT_FILE"
fi

# 6. Verificar logs
ACCESS_LOG="/var/log/nginx/access.log"
ERROR_LOG="/var/log/nginx/error.log"

if [ -f "$ACCESS_LOG" ]; then
    echo "✅ Access log encontrado"
    RECENT_ERRORS=$(sudo tail -5 "$ERROR_LOG" 2>/dev/null | grep -i error | wc -l)
    if [ $RECENT_ERRORS -gt 0 ]; then
        echo "⚠️  $RECENT_ERRORS erros nos últimos logs"
    fi
else
    echo "⚠️  Access log NÃO encontrado"
fi

echo ""
echo "════════════════════════════════════"
echo "✅ Validação Nginx completa"
echo "════════════════════════════════════"
