#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Reset Primal - Production Deployment Script
# ════════════════════════════════════════════════════════════════
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e  # Exit on error

# ════════════════════════════════════════════════════════════════
# Configuration
# ════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups/db_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════
# Helper Functions
# ════════════════════════════════════════════════════════════════

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check Docker
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
  fi

  # Check Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
  fi

  # Check .env file
  if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
    log_error ".env.production file not found"
    log_info "Copy .env.production.example to .env.production and fill in values"
    exit 1
  fi

  log_info "All prerequisites met ✓"
}

backup_database() {
  log_info "Backing up database..."

  mkdir -p "$BACKUP_DIR"

  # Get DB credentials from .env
  source "$PROJECT_ROOT/.env.production"

  # Extract host, port, user, password, db from DATABASE_URL
  # Format: postgresql://user:password@host:port/database
  DB_URL="${DATABASE_URL}"
  DB_USER=$(echo "$DB_URL" | grep -oP '(?<=//).*?(?=:)' || echo "")
  DB_PASSWORD=$(echo "$DB_URL" | grep -oP '(?<=:).*?(?=@)' || echo "")
  DB_HOST=$(echo "$DB_URL" | grep -oP '(?<=@).*?(?=:)' || echo "localhost")
  DB_PORT=$(echo "$DB_URL" | grep -oP '(?<=:)\d+(?=/)' || echo "5432")
  DB_NAME=$(echo "$DB_URL" | grep -oP '(?<=/)[^?]*' | head -1 || echo "reset_primal")

  if command -v pg_dump &> /dev/null; then
    PGPASSWORD="$DB_PASSWORD" pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -F c > "$BACKUP_DIR/backup.dump"

    log_info "Database backed up to $BACKUP_DIR/backup.dump"
  else
    log_warn "pg_dump not found, skipping backup"
  fi
}

stop_containers() {
  log_info "Stopping containers..."
  cd "$PROJECT_ROOT"
  docker-compose -f docker-compose.production.yml down || true
  log_info "Containers stopped"
}

build_images() {
  log_info "Building Docker images..."
  cd "$PROJECT_ROOT"
  docker-compose -f docker-compose.production.yml build --no-cache
  log_info "Docker images built ✓"
}

migrate_database() {
  log_info "Running database migrations..."
  cd "$PROJECT_ROOT"
  docker-compose -f docker-compose.production.yml run --rm backend npx prisma migrate deploy
  log_info "Database migrations completed ✓"
}

seed_database() {
  log_warn "Skipping database seed (only for development)"
}

start_containers() {
  log_info "Starting containers..."
  cd "$PROJECT_ROOT"
  docker-compose -f docker-compose.production.yml up -d
  log_info "Containers started"
}

health_check() {
  log_info "Running health checks..."

  # Wait for services to start
  sleep 10

  # Check backend health
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log_info "Backend health check passed ✓"
  else
    log_error "Backend health check failed"
    return 1
  fi

  # Check database
  if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U reset_primal_user > /dev/null 2>&1; then
    log_info "Database health check passed ✓"
  else
    log_error "Database health check failed"
    return 1
  fi

  log_info "All health checks passed ✓"
}

show_summary() {
  log_info "════════════════════════════════════════════════════════════════"
  log_info "Deployment Summary"
  log_info "════════════════════════════════════════════════════════════════"
  log_info "Environment: $ENVIRONMENT"
  log_info "Timestamp: $TIMESTAMP"
  log_info "Backup: $BACKUP_DIR"
  log_info ""
  log_info "Services:"
  docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps
  log_info ""
  log_info "Logs: docker-compose -f docker-compose.production.yml logs -f"
  log_info "════════════════════════════════════════════════════════════════"
}

# ════════════════════════════════════════════════════════════════
# Main Deployment Flow
# ════════════════════════════════════════════════════════════════

main() {
  log_info "Starting deployment for $ENVIRONMENT environment..."
  log_info ""

  check_prerequisites
  backup_database
  stop_containers
  build_images
  start_containers
  sleep 10  # Wait for DB to be ready
  migrate_database
  health_check
  show_summary

  log_info ""
  log_info "${GREEN}✓ Deployment completed successfully!${NC}"
}

# Run main function
main "$@"
