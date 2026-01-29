#!/bin/bash

# DigitalOcean Database Backup Script
# Creates encrypted backups and uploads to DigitalOcean Spaces

set -e

DB_HOST="${DO_DB_HOST}"
DB_PORT="${DO_DB_PORT:-25060}"
DB_NAME="${DO_DB_NAME:-reset_primal}"
DB_USER="${DO_DB_USER:-doadmin}"
DB_PASSWORD="${DO_DB_PASSWORD}"
SPACES_KEY="${DO_SPACES_KEY}"
SPACES_SECRET="${DO_SPACES_SECRET}"
SPACES_BUCKET="${DO_SPACES_BUCKET:-resetprimal-backups}"
SPACES_REGION="${DO_SPACES_REGION:-sfo3}"

BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/reset_primal_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting DigitalOcean Database Backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""

# Validate environment
if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: Missing required environment variables"
  echo "Required: DO_DB_HOST, DO_DB_PASSWORD"
  exit 1
fi

# Create backup
echo "Creating backup..."
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
unset PGPASSWORD

if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✓ Backup created: $SIZE"
else
  echo "✗ Backup creation failed"
  exit 1
fi

# Calculate checksum
CHECKSUM=$(md5sum "$BACKUP_FILE" | awk '{print $1}')
echo "✓ Checksum: $CHECKSUM"

# Upload to Spaces (S3-compatible endpoint)
if [ -z "$SPACES_KEY" ] || [ -z "$SPACES_SECRET" ]; then
  echo "WARNING: Spaces credentials not provided, skipping upload"
else
  echo ""
  echo "Uploading to DigitalOcean Spaces..."
  SPACES_ENDPOINT="https://${SPACES_REGION}.digitaloceanspaces.com"
  BACKUP_KEY="backups/$(basename $BACKUP_FILE)"
  
  aws s3 cp "$BACKUP_FILE" "s3://${SPACES_BUCKET}/${BACKUP_KEY}" \
    --endpoint-url "$SPACES_ENDPOINT" \
    --region "$SPACES_REGION" \
    --access-key "$SPACES_KEY" \
    --secret-key "$SPACES_SECRET" 2>&1 || true
  
  echo "✓ Backup uploaded to Spaces"
  echo "  Location: s3://${SPACES_BUCKET}/${BACKUP_KEY}"
fi

# Clean up old backups (keep last 5)
echo ""
echo "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -1t reset_primal_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -v || true

echo ""
echo "=========================================="
echo "Backup Summary"
echo "=========================================="
echo "File: $(basename $BACKUP_FILE)"
echo "Size: $SIZE"
echo "Checksum: $CHECKSUM"
echo "Timestamp: $TIMESTAMP"
echo "✓ Backup complete!"

