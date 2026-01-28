#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Verificar Setup Frontend
# Uso: bash scripts/setup-frontend-checklist.sh
# ════════════════════════════════════════════════════════════════

echo "🔍 Verificando setup Frontend..."
echo ""

PASS=0
FAIL=0

# 1. Arquivo existe?
if [ -f "landing-page/grand-slam/index.html" ]; then
    echo "✅ landing-page/grand-slam/index.html encontrado"
    ((PASS++))
else
    echo "❌ landing-page/grand-slam/index.html NÃO encontrado"
    ((FAIL++))
fi

# 2. Arquivo tem conteúdo?
if [ -f "landing-page/grand-slam/index.html" ]; then
    SIZE=$(wc -c < "landing-page/grand-slam/index.html")
    if [ $SIZE -gt 1000 ]; then
        echo "✅ Arquivo tem conteúdo ($SIZE bytes)"
        ((PASS++))
    else
        echo "❌ Arquivo vazio ou muito pequeno"
        ((FAIL++))
    fi
fi

# 3. Tem tags HTML básicas?
if grep -q "<html" "landing-page/grand-slam/index.html" 2>/dev/null; then
    echo "✅ Tem tags HTML básicas"
    ((PASS++))
else
    echo "❌ Faltam tags HTML"
    ((FAIL++))
fi

# 4. Tem seção <head>?
if grep -q "<head" "landing-page/grand-slam/index.html" 2>/dev/null; then
    echo "✅ Tem seção <head>"
    ((PASS++))
else
    echo "❌ Falta seção <head>"
    ((FAIL++))
fi

# 5. Tem botões CTA?
CTA_COUNT=$(grep -o "cta-button" "landing-page/grand-slam/index.html" 2>/dev/null | wc -l)
if [ $CTA_COUNT -ge 2 ]; then
    echo "✅ Tem $CTA_COUNT botões CTA (esperado 3)"
    ((PASS++))
else
    echo "⚠️  Tem apenas $CTA_COUNT botões CTA (esperado 3)"
    ((FAIL++))
fi

echo ""
echo "════════════════════════════════════════"
echo "Resultado: $PASS OK / $FAIL PROBLEMAS"
echo "════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ Setup Frontend OK! Pronto para começar."
    exit 0
else
    echo "⚠️  Há problemas. Verifique os arquivos."
    exit 1
fi
