#!/bin/bash

# Reset Primal: Backup & Restore Testing Script
#
# Tests backup integrity and restore procedure
# Runs monthly DR test to verify recovery capability
#
# Usage:
#   ./scripts/test-backup-restore.sh verify
#   ./scripts/test-backup-restore.sh restore-test
#   ./scripts/test-backup-restore.sh pitr-test
#
# Environment Variables:
#   DATABASE_URL - Production database connection string
#   S3_BACKUP_BUCKET - S3 bucket with backups
#   AWS_REGION - AWS region (default: us-east-1)

set -e

# Configuration
BACKUP_BUCKET="${S3_BACKUP_BUCKET:-reset-primal-backups-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_NAME="${DATABASE_NAME:-reset_primal_prod}"
DATABASE_USER="${DATABASE_USER:-postgres}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

# ============================================================================
# BACKUP VERIFICATION
# ============================================================================

verify_backup() {
  log_info "=========================================="
  log_info "BACKUP VERIFICATION"
  log_info "=========================================="

  log_info "Checking latest backup in S3..."

  # Get latest backup file
  LATEST_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/database/ \
    --region $AWS_REGION \
    --recursive \
    | sort | tail -1 | awk '{print $NF}')

  if [ -z "$LATEST_BACKUP" ]; then
    log_error "No backups found in S3 bucket"
    return 1
  fi

  log_success "Found backup: $LATEST_BACKUP"

  # Get backup file size
  BACKUP_SIZE=$(aws s3 ls s3://$BACKUP_BUCKET/$LATEST_BACKUP \
    --region $AWS_REGION \
    --recursive \
    | grep -oP '\d+' | tail -1)

  log_info "Backup size: $(numfmt --to=iec-i --suffix=B --format="%.2f" $BACKUP_SIZE 2>/dev/null || echo $BACKUP_SIZE' bytes')"

  # Get backup metadata
  BACKUP_DATE=$(stat -f %Sm -t "%Y-%m-%d %H:%M:%S" <<< $LATEST_BACKUP 2>/dev/null || echo "N/A")
  log_info "Backup date: $BACKUP_DATE"

  # Verify backup integrity with gzip
  log_info "Verifying backup integrity..."

  TEMP_DIR=$(mktemp -d)
  aws s3 cp s3://$BACKUP_BUCKET/$LATEST_BACKUP $TEMP_DIR/backup.sql.gz \
    --region $AWS_REGION > /dev/null

  if gzip -t $TEMP_DIR/backup.sql.gz 2>/dev/null; then
    log_success "Backup integrity verified (gzip)"
  else
    log_error "Backup integrity check failed"
    rm -rf $TEMP_DIR
    return 1
  fi

  rm -rf $TEMP_DIR
  log_success "Backup verification completed"
  return 0
}

# ============================================================================
# RESTORE TEST
# ============================================================================

restore_test() {
  log_info "=========================================="
  log_info "RESTORE TEST"
  log_info "=========================================="

  # Create temporary test database
  TEST_DB="reset_primal_test_$(date +%s)"
  log_info "Creating test database: $TEST_DB"

  createdb -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    $TEST_DB 2>/dev/null || {
    log_error "Failed to create test database"
    return 1
  }

  log_success "Test database created: $TEST_DB"

  # Download latest backup
  log_info "Downloading latest backup from S3..."

  LATEST_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/database/ \
    --region $AWS_REGION \
    --recursive \
    | sort | tail -1 | awk '{print $NF}')

  TEMP_DIR=$(mktemp -d)
  aws s3 cp s3://$BACKUP_BUCKET/$LATEST_BACKUP $TEMP_DIR/backup.sql.gz \
    --region $AWS_REGION > /dev/null

  log_success "Backup downloaded"

  # Restore backup to test database
  log_info "Restoring backup to test database..."

  if gunzip < $TEMP_DIR/backup.sql.gz | psql -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    -d $TEST_DB > /dev/null 2>&1; then
    log_success "Restore completed"
  else
    log_error "Restore failed"
    rm -rf $TEMP_DIR
    dropdb -h $DATABASE_HOST -U $DATABASE_USER -p $DATABASE_PORT $TEST_DB 2>/dev/null
    return 1
  fi

  # Validate restored data
  log_info "Validating restored data..."

  # Check table counts
  USER_COUNT=$(psql -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    -d $TEST_DB \
    -t -c "SELECT COUNT(*) FROM users;")

  PRODUCT_COUNT=$(psql -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    -d $TEST_DB \
    -t -c "SELECT COUNT(*) FROM products;")

  PURCHASE_COUNT=$(psql -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    -d $TEST_DB \
    -t -c "SELECT COUNT(*) FROM purchases;")

  log_success "Users: $USER_COUNT"
  log_success "Products: $PRODUCT_COUNT"
  log_success "Purchases: $PURCHASE_COUNT"

  # Check foreign key integrity
  log_info "Checking foreign key integrity..."

  ORPHANED=$(psql -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    -d $TEST_DB \
    -t -c "SELECT COUNT(*) FROM purchases WHERE user_id NOT IN (SELECT id FROM users);")

  if [ "$ORPHANED" -eq 0 ]; then
    log_success "No orphaned purchase records"
  else
    log_warning "Found $ORPHANED orphaned records (may need cleanup)"
  fi

  # Cleanup
  log_info "Cleaning up test database..."
  dropdb -h $DATABASE_HOST \
    -U $DATABASE_USER \
    -p $DATABASE_PORT \
    $TEST_DB 2>/dev/null

  rm -rf $TEMP_DIR

  log_success "Restore test completed"
  return 0
}

# ============================================================================
# PITR TEST
# ============================================================================

pitr_test() {
  log_info "=========================================="
  log_info "POINT-IN-TIME RECOVERY TEST"
  log_info "=========================================="

  log_info "Checking PITR capability..."
  log_info "Note: PITR testing requires RDS with automated backups"

  # For RDS, check backup retention
  if command -v aws &> /dev/null; then
    RETENTION=$(aws rds describe-db-instances \
      --db-instance-identifier reset-primal-prod \
      --region $AWS_REGION \
      --query 'DBInstances[0].BackupRetentionPeriod' \
      --output text 2>/dev/null)

    if [ ! -z "$RETENTION" ] && [ "$RETENTION" -ge 7 ]; then
      log_success "PITR enabled with $RETENTION day retention"
      return 0
    else
      log_error "PITR not enabled or retention too short"
      return 1
    fi
  else
    log_warning "AWS CLI not installed, cannot verify PITR"
    return 0
  fi
}

# ============================================================================
# MAIN
# ============================================================================

COMMAND=${1:-"verify"}

log_info "Reset Primal Backup Testing"
log_info "Command: $COMMAND"

case $COMMAND in
  "verify")
    verify_backup
    exit $?
    ;;
  "restore-test")
    restore_test
    exit $?
    ;;
  "pitr-test")
    pitr_test
    exit $?
    ;;
  *)
    log_error "Unknown command: $COMMAND"
    echo "Usage: $0 {verify|restore-test|pitr-test}"
    exit 1
    ;;
esac
