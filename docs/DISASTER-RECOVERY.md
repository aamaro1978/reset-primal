# Disaster Recovery Plan - Reset Primal

**Effective Date:** 29 January 2026
**Last Tested:** [To be updated]
**RTO Target:** < 30 minutes
**RPO Target:** < 1 hour
**Status:** ✅ Production Ready

---

## 🎯 Objectives & Metrics

### Recovery Time Objective (RTO)
- **Target:** < 30 minutes to resume operations
- **Measured:** Time from incident detection to application accepting traffic

### Recovery Point Objective (RPO)
- **Target:** < 1 hour of data loss
- **Measured:** Time since last successful backup

### Point-in-Time Recovery (PITR) Window
- **Available:** 7 days
- **Enabled:** Yes (WAL archiving)
- **Tested:** Monthly

---

## 📊 Backup Strategy

### Backup Schedule
| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Full Database | Daily (01:00 UTC) | 30 days | S3 (encrypted) |
| WAL Archive | Continuous | 7 days | S3 (encrypted) |
| Transaction Logs | Real-time | 7 days | Primary DB |

### Backup Locations
- **Primary:** `s3://reset-primal-backups-prod/database/`
- **Cross-Region:** Replicate to secondary region (optional)
- **Archive:** Glacier after 30 days (optional)

### Backup Verification
```bash
# Weekly backup verification
./scripts/backup-database.sh verify

# Monthly restore test
./scripts/backup-database.sh restore-test
```

---

## 🚨 Failure Scenarios & Recovery Procedures

### Scenario 1: Single Table Corruption

**Detection:** Application reports data inconsistencies

**Recovery Steps:**
1. **Identify corruption:**
   ```bash
   psql -d reset_primal_prod -c "SELECT * FROM <table_name> LIMIT 10;"
   # Check for NULL values, invalid data types, etc.
   ```

2. **Restore single table from backup:**
   ```bash
   # Create temporary restoration database
   createdb reset_primal_recovery

   # Restore full backup
   gunzip < backup_latest.sql.gz | psql -d reset_primal_recovery

   # Export uncorrupted table
   pg_dump -t <table_name> -d reset_primal_recovery > table_backup.sql

   # Truncate corrupted table in production
   psql -d reset_primal_prod -c "TRUNCATE TABLE <table_name> CASCADE;"

   # Restore from recovery database
   psql -d reset_primal_prod < table_backup.sql

   # Cleanup
   dropdb reset_primal_recovery
   ```

3. **Verify recovery:**
   - Run application tests
   - Check data consistency
   - Monitor error logs

4. **Time Impact:** < 5 minutes (< 1 minute data loss)

---

### Scenario 2: Complete Database Failure

**Detection:** Connection refused, database unreachable, RDS instance failure

**Recovery Steps:**

#### If using RDS (Amazon-managed):
1. **Check RDS status:**
   ```bash
   aws rds describe-db-instances --db-instance-identifier reset-primal-prod
   # Status should be: available, creating, modifying, or rebooting
   ```

2. **Automatic recovery (if Multi-AZ enabled):**
   - RDS automatically fails over to standby in another AZ
   - Connection endpoint remains the same
   - Application reconnects automatically
   - **Time:** < 2 minutes
   - **Data Loss:** 0 (synchronous replication)

3. **If failover not available, restore from backup:**
   ```bash
   # Get latest backup identifier
   aws rds describe-db-snapshots --db-instance-identifier reset-primal-prod

   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier reset-primal-prod-restored \
     --db-snapshot-identifier <snapshot-id>

   # Update application connection string
   export DATABASE_HOST=reset-primal-prod-restored.cXXXXXXXXXXXX.us-east-1.rds.amazonaws.com

   # Restart application to reconnect
   systemctl restart app-service
   ```

4. **Time Impact:** 15-30 minutes
5. **Data Loss:** Up to 1 hour (since last backup at 01:00 UTC)

#### If using Self-Hosted PostgreSQL:
1. **Restore latest backup to new server:**
   ```bash
   # Download backup from S3
   aws s3 cp s3://reset-primal-backups-prod/database/backup_latest.sql.gz .

   # Create new database
   createdb reset_primal_prod

   # Restore backup
   gunzip < backup_latest.sql.gz | psql -d reset_primal_prod
   ```

