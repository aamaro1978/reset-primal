#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Reset Primal - Database Backup Script
# ════════════════════════════════════════════════════════════════
# Usage: ./scripts/backup.sh
# For cron: 0 2 * * * /opt/reset-primal/scripts/backup.sh >> /opt/reset-primal/logs/backup.log 2>&1

set -e

BACKUP_DIR="${BACKUP_DIR:-.}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/reset_primal_$TIMESTAMP.dump"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Source environment variables
if [ -f ".env.production" ]; then
  export $(cat .env.production | grep -v '#' | xargs)
elif [ -f ".env" ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check if Docker container is running
if ! docker-compose -f docker-compose.production.yml ps postgres 2>/dev/null | grep -q "Up"; then
  log_error "PostgreSQL container is not running"
  exit 1
fi

log_info "Starting database backup..."
log_info "Backup file: $BACKUP_FILE"

# Perform backup using docker-compose
if docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U reset_primal_user -d reset_primal -F c > "$BACKUP_FILE" 2>/dev/null; then

  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log_info "✓ Backup completed successfully"
  log_info "Backup size: $BACKUP_SIZE"

  # Remove backups older than 30 days
  log_info "Cleaning old backups (>30 days)..."
  find "$BACKUP_DIR" -name "reset_primal_*.dump" -mtime +30 -delete

  # List recent backups
  log_info "Recent backups:"
  ls -lh "$BACKUP_DIR"/reset_primal_*.dump | tail -5 | awk '{print "  " $9 " (" $5 ")"}'

  exit 0
else
  log_error "Backup failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi
