#!/bin/bash

# Script para completar landing-page/index.html com o conteúdo do validated

VALIDATED="/Users/acacioamaro/Projects/reset-primal/landing-page/validated/index.html"
TARGET="/Users/acacioamaro/Projects/reset-primal/landing-page/index.html"

if [ ! -f "$VALIDATED" ]; then
    echo "❌ Arquivo validated não encontrado!"
    exit 1
fi

# Copiar arquivo completo
echo "📋 Copiando arquivo validated → index.html..."
cp "$VALIDATED" "$TARGET"

echo "✅ Arquivo completo! Agora adicione GA4 + Facebook Pixel + eventos."
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Preencher .env com credenciais"
echo "2. Testar webhook: node api/webhook-hotmart.js"
echo "3. Deploy nginx com proxy"

