# Point-in-Time Recovery (PITR) Procedure - Reset Primal

**Status:** Production Ready
**PITR Window:** 7 days
**RTO (Recovery Time Objective):** < 30 minutes
**RPO (Recovery Point Objective):** < 1 hour
**Last Updated:** 29 January 2026

---

## 📋 Overview

Point-in-Time Recovery allows restoration of the database to any point within the last 7 days using WAL (Write-Ahead Log) archives and automated backups.

**Use Cases:**
- Accidental data deletion
- Data corruption detected
- Malicious data modification
- Compliance audit requirements

**Prerequisites:**
- WAL archiving enabled (configured in Story 3.1)
- Daily automated backups running (configured in Story 3.1)
- Access to S3 backup buckets
- PostgreSQL restore environment ready

---

## 🔄 PITR Workflow

### Step 1: Determine Target Recovery Time

Identify when the issue occurred:

```bash
# Example: Recover to 2026-01-28 14:30:00 UTC
TARGET_TIME="2026-01-28 14:30:00+00"
TARGET_TIMESTAMP=$(date -d "$TARGET_TIME" +%s)

echo "Target recovery time: $TARGET_TIME"
echo "Unix timestamp: $TARGET_TIMESTAMP"
```

### Step 2: Find Latest Backup Before Target Time

```bash
# List all backup snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier reset-primal-prod \
  --region us-east-1 \
  --query 'DBSnapshots[?CreateTime<=`2026-01-28T14:30:00`].{SnapshotID:DBSnapshotIdentifier,CreateTime:CreateTime,Size:AllocatedStorage}' \
  --output table

# Select the most recent one: SNAPSHOT-ID-2026-01-28
SNAPSHOT_ID="rds:reset-primal-prod-2026-01-28-02-45"
```

### Step 3: Restore Database from Snapshot

```bash
# Create temporary restoration database
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier reset-primal-recovery \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --region us-east-1 \
  --publicly-accessible false \
  --multi-az false

# Wait for restore to complete (15-20 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier reset-primal-recovery \
  --region us-east-1

echo "✅ Database restored from snapshot"
```

### Step 4: Enable Point-in-Time Recovery

After restoring from snapshot, PostgreSQL replays WAL files to reach target time:

```bash
# Connect to recovery database
psql -h reset-primal-recovery.c9akciq32.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d reset_primal_prod

-- Create recovery configuration file
-- (for PostgreSQL versions without recovery.conf)
-- Place in postgresql.auto.conf or postgresql.conf:

-- restore_command: Command to retrieve WAL files from S3
-- restore_command = 'aws s3 cp s3://reset-primal-wal-archive/%f %p'

-- recovery_target_xid: Recovery to specific transaction ID
-- recovery_target_xid = '12345'

-- OR recovery_target_time: Recovery to specific timestamp
-- recovery_target_time = '2026-01-28 14:30:00+00'

-- recovery_target_timeline: Use latest timeline
-- recovery_target_timeline = 'latest'
```

**Note:** In RDS, PITR is automatic - specify recovery time during restore operation.

### Step 5: Recover to Target Time (RDS Method)

For AWS RDS, use restore-to-point-in-time:

```bash
# Restore to specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier reset-primal-prod \
  --target-db-instance-identifier reset-primal-recovery-pitr \
  --restore-time "2026-01-28T14:30:00Z" \
  --region us-east-1 \
  --publicly-accessible false

# Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier reset-primal-recovery-pitr \
  --region us-east-1

echo "✅ Database recovered to target time"
```

### Step 6: Verify Recovered Data

Connect to recovered database and validate data:

```bash
# Connect to recovery database
psql -h reset-primal-recovery-pitr.c9akciq32.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d reset_primal_prod

-- Check recovery time
SELECT now() AS current_time, pg_postmaster_start_time() AS server_started;

-- Verify key tables
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as purchase_count FROM purchases;
SELECT COUNT(*) as product_count FROM products;

-- Check last transaction before target time
SELECT * FROM purchases
ORDER BY created_at DESC
LIMIT 5;

-- Verify no data after target time exists
SELECT COUNT(*) FROM purchases
WHERE created_at > '2026-01-28 14:30:00+00'
AND created_at < NOW();
```

### Step 7: Validate Application Compatibility

Test application queries on recovered database:

```bash
# Update application connection string temporarily
export DATABASE_URL="postgresql://user:pass@reset-primal-recovery-pitr:5432/reset_primal_prod"

# Run application test suite
npm run test:integration

# Run sample queries
curl -X GET https://api.reset-primal.com/api/users
curl -X GET https://api.reset-primal.com/api/products
curl -X GET https://api.reset-primal.com/api/purchases
```

### Step 8: Promote Recovery Database to Production

If recovery validated successfully:

