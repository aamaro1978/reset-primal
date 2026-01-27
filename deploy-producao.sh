#!/bin/bash

# ====================================================================
# RESET PRIMAL - DEPLOYMENT PRODUÇÃO COMPLETO
# Deploy automático: Nginx + SSL + PM2 + Teste
# ====================================================================

set -e

PROJECT_DIR="/var/www/reset-primal"
DOMAIN="resetprimal.com.br"
WEBHOOK_PORT=3000

echo "🚀 RESET PRIMAL - DEPLOYMENT PRODUÇÃO"
echo "======================================"
echo ""
echo "Domínio: $DOMAIN"
echo "Projeto: $PROJECT_DIR"
echo "IP: $(hostname -I | awk '{print $1}')"
echo ""

# ========== PASSO 6: SETUP NGINX ==========
echo "📦 PASSO 6: Configurando Nginx (20 min)"
echo "=========================================="

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
fi

echo "✅ Nginx instalado"

# Copiar config
echo "Copiando configuração Nginx..."
sudo cp $PROJECT_DIR/nginx-reset-primal.conf \
    /etc/nginx/sites-available/reset-primal

# Ativar (criar symlink)
if [ -L /etc/nginx/sites-enabled/reset-primal ]; then
    echo "Symlink já existe, removendo..."
    sudo rm /etc/nginx/sites-enabled/reset-primal
fi

sudo ln -s /etc/nginx/sites-available/reset-primal \
           /etc/nginx/sites-enabled/reset-primal

# Remover default (opcional)
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "Removendo config padrão..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Testar config
echo "Testando configuração Nginx..."
if sudo nginx -t; then
    echo "✅ Nginx syntax OK"
else
    echo "❌ Erro na configuração Nginx"
    exit 1
fi

# Recarregar
sudo systemctl reload nginx
echo "✅ Nginx recarregado"

# Verificar status
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx ativo e rodando"
else
    echo "❌ Nginx não está rodando"
    exit 1
fi

echo ""

# ========== PASSO 7: SSL/HTTPS ==========
echo "🔒 PASSO 7: Configurando SSL/HTTPS (30 min)"
echo "============================================"

# Instalar Certbot se não existir
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

echo "✅ Certbot instalado"

# Verificar se certificado já existe
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ Certificado já existe"
    echo "Data de expiração:"
    sudo openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -dates
else
    echo "Gerando novo certificado para $DOMAIN..."

    # Gerar certificado
    sudo certbot certonly --webroot \
        -w $PROJECT_DIR/landing-page \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        --register-unsafely-without-email

    if [ $? -eq 0 ]; then
        echo "✅ Certificado gerado com sucesso"
    else
        echo "⚠️  Certificado pode ter tido erro (pode ser esperado se DNS não aponta)"
    fi
fi

# Recarregar Nginx para aplicar SSL
sudo systemctl reload nginx
echo "✅ Nginx recarregado com SSL"

echo ""

# ========== PASSO 8: PM2 ==========
echo "⚙️  PASSO 8: Configurando PM2 (10 min)"
echo "======================================"

# Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2 globalmente..."
    sudo npm install -g pm2
fi

echo "✅ PM2 instalado"

# Parar webhook anterior se existir
pm2 stop hotmart-webhook 2>/dev/null || true
sleep 1

# Deletar anterior
pm2 delete hotmart-webhook 2>/dev/null || true
sleep 1

# Start novo webhook
echo "Iniciando webhook em produção..."
cd $PROJECT_DIR
pm2 start api/webhook-hotmart.js --name "hotmart-webhook"

sleep 2

# Verificar status
if pm2 show hotmart-webhook | grep -q "online"; then
    echo "✅ Webhook online"
else
    echo "⚠️  Webhook pode estar com problema"
    pm2 logs hotmart-webhook --lines 10
fi

# Configurar autostart
echo "Configurando autostart..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup \
    systemd -u root --hp /root

pm2 save

echo "✅ PM2 configurado para autostart"

echo ""

# ========== VERIFICAÇÃO FINAL ==========
echo "✅ VERIFICAÇÃO FINAL"
echo "===================="

echo ""
echo "1️⃣  Health Check Local (localhost:3000/health)"
if curl -s http://localhost:$WEBHOOK_PORT/health | grep -q "ok"; then
    echo "   ✅ Webhook respondendo"
else
    echo "   ⚠️  Webhook pode estar com problema"
fi

echo ""
echo "2️⃣  Landing Page"
echo "   🌐 https://$DOMAIN"
echo "   🌐 https://www.$DOMAIN"

echo ""
echo "3️⃣  Status dos Serviços"
echo "   Nginx:"
sudo systemctl status nginx | grep -E "Active|loaded" | head -1
echo "   PM2:"
pm2 status | grep hotmart-webhook || echo "   hotmart-webhook offline"

echo ""
echo "4️⃣  Certificado SSL"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "   Data de expiração:"
    sudo openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
        -noout -enddate 2>/dev/null | cut -d= -f2 || echo "   (Não foi possível verificar)"
else
    echo "   ⚠️  Certificado não encontrado"
fi

echo ""
echo "5️⃣  Logs"
echo "   Webhook: tail -f $PROJECT_DIR/logs/webhook-hotmart.log"
echo "   Nginx errors: sudo tail -f /var/log/nginx/error.log"
echo "   PM2: pm2 logs hotmart-webhook"

echo ""
echo "======================================================================"
echo "✅ DEPLOYMENT COMPLETADO!"
echo "======================================================================"
echo ""
echo "🎉 Reset Primal está pronto para produção!"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Configurar webhook no Hotmart (app.hotmart.com)"
echo "2. Fazer compra de teste"
echo "3. Validar: Email → GA4 → Facebook"
echo "4. Monitorar logs: pm2 logs hotmart-webhook"
echo ""
echo "======================================================================"
