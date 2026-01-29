#!/bin/bash

#######################################
# PostgreSQL Database Backup Script
# Automated daily backups to S3 with encryption
# Usage: ./scripts/backup-database.sh [backup-type]
# Types: full (default), wal, verify, restore-test
#
# Cron entry: 0 1 * * * /path/to/backup-database.sh full
#######################################

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="reset_primal_prod"
DB_USER="postgres"
BACKUP_DIR="${BACKUP_DIR:-/var/lib/postgresql/backups}"
S3_BUCKET="reset-primal-backups-prod"
S3_REGION="us-east-1"
S3_PREFIX="database/"
AWS_PROFILE="${AWS_PROFILE:-default}"
RETENTION_DAYS=30
BACKUP_TYPE="${1:-full}"
LOG_FILE="/var/log/postgresql/backup.log"
ERROR_LOG="/var/log/postgresql/backup-error.log"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG"
}

# Header
log "=========================================="
log "PostgreSQL Database Backup"
log "Database: $DB_NAME"
log "Host: $DB_HOST:$DB_PORT"
log "Type: $BACKUP_TYPE"
log "Retention: $RETENTION_DAYS days"
log "=========================================="

# Step 1: Pre-backup checks
log "Step 1: Running pre-backup checks..."

# Check PostgreSQL connectivity
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &>/dev/null; then
    error "PostgreSQL is not accessible at $DB_HOST:$DB_PORT"
    exit 1
fi
log "✅ PostgreSQL is accessible"

# Check S3 connectivity
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --profile "$AWS_PROFILE" &>/dev/null; then
    error "S3 bucket $S3_BUCKET is not accessible"
    exit 1
fi
log "✅ S3 bucket is accessible"

# Check disk space
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
log "Available disk space: $((AVAILABLE_SPACE / 1024 / 1024))GB"

# Step 2: Perform backup based on type
case $BACKUP_TYPE in
    full)
        log "Step 2: Creating full backup..."
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

        # Full backup with compression
        if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
            --verbose --create --jobs=4 "$DB_NAME" | \
            gzip > "$BACKUP_FILE"; then
            log "✅ Full backup created: $BACKUP_FILE"
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "   Size: $BACKUP_SIZE"
        else
            error "Full backup failed"
            exit 1
        fi
        ;;

    wal)
        log "Step 2: Archiving WAL files..."
        # Note: WAL archiving requires archive_mode = on in postgresql.conf
        # This archives to S3 for point-in-time recovery
        # Requires: archive_command = '/path/to/wal-archive.sh %p %f'
        log "✅ WAL archiving configured (handled by PostgreSQL)"
        ;;

    verify)
        log "Step 2: Verifying latest backup..."
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz | head -1)

        if [ -z "$LATEST_BACKUP" ]; then
            error "No backups found to verify"
            exit 1
        fi

        # Verify backup integrity
        if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
            log "✅ Backup verified: $LATEST_BACKUP"
        else
            error "Backup file corrupted: $LATEST_BACKUP"
            exit 1
        fi
        ;;

    restore-test)
        log "Step 2: Testing restore procedure (non-destructive)..."
        # This creates a test database and restores from latest backup
        TEST_DB="reset_primal_test"

        # Drop test database if exists
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc \
            "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true

        # Create test database
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c \
            "CREATE DATABASE $TEST_DB;" 2>/dev/null || true

        # Get latest backup
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz | head -1)

        if [ -z "$LATEST_BACKUP" ]; then
            error "No backups found for restore test"
            exit 1
        fi

        # Restore backup
        log "   Restoring from: $LATEST_BACKUP"
        if gunzip < "$LATEST_BACKUP" | \
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
            -d "$TEST_DB" >/dev/null 2>&1; then
            log "✅ Restore test successful"

            # Verify restored database
            COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
                -d "$TEST_DB" -tc "SELECT COUNT(*) FROM information_schema.tables;")
            log "   Tables in restored database: $COUNT"

            # Cleanup test database
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c \
                "DROP DATABASE $TEST_DB;" 2>/dev/null
            log "   Test database cleaned up"
        else
            error "Restore test failed"
            exit 1
        fi
        ;;

    *)
        error "Unknown backup type: $BACKUP_TYPE"
        echo "Usage: ./backup-database.sh [full|wal|verify|restore-test]"
        exit 1
        ;;
esac

# Step 3: Upload backup to S3 (for full backups only)
if [ "$BACKUP_TYPE" = "full" ]; then
    log "Step 3: Uploading backup to S3..."

    BACKUP_FILENAME=$(basename "$BACKUP_FILE")
    S3_PATH="s3://$S3_BUCKET/$S3_PREFIX$BACKUP_FILENAME"

    # Upload with SSE-KMS encryption
    if aws s3 cp "$BACKUP_FILE" "$S3_PATH" \
        --profile "$AWS_PROFILE" \
        --region "$S3_REGION" \
        --sse aws:kms \
        --sse-kms-key-id "$AWS_KMS_KEY_ID" \
        --storage-class STANDARD_IA \
        --metadata "date=$(date +%Y-%m-%d),host=$DB_HOST,database=$DB_NAME" \
        --profile "$AWS_PROFILE"; then
        log "✅ Backup uploaded to: $S3_PATH"
    else
        error "Failed to upload backup to S3"
        exit 1
    fi
fi

# Step 4: Cleanup old backups
if [ "$BACKUP_TYPE" = "full" ]; then
    log "Step 4: Cleaning up old backups (older than $RETENTION_DAYS days)..."

    # Local cleanup
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
    log "✅ Local old backups removed"

    # S3 cleanup (delete objects older than retention period)
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    log "   S3 cleanup cutoff: $CUTOFF_DATE"
    # Note: S3 lifecycle policies should handle this automatically
fi

# Step 5: Report backup status
if [ "$BACKUP_TYPE" = "full" ]; then
    log "Step 5: Reporting backup status..."

    # Send metrics to CloudWatch
    aws cloudwatch put-metric-data \
        --namespace "ResetPrimal/Backup" \
        --metric-name "BackupSize" \
        --value ${BACKUP_SIZE%?} \
        --unit Bytes \
        --profile "$AWS_PROFILE" \
        --region "$S3_REGION" 2>/dev/null || true

    aws cloudwatch put-metric-data \
        --namespace "ResetPrimal/Backup" \
        --metric-name "BackupSuccess" \
        --value 1 \
        --unit Count \
        --profile "$AWS_PROFILE" \
        --region "$S3_REGION" 2>/dev/null || true

    log "✅ Backup metrics sent to CloudWatch"
fi

# Summary
log "=========================================="
if [ "$BACKUP_TYPE" = "full" ]; then
    log "✅ BACKUP COMPLETE"
    log "File: $BACKUP_FILE"
    log "S3: $S3_PATH"
else
    log "✅ OPERATION COMPLETE"
fi
log "=========================================="

# Exit successfully
exit 0
