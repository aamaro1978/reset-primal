#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Validar variáveis de ambiente
# Uso: bash scripts/validate-env.sh
# ════════════════════════════════════════════════════════════════

set +e

echo "🔍 Validando variáveis de ambiente..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0
WARNING=0

# ════════════════════════════════════════════════════════════════
# VALIDAÇÃO DE ARQUIVO .env
# ════════════════════════════════════════════════════════════════

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERRO: Arquivo .env não encontrado${NC}"
    echo "   Criar a partir de .env.template-COMPLETO:"
    echo "   cp .env.template-COMPLETO .env"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# VALIDAR VARIÁVEIS OBRIGATÓRIAS
# ════════════════════════════════════════════════════════════════

REQUIRED_VARS=(
    "HOTMART_WEBHOOK_SECRET"
    "SENDGRID_API_KEY"
    "SENDGRID_FROM_EMAIL"
    "GOOGLE_ANALYTICS_PROPERTY_ID"
)

echo "📋 Validando variáveis OBRIGATÓRIAS:"
echo ""

for var in "${REQUIRED_VARS[@]}"; do
    source .env
    value=$(eval echo \$$var)

    if [ -z "$value" ] || [ "$value" = "cole_seu_"* ] || [ "$value" = "*_aqui*" ]; then
        echo -e "${RED}  ❌ $var: FALTANDO/INVÁLIDA${NC}"
        ((FAILED++))
    elif [[ "$value" == *"@"* ]] || [[ "$value" == *"SG."* ]] || [[ "$value" == *"G-"* ]]; then
        echo -e "${GREEN}  ✅ $var: OK${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}  ⚠️  $var: Valor presente (não validado)${NC}"
        ((WARNING++))
    fi
done

echo ""

# ════════════════════════════════════════════════════════════════
# VALIDAR VARIÁVEIS OPCIONAIS
# ════════════════════════════════════════════════════════════════

OPTIONAL_VARS=(
    "FACEBOOK_PIXEL_ID"
    "TELEGRAM_BOT_TOKEN"
    "GOOGLE_ANALYTICS_API_SECRET"
)

echo "📋 Validando variáveis OPCIONAIS:"
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    value=$(eval echo \$$var)

    if [ -z "$value" ] || [ "$value" = "cole_seu_"* ]; then
        echo -e "${YELLOW}  ⚠️  $var: NÃO CONFIGURADA (opcional)${NC}"
        ((WARNING++))
    else
        echo -e "${GREEN}  ✅ $var: OK${NC}"
        ((PASSED++))
    fi
done

echo ""

# ════════════════════════════════════════════════════════════════
# VALIDAR FORMATOS ESPECÍFICOS
# ════════════════════════════════════════════════════════════════

echo "🔐 Validando formatos de SEGURANÇA:"
echo ""

# GA Measurement ID deve começar com G-
if [[ "$GOOGLE_ANALYTICS_PROPERTY_ID" =~ ^G-[A-Z0-9]{10}$ ]]; then
    echo -e "${GREEN}  ✅ GA Measurement ID: Formato correto${NC}"
    ((PASSED++))
elif [ -n "$GOOGLE_ANALYTICS_PROPERTY_ID" ]; then
    echo -e "${YELLOW}  ⚠️  GA Measurement ID: Formato pode estar errado (esperado: G-XXXXXXXXXX)${NC}"
    ((WARNING++))
fi

# SendGrid key deve começar com SG.
if [[ "$SENDGRID_API_KEY" =~ ^SG\. ]]; then
    echo -e "${GREEN}  ✅ SendGrid API Key: Formato correto${NC}"
    ((PASSED++))
elif [ -n "$SENDGRID_API_KEY" ]; then
    echo -e "${YELLOW}  ⚠️  SendGrid API Key: Deve começar com SG.${NC}"
    ((WARNING++))
fi

# Hotmart Secret deve ter comprimento mínimo
if [ ${#HOTMART_WEBHOOK_SECRET} -gt 20 ]; then
    echo -e "${GREEN}  ✅ Hotmart Secret: Comprimento OK${NC}"
    ((PASSED++))
else
    echo -e "${RED}  ❌ Hotmart Secret: Muito curto (mínimo 20 caracteres)${NC}"
    ((FAILED++))
fi

# Email válido
if [[ "$SENDGRID_FROM_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${GREEN}  ✅ Email: Formato válido${NC}"
    ((PASSED++))
else
    echo -e "${RED}  ❌ Email: Formato inválido${NC}"
    ((FAILED++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# TESTE DE CONECTIVIDADE (opcional)
# ════════════════════════════════════════════════════════════════

echo "🌐 Teste de conectividade com APIs (opcional):"
echo ""

# Testar SendGrid
if command -v curl &> /dev/null; then
    echo -n "  Testando SendGrid... "
    SENDGRID_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $SENDGRID_API_KEY" \
        https://api.sendgrid.com/v3/mail/send)

    if [ "$SENDGRID_TEST" = "400" ] || [ "$SENDGRID_TEST" = "200" ]; then
        echo -e "${GREEN}OK${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FALHOU (HTTP $SENDGRID_TEST)${NC}"
        ((FAILED++))
    fi

    # Testar Google Analytics
    echo -n "  Testando Google Analytics... "
    if [ -n "$GOOGLE_ANALYTICS_API_SECRET" ]; then
        echo -e "${GREEN}Chave presente${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}Sem API Secret configurado${NC}"
        ((WARNING++))
    fi
else
    echo "  ⚠️  curl não disponível - pulando testes de conectividade"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# RESUMO FINAL
# ════════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════════"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}✅ Passou: $PASSED${NC}"
echo -e "  ${YELLOW}⚠️  Aviso: $WARNING${NC}"
echo -e "  ${RED}❌ Falhou: $FAILED${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ════════════════════════════════════════════════════════════════

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ VALIDAÇÃO FALHOU - Corrija os erros acima${NC}"
    exit 1
elif [ $WARNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDAÇÃO COM AVISOS - Verifique as integrações opcionais${NC}"
    exit 0
else
    echo -e "${GREEN}✅ VALIDAÇÃO OK - Variáveis de ambiente corretas!${NC}"
    exit 0
fi
