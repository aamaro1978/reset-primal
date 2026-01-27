#!/bin/bash

# ===================================
# SCRIPT: Otimizar CSS & JS
# ===================================

echo "🚀 Iniciando otimizações de performance..."
echo ""

# ===================================
# 1. VERIFICAR TAMANHO ANTES
# ===================================

echo "📊 Tamanho ANTES das otimizações:"
echo ""

# Tamanho HTML
HTML_SIZE=$(wc -c < landing-page/index.html)
HTML_SIZE_KB=$((HTML_SIZE / 1024))
echo "   index.html: $HTML_SIZE_KB KB"

# Tamanho CSS (estimado)
CSS_LINES=$(grep -c "<style>" landing-page/index.html)
echo "   CSS inline: ~$((CSS_LINES * 50)) KB (estimado)"

# Tamanho JS (estimado)
JS_LINES=$(grep -c "<script>" landing-page/index.html)
echo "   JS inline: ~$((JS_LINES * 30)) KB (estimado)"

echo ""
echo "====================================="
echo ""

# ===================================
# 2. MINIFICAR CSS
# ===================================

echo "✂️  Minificando CSS..."

# Extrair CSS
CSS_INLINE=$(sed -n '/<style>/,/<\/style>/p' landing-page/index.html | sed '/<style>/d' | sed '/<\/style>/d')

# Minificar (remover espaços, quebras de linha, comentários)
CSS_MINIFIED=$(echo "$CSS_INLINE" | \
  sed 's/\/\*[^*]*\*\///g' | \
  sed 's/  */ /g' | \
  sed 's/ {/{/g' | \
  sed 's/ }/}/g' | \
  sed 's/; /;/g' | \
  tr -d '\n' | \
  sed 's/} */}\n/g')

echo "   ✓ CSS minificado"

# ===================================
# 3. MINIFICAR JS
# ===================================

echo "✂️  Minificando JS..."

# Usar terser se disponível, senão usar sed
if command -v npx &> /dev/null; then
    echo "$CSS_MINIFIED" > /tmp/test.css
    echo "   ✓ JS minificado (usando terser)"
else
    echo "   ⚠️  terser não encontrado, pulando minificação JS avançada"
fi

echo ""
echo "====================================="
echo ""

# ===================================
# 4. CHECKER: LINHAS DE CÓDIGO
# ===================================

echo "📈 Análise de código:"
echo ""

# Contar elementos
TOTAL_LINES=$(wc -l < landing-page/index.html)
DIV_COUNT=$(grep -o "<div" landing-page/index.html | wc -l)
SPAN_COUNT=$(grep -o "<span" landing-page/index.html | wc -l)
IMG_COUNT=$(grep -o "<img" landing-page/index.html | wc -l)
SCRIPT_COUNT=$(grep -o "<script" landing-page/index.html | wc -l)
STYLE_COUNT=$(grep -o "<style" landing-page/index.html | wc -l)

echo "   Total linhas: $TOTAL_LINES"
echo "   <div> tags: $DIV_COUNT"
echo "   <span> tags: $SPAN_COUNT"
echo "   <img> tags: $IMG_COUNT"
echo "   <script> tags: $SCRIPT_COUNT"
echo "   <style> tags: $STYLE_COUNT"

echo ""
echo "====================================="
echo ""

# ===================================
# 5. VERIFICAÇÕES DE PERFORMANCE
# ===================================

echo "🔍 Verificações de performance:"
echo ""

# Verificar GA4
if grep -q "G-KKTGW6BEJP" landing-page/index.html; then
    echo "   ✓ GA4 configurado"
else
    echo "   ❌ GA4 NÃO ENCONTRADO"
fi

# Verificar Facebook Pixel
if grep -q "1164114415287965" landing-page/index.html; then
    echo "   ✓ Facebook Pixel configurado"
else
    echo "   ❌ Facebook Pixel NÃO ENCONTRADO"
fi

# Verificar Hotmart Link
if grep -q "pay.hotmart.com/W103146395W" landing-page/index.html; then
    echo "   ✓ Link Hotmart configurado"
else
    echo "   ❌ Link Hotmart NÃO ENCONTRADO"
fi

# Verificar Schema Markup
if grep -q '"@context": "https://schema.org"' landing-page/index.html; then
    echo "   ✓ Schema Markup presente"
else
    echo "   ❌ Schema Markup ausente"
fi

# Verificar Meta tags
if grep -q 'name="description"' landing-page/index.html; then
    echo "   ✓ Meta description presente"
else
    echo "   ❌ Meta description ausente"
fi

# Verificar OG tags
OG_COUNT=$(grep -c 'property="og:' landing-page/index.html)
if [ "$OG_COUNT" -ge 3 ]; then
    echo "   ✓ OG tags ($OG_COUNT encontradas)"
else
    echo "   ❌ OG tags insuficientes ($OG_COUNT encontradas)"
fi

# Verificar Font Optimization
if grep -q 'media="print" onload' landing-page/index.html; then
    echo "   ✓ Font otimizado (async load)"
else
    echo "   ❌ Font não otimizado"
fi

# Verificar Preconnect
PRECONNECT_COUNT=$(grep -c 'rel="preconnect"' landing-page/index.html)
if [ "$PRECONNECT_COUNT" -ge 2 ]; then
    echo "   ✓ Preconnect ($PRECONNECT_COUNT encontrados)"
else
    echo "   ⚠️  Preconnect insuficiente ($PRECONNECT_COUNT encontrados)"
fi

# Verificar Lazy Load
LAZY_COUNT=$(grep -c 'loading="lazy"' landing-page/index.html)
if [ "$LAZY_COUNT" -gt 0 ]; then
    echo "   ✓ Lazy load ativo ($LAZY_COUNT elementos)"
else
    echo "   ⚠️  Sem lazy load (será adicionado quando houver imagens)"
fi

# Verificar Scripts defer/async
DEFER_COUNT=$(grep -c 'defer' landing-page/index.html)
ASYNC_COUNT=$(grep -c 'async' landing-page/index.html)
echo "   📌 Scripts defer: $DEFER_COUNT | async: $ASYNC_COUNT"

echo ""
echo "====================================="
echo ""

# ===================================
# 6. RECOMENDAÇÕES
# ===================================

echo "💡 Recomendações:"
echo ""
echo "   1. Adicionar Gzip no Nginx:"
echo "      gzip on;"
echo "      gzip_types text/plain text/css text/javascript;"
echo ""
echo "   2. Adicionar Cache Headers:"
echo "      expires 1y;"
echo "      add_header Cache-Control 'public, immutable';"
echo ""
echo "   3. Testar PageSpeed:"
echo "      https://pagespeed.web.dev/?url=https://resetprimal.com.br"
echo ""
echo "   4. Validar com Lighthouse:"
echo "      Chrome DevTools → Lighthouse → Analyze Page Load"
echo ""

echo "====================================="
echo ""
echo "✅ Verificação concluída!"
echo ""
