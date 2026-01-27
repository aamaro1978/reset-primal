#!/bin/bash

# ====================================================================
# RESET PRIMAL - QUICK DEPLOY SCRIPT
# Deploy automático: Landing + Webhook + Nginx
# ====================================================================

set -e

PROJECT_DIR="/Users/acacioamaro/Projects/reset-primal"
WEBHOOK_PORT=3000

echo "🚀 RESET PRIMAL - QUICK DEPLOY"
echo "=================================="
echo ""

# ========== 1. VERIFICAR DEPENDÊNCIAS ==========
echo "✓ Verificando dependências..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não instalado. Instale em https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM não instalado"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ NPM: $(npm --version)"
echo ""

# ========== 2. INSTALAR DEPENDÊNCIAS NODE ==========
echo "✓ Instalando dependências Node..."
cd "$PROJECT_DIR"
npm install --production > /dev/null 2>&1
echo "✅ Dependências instaladas"
echo ""

# ========== 3. VERIFICAR .ENV ==========
echo "✓ Verificando .env..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ Arquivo .env não encontrado"
    echo "   Copie o template: cp .env.example .env"
    exit 1
fi

# Verificar se tem variáveis preenchidas
if grep -q "PLACEHOLDER\|seu_\|XXXXXXXXXX" "$PROJECT_DIR/.env"; then
    echo "⚠️  AVISO: .env contém placeholders ainda não preenchidos!"
    echo "   Preencha em: $PROJECT_DIR/.env"
    read -p "   Continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi
echo "✅ .env encontrado"
echo ""

# ========== 4. CRIAR LOGS DIR ==========
echo "✓ Configurando logs..."
mkdir -p "$PROJECT_DIR/logs"
touch "$PROJECT_DIR/logs/webhook-hotmart.log"
echo "✅ Diretório logs criado"
echo ""

# ========== 5. TESTAR WEBHOOK ==========
echo "✓ Testando webhook..."
cd "$PROJECT_DIR"
timeout 5 node api/webhook-hotmart.js > /dev/null 2>&1 &
sleep 2

if curl -s http://localhost:$WEBHOOK_PORT/health | grep -q "ok"; then
    echo "✅ Webhook respondendo em localhost:$WEBHOOK_PORT"
    pkill -f "node api/webhook-hotmart.js"
else
    echo "⚠️  Webhook pode estar com problema"
    pkill -f "node api/webhook-hotmart.js" || true
fi
echo ""

# ========== 6. VERIFICAR LANDING PAGE ==========
echo "✓ Verificando landing page..."
if grep -q "hotmart.com" "$PROJECT_DIR/landing-page/index.html"; then
    echo "✅ Links Hotmart encontrados"
else
    echo "⚠️  Aviso: Links Hotmart não encontrados"
fi

if grep -q "dataLayer" "$PROJECT_DIR/landing-page/index.html"; then
    echo "✅ GA4 integrado"
else
    echo "⚠️  Aviso: GA4 pode não estar integrado"
fi

if grep -q "fbq" "$PROJECT_DIR/landing-page/index.html"; then
    echo "✅ Facebook Pixel integrado"
else
    echo "⚠️  Aviso: Facebook Pixel pode não estar integrado"
fi
echo ""

# ========== 7. SUMMARY ==========
echo "✅ DEPLOY PRONTO!"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "  1. Preencher .env com credenciais reais"
echo "  2. Configurar Nginx:"
echo "     sudo cp $PROJECT_DIR/nginx-reset-primal.conf /etc/nginx/sites-available/reset-primal"
echo "     sudo ln -s /etc/nginx/sites-available/reset-primal /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  3. Instalar SSL (Let's Encrypt):"
echo "     sudo certbot certonly --webroot -w $PROJECT_DIR/landing-page -d resetprimal.com.br"
echo ""
echo "  4. Start webhook em produção:"
echo "     npm install -g pm2"
echo "     pm2 start api/webhook-hotmart.js --name 'hotmart-webhook'"
echo "     pm2 startup"
echo "     pm2 save"
echo ""
echo "  5. Testar:"
echo "     curl https://resetprimal.com.br/health"
echo ""
echo "📊 Logs: tail -f $PROJECT_DIR/logs/webhook-hotmart.log"
echo ""