2. **Verify restored database:**
   ```bash
   psql -d reset_primal_prod -c "SELECT COUNT(*) FROM users;"
   psql -d reset_primal_prod -c "SELECT COUNT(*) FROM purchases;"
   # Compare with known values
   ```

3. **Update application connection string:**
   ```bash
   export DATABASE_HOST=<new-server-ip>
   systemctl restart app-service
   ```

4. **Time Impact:** 20-30 minutes
5. **Data Loss:** Up to 1 hour

---

### Scenario 3: Point-in-Time Recovery Needed

**Detection:** Data corruption detected, need to recover to specific point in time

**Prerequisites:** WAL archiving enabled, PITR window available (7 days)

**Recovery Steps:**

1. **Determine target recovery time:**
   ```bash
   # Example: Recover to 2026-01-28 14:30:00 UTC
   TARGET_TIME="2026-01-28 14:30:00+00"
   ```

2. **Restore from backup to recovery database:**
   ```bash
   # Create recovery database
   createdb reset_primal_recovery

   # Restore full backup
   gunzip < backup_2026-01-28.sql.gz | psql -d reset_primal_recovery
   ```

3. **Restore WAL files to recovery point:**
   ```bash
   # Download WAL files from S3 between backup time and target time
   aws s3 sync s3://reset-primal-wal-archive/wal/ ./wal_recovery/ \
     --filter "Key>=2026-01-28T02-00-00*"

   # Copy to PostgreSQL recovery directory
   # PostgreSQL will replay WAL files during recovery
   ```

4. **Perform point-in-time recovery:**
   ```sql
   -- In postgresql.conf (recovery.conf for older versions):
   restore_command = 'aws s3 cp s3://reset-primal-wal-archive/wal/%f %p'
   recovery_target_timeline = 'latest'
   recovery_target_xid = '<target-xid>' -- or recovery_target_time
   ```

5. **Verify recovered data:**
   - Check recovery database for correct state
   - Verify data at target time is present
   - Verify data after target time is not present

6. **Promote recovery database to production:**
   ```bash
   # Test application against recovery database
   export DATABASE_URL=postgresql://user:pass@localhost/reset_primal_recovery
   npm run test

   # If successful, rename databases
   ALTER DATABASE reset_primal_prod RENAME TO reset_primal_old;
   ALTER DATABASE reset_primal_recovery RENAME TO reset_primal_prod;

   # Restart application
   systemctl restart app-service
   ```

7. **Time Impact:** 20-30 minutes
8. **Data Loss:** Data after target time is lost

---

### Scenario 4: Entire Region Failure (Disaster)

**Detection:** AWS region down, multiple AZ failures, DNS not resolving

**Prerequisites:**
- Cross-region backup replication enabled
- Secondary region infrastructure ready (or can be provisioned)
- DNS failover configured

**Recovery Steps:**

1. **Detect region failure:**
   ```bash
   # Check AWS Health Dashboard
   # Monitor application connectivity
   # Check CloudWatch alarms for region-wide issues
   ```

2. **Restore in secondary region:**
   ```bash
   # List available backups in secondary region
   aws s3 ls s3://reset-primal-backups-secondary/database/ \
     --region us-west-2

   # Provision PostgreSQL instance in secondary region
   aws rds create-db-instance \
     --db-instance-identifier reset-primal-prod \
     --region us-west-2 \
     --from-db-snapshot <snapshot-in-secondary-region>

   # Or restore from S3 backup
   aws rds restore-db-instance-from-s3 \
     --db-instance-identifier reset-primal-prod-secondary \
     --s3-bucket-name reset-primal-backups-secondary \
     --region us-west-2
   ```

3. **Update DNS / Load Balancer:**
   ```bash
   # Update Route53 to point to secondary region
   aws route53 change-resource-record-sets \
     --hosted-zone-id <zone-id> \
     --change-batch '{
       "Changes": [{
         "Action": "UPSERT",
         "ResourceRecordSet": {
           "Name": "prod-db.reset-primal.com",
           "Type": "CNAME",
           "TTL": 60,
           "ResourceRecords": [{
             "Value": "reset-primal-prod-secondary.us-west-2.rds.amazonaws.com"
           }]
         }
       }]
     }'
   ```

4. **Update application configuration:**
   ```bash
   export AWS_REGION=us-west-2
   export DATABASE_HOST=reset-primal-prod-secondary.us-west-2.rds.amazonaws.com

   # Restart application
   systemctl restart app-service
   ```

