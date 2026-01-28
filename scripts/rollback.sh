#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Rollback de Emergência
# Uso: bash scripts/rollback.sh
# ⚠️  APENAS USE SE TUDO ESTIVER QUEBRADO
# ════════════════════════════════════════════════════════════════

set -e

echo "🚨 ROLLBACK DE EMERGÊNCIA INICIADO"
echo ""
echo "⚠️  AVISO: Isto vai reverter as mudanças mais recentes!"
echo "Pressione Ctrl+C para cancelar (próximos 10 segundos)..."
sleep 10

# ════════════════════════════════════════════════════════════════
# 1. PARAR APLICAÇÃO
# ════════════════════════════════════════════════════════════════
echo "1. Parando aplicação..."
pm2 stop reset-primal-webhook || true
pm2 kill || true
echo "   ✅ Aplicação parada"

# ════════════════════════════════════════════════════════════════
# 2. PARAR NGINX
# ════════════════════════════════════════════════════════════════
echo "2. Parando Nginx..."
sudo systemctl stop nginx || true
echo "   ✅ Nginx parado"

# ════════════════════════════════════════════════════════════════
# 3. BACKUP DO ESTADO ATUAL
# ════════════════════════════════════════════════════════════════
echo "3. Fazendo backup..."
BACKUP_DIR="/var/www/reset-primal/backups/rollback-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /var/www/reset-primal/api "$BACKUP_DIR/api-backup" || true
cp -r /var/www/reset-primal/logs "$BACKUP_DIR/logs-backup" || true
echo "   ✅ Backup salvo em: $BACKUP_DIR"

# ════════════════════════════════════════════════════════════════
# 4. REVERTER GIT
# ════════════════════════════════════════════════════════════════
echo "4. Revertendo Git..."
cd /Users/acacioamaro/Projects/reset-primal
git status

echo ""
echo "Qual commit deseja reverter para?"
echo "1. HEAD (último commit)"
echo "2. HEAD~1 (2 commits atrás)"
echo "3. HEAD~2 (3 commits atrás)"
echo "Digite o número (padrão: 1):"
read -r CHOICE

case $CHOICE in
    2) git reset --hard HEAD~1 ;;
    3) git reset --hard HEAD~2 ;;
    *) git reset --hard HEAD ;;
esac

echo "   ✅ Git revertido"

# ════════════════════════════════════════════════════════════════
# 5. REINSTALAR DEPENDÊNCIAS
# ════════════════════════════════════════════════════════════════
echo "5. Reinstalando dependências..."
cd /var/www/reset-primal/api
npm install --production
echo "   ✅ Dependências instaladas"

# ════════════════════════════════════════════════════════════════
# 6. REINICIAR APLICAÇÃO
# ════════════════════════════════════════════════════════════════
echo "6. Reiniciando aplicação..."
pm2 start ecosystem.config.js || true
echo "   ✅ Aplicação reiniciada"

# ════════════════════════════════════════════════════════════════
# 7. REINICIAR NGINX
# ════════════════════════════════════════════════════════════════
echo "7. Reiniciando Nginx..."
sudo systemctl start nginx || true
echo "   ✅ Nginx reiniciado"

# ════════════════════════════════════════════════════════════════
# 8. VERIFICAR STATUS
# ════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════"
echo "Verificando status..."
echo ""

echo "PM2 Status:"
pm2 status | head -5 || echo "PM2 não rodando"

echo ""
echo "Nginx Status:"
sudo systemctl status nginx | grep Active || echo "Nginx não rodando"

echo ""
echo "════════════════════════════════════"
echo "✅ ROLLBACK COMPLETO"
echo ""
echo "O sistema foi revertido para o estado anterior."
echo "Backup salvo em: $BACKUP_DIR"
echo ""
echo "Próximos passos:"
echo "1. Verificar logs: pm2 logs"
echo "2. Testar: curl https://resetprimal.com.br"
echo "3. Investigar causa do problema"
echo "4. Contactar DevOps/Backend para diagnóstico"