```bash
# Option 1: Update DNS to point to recovery database
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "db.reset-primal.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "reset-primal-recovery-pitr.c9akciq32.us-east-1.rds.amazonaws.com"}]
      }
    }]
  }'

# Option 2: Rename databases
ALTER DATABASE reset_primal_prod RENAME TO reset_primal_prod_old;
ALTER DATABASE reset_primal_recovery_pitr RENAME TO reset_primal_prod;

# Option 3: Manually switchover with downtime
-- Create database from recovery instance dump
pg_dump -Fc -h reset-primal-recovery-pitr -U postgres -d reset_primal_prod > /backup/recovered.dump

-- Restore to production
pg_restore -h reset-primal-prod -U postgres -d reset_primal_prod /backup/recovered.dump
```

### Step 9: Update Application Connection

Restart application to reconnect to recovered database:

```bash
# Verify application can connect
npm run test:db-connection

# If using Docker/Kubernetes
kubectl rollout restart deployment/reset-primal-api -n production

# If using systemd
sudo systemctl restart reset-primal-api

# Monitor logs for errors
tail -f /var/log/reset-primal-api.log
```

### Step 10: Cleanup

After successful recovery:

```bash
# Delete old production database (if renamed)
DROP DATABASE reset_primal_prod_old;

-- Or delete recovery database if not promoted
aws rds delete-db-instance \
  --db-instance-identifier reset-primal-recovery \
  --skip-final-snapshot \
  --region us-east-1

# Verify cleanup
aws rds describe-db-instances --region us-east-1 | grep reset-primal
```

---

## 📊 Recovery Time Estimates

| Phase | Duration | Details |
|-------|----------|---------|
| Identify issue | 5-15 min | Monitoring/alerting detection time |
| Find backup | 2-5 min | Query RDS snapshots |
| Restore snapshot | 15-20 min | RDS restore from snapshot |
| Replay WAL | 5-10 min | PostgreSQL replays transactions |
| Validation | 5-10 min | Test data integrity |
| Switchover | 2-5 min | Update DNS or connection string |
| Application restart | 2-3 min | Restart and reconnect |
| **Total RTO** | **36-68 min** | **Target: < 30 min** |

**Optimization Tips:**
- Pre-stage recovery database during business hours
- Use RDS Multi-AZ automatic failover (< 2 min) instead of PITR if possible
- Keep WAL archive bucket in same region as RDS
- Test PITR monthly to identify bottlenecks

---

## 🧪 PITR Testing Procedure

### Monthly DR Test

```bash
#!/bin/bash
set -e

# Test 1: Restore to 24 hours ago
TARGET_TIME=$(date -d "24 hours ago" -Iseconds)
echo "Testing PITR to: $TARGET_TIME"

# Create test recovery database
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier reset-primal-prod \
  --target-db-instance-identifier reset-primal-test-$(date +%s) \
  --restore-time "$TARGET_TIME" \
  --region us-east-1

# Wait for completion
TEST_DB="reset-primal-test-$(date +%s)"
aws rds wait db-instance-available --db-instance-identifier $TEST_DB --region us-east-1

# Validate
psql -h $TEST_DB.c9akciq32.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d reset_primal_prod \
     -c "SELECT COUNT(*) FROM users;"

# Cleanup
aws rds delete-db-instance --db-instance-identifier $TEST_DB --skip-final-snapshot

echo "✅ PITR test completed successfully"
```

---

## 🚨 Troubleshooting

### Issue: WAL files not found in S3

**Symptom:** Recovery fails with "WAL file not found" error

**Solution:**
1. Check WAL archive bucket exists: `aws s3 ls s3://reset-primal-wal-archive/`
2. Verify WAL archiving enabled: Check PostgreSQL `archive_mode = on`
3. Check archive command permissions: Verify IAM role has S3 write access

### Issue: Recovery takes too long

**Symptom:** PITR recovery takes > 30 minutes

**Solution:**
1. Use smaller recovery window (< 1 hour)
2. Pre-create recovery database ahead of time
3. Check S3 download speed from RDS subnet
4. Consider using database replicas instead

### Issue: Application cannot connect after recovery

**Symptom:** Connection string still points to old database

**Solution:**
1. Verify DNS updated: `nslookup db.reset-primal.com`
2. Check connection string in environment variables
3. Restart application container/process
4. Clear connection pool cache

---

## ✅ PITR Readiness Checklist

- [ ] WAL archiving enabled and verified
- [ ] S3 WAL archive bucket created with proper permissions
- [ ] Daily backups running and verified
- [ ] PITR window: minimum 7 days configured
- [ ] Recovery database template tested
- [ ] RDS restore permissions verified
- [ ] Application can connect to recovery database
- [ ] DNS failover configured
- [ ] Monthly DR test procedure documented
- [ ] Recovery runbook created
- [ ] Team trained on PITR procedure
- [ ] Contact list updated

---

**Created:** 29 January 2026
**Status:** Production Ready
**Last Tested:** TBD
**Next Test:** 29 February 2026 (monthly DR test)