5. **Verify operations in secondary region:**
   - Test application functionality
   - Check data completeness
   - Monitor performance metrics

6. **Time Impact:** 30-60 minutes (depending on preparation)
7. **Data Loss:** Up to 1 hour (since last backup)

---

## 🧪 Disaster Recovery Testing

### Monthly Test Schedule

#### Test 1: Backup Verification (Week 1)
```bash
./scripts/backup-database.sh verify

# Expected result: Backup integrity confirmed
```

#### Test 2: Restore Test (Week 2)
```bash
./scripts/backup-database.sh restore-test

# Expected:
# - Test database created
# - Backup restored successfully
# - All tables present
# - Data counts match production
# - Test database cleaned up
```

#### Test 3: PITR Simulation (Week 3)
```bash
# Test point-in-time recovery to specific timestamp
# Restore to database 2 hours before current time
# Verify data at that point in time
```

#### Test 4: Application Failover (Week 4)
```bash
# Test application reconnection:
# 1. Kill database connection
# 2. Verify application detects failure
# 3. Verify application reconnects
# 4. Verify no data loss
```

### Test Documentation Template

```markdown
## DR Test - [Date]

**Test Type:** [Backup Verification / Restore / PITR / Failover]
**Start Time:** [HH:MM UTC]
**End Time:** [HH:MM UTC]
**Duration:** [X minutes]

**Results:**
- [ ] Backup integrity verified
- [ ] Restore completed successfully
- [ ] Data consistency verified
- [ ] Application connectivity tested
- [ ] No data loss confirmed

**Issues Found:** [List any]
**Fixes Applied:** [List any]
**Next Test:** [Date]
```

---

## 📋 Escalation Procedures

### Detection
1. **Automated Alerts:** CloudWatch alarms trigger
2. **Manual Monitoring:** Dashboard review shows anomalies
3. **User Reports:** Customers report service issues

### Response Levels

| Severity | RTO | Escalation | Actions |
|----------|-----|-----------|---------|
| Critical | < 15 min | Incident commander + All | Immediate failover |
| High | < 30 min | On-call team | Begin recovery |
| Medium | < 1 hour | Ops team | Monitor + Plan |
| Low | < 4 hours | Ops team | Schedule maintenance |

### Communication Plan

**During Incident:**
- Update status page every 15 minutes
- Send Slack notifications to #incidents
- Email customers if > 30 min downtime
- Update PagerDuty incident

**Post-Incident:**
- Root cause analysis within 24 hours
- Post-mortem meeting within 1 week
- Update runbooks based on learnings

---

## 👥 Team Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [TBD] | [TBD] | [TBD] |
| Database DBA | [TBD] | [TBD] | [TBD] |
| DevOps Lead | [TBD] | [TBD] | [TBD] |
| On-Call Manager | [TBD] | [TBD] | [TBD] |

---

## ✅ Checklist for Production Readiness

- [ ] Automated daily backups running successfully
- [ ] Latest backup verified (< 24 hours old)
- [ ] WAL archiving enabled and working
- [ ] PITR window available (7 days)
- [ ] Restore test completed successfully
- [ ] RTO target met (< 30 minutes)
- [ ] RPO target met (< 1 hour)
- [ ] Team trained on recovery procedures
- [ ] Runbooks up to date
- [ ] Monitoring and alerting configured
- [ ] DNS failover configured (for regional failure)
- [ ] Cross-region backups enabled (optional)
- [ ] Monthly DR tests scheduled
- [ ] Incident response team assigned

---

## 📚 Related Documents

- [DATABASE-SETUP.md](DATABASE-SETUP.md) - Database setup and configuration
- [MONITORING.md](MONITORING.md) - Monitoring and alerting (to be created in Story 3.4)
- [SECURITY.md](SECURITY.md) - Security configuration (to be created in Story 3.5)
- [PERFORMANCE.md](PERFORMANCE.md) - Performance tuning (to be created in Story 3.6)

---

## 📞 Support

For questions or updates to this plan:
1. Create GitHub issue with `[DR-PLAN]` prefix
2. Contact database team
3. Schedule monthly review meeting

---

**Last Updated:** 29 January 2026
**Next Review:** 29 February 2026
**Next DR Test:** 5 February 2026 (Week 1)
**Status:** ✅ Production Ready
