#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Validação Setup Pré-Kick-off
# Uso: bash scripts/validate-setup.sh
# Tempo economizado: 10 minutos
# ════════════════════════════════════════════════════════════════

set +e

echo ""
echo "🔍 VALIDANDO SETUP PRÉ-KICK-OFF"
echo "================================="
echo ""

PASS=0
FAIL=0
WARN=0

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════
# 1. ARQUIVOS ESTRUTURA
# ════════════════════════════════════════════════════════════════
echo "📁 Verificando estrutura de pastas..."

if [ -d "landing-page" ]; then
    echo -e "${GREEN}✅${NC} landing-page/ existe"
    ((PASS++))
else
    echo -e "${RED}❌${NC} landing-page/ NÃO existe"
    ((FAIL++))
fi

if [ -d "api" ]; then
    echo -e "${GREEN}✅${NC} api/ existe"
    ((PASS++))
else
    echo -e "${RED}❌${NC} api/ NÃO existe"
    ((FAIL++))
fi

if [ -d "scripts" ]; then
    echo -e "${GREEN}✅${NC} scripts/ existe"
    ((PASS++))
else
    echo -e "${RED}❌${NC} scripts/ NÃO existe"
    ((FAIL++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# 2. DOCUMENTAÇÃO
# ════════════════════════════════════════════════════════════════
echo "📋 Verificando documentação..."

docs=(
    "DELEGACAO-RESUMO.txt"
    "DELEGACAO-POR-ESPECIALIDADE.md"
    "IMPLEMENTACAO-FRONTEND-STEP-BY-STEP.md"
    "IMPLEMENTACAO-BACKEND-STEP-BY-STEP.md"
    "IMPLEMENTACAO-DEVOPS-STEP-BY-STEP.md"
    "KICK-OFF-APRESENTACAO.md"
    "TEMPLATES-SLACK.txt"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅${NC} $doc"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $doc NÃO encontrado"
        ((FAIL++))
    fi
done

echo ""

# ════════════════════════════════════════════════════════════════
# 3. FILES DE TEMPLATE
# ════════════════════════════════════════════════════════════════
echo "⚙️  Verificando templates..."

if [ -f ".env.template" ]; then
    echo -e "${GREEN}✅${NC} .env.template existe"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️ ${NC} .env.template NÃO existe (não crítico)"
    ((WARN++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# 4. GIT STATUS
# ════════════════════════════════════════════════════════════════
echo "🔧 Verificando Git..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Repositório Git inicializado"
    ((PASS++))

    # Verificar se tem commits
    if git rev-parse HEAD > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} Tem commits no repositório"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} Nenhum commit ainda"
        ((FAIL++))
    fi

    # Verificar se tem staging area
    STAGING=$(git diff --cached --numstat | wc -l)
    if [ $STAGING -gt 0 ]; then
        echo -e "${YELLOW}⚠️ ${NC} Há mudanças staged ($(($STAGING / 3)) files)"
        ((WARN++))
    else
        echo -e "${GREEN}✅${NC} Staging area limpa"
        ((PASS++))
    fi

else
    echo -e "${RED}❌${NC} NÃO é um repositório Git"
    ((FAIL++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# 5. NODE.JS (para Backend)
# ════════════════════════════════════════════════════════════════
echo "📦 Verificando Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js instalado: $NODE_VERSION"
    ((PASS++))
else
    echo -e "${RED}❌${NC} Node.js NÃO instalado"
    ((FAIL++))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅${NC} npm instalado: $NPM_VERSION"
    ((PASS++))
else
    echo -e "${RED}❌${NC} npm NÃO instalado"
    ((FAIL++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# 6. NGINX (para DevOps)
# ════════════════════════════════════════════════════════════════
echo "🌐 Verificando Nginx..."

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d' ' -f3)
    echo -e "${GREEN}✅${NC} Nginx instalado: $NGINX_VERSION"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️ ${NC} Nginx NÃO instalado (apenas em servidor)"
    ((WARN++))
fi

echo ""

# ════════════════════════════════════════════════════════════════
# 7. RESUMO
# ════════════════════════════════════════════════════════════════
echo "════════════════════════════════════════"
echo -e "${GREEN}✅ OK: $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Falhas: $FAIL${NC}"
echo "════════════════════════════════════════"
echo ""

# ════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ════════════════════════════════════════════════════════════════

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ SETUP VALIDADO - PRONTO PARA KICK-OFF!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Executar: bash scripts/setup-backend.sh"
    echo "2. Compartilhar DELEGACAO-RESUMO.txt com equipe"
    echo "3. Começar kick-off às 10:00am"
    echo ""
    exit 0
else
    echo -e "${RED}❌ PROBLEMAS ENCONTRADOS - CORRIGIR ANTES DO KICK-OFF${NC}"
    echo ""
    echo "Corrigir os itens marcados com ❌ acima"
    echo ""
    exit 1
fi
