# 🚀 FASE 3 - Staging Deployment & Validation Guide

**Purpose:** Step-by-step validation of FASE 3 infrastructure on staging environment  
**Duration:** 4-6 hours  
**Status:** Ready to execute

---

## ✅ PRE-REQUISITES

Before starting staging deployment, verify:

- [ ] AWS credentials configured for staging environment
- [ ] Staging RDS cluster ready (PostgreSQL 15+)
- [ ] Staging EC2 instances available
- [ ] S3 buckets created for backups
- [ ] SNS topics accessible
- [ ] IAM roles configured with proper permissions
- [ ] VPC and security groups configured
- [ ] SSL certificates ready for TLS

---

## 📋 STAGING DEPLOYMENT CHECKLIST

### Phase 1: Database Setup (30 minutes)

**Step 1.1: Run PostgreSQL Setup Script**
```bash
cd /path/to/reset-primal
bash scripts/setup-postgres.sh --env staging

# Expected output:
# ✓ PostgreSQL 15 verified
# ✓ Database 'reset_primal_staging' created
# ✓ RBAC roles created (app, reporting, admin)
# ✓ Connection pooling configured
```

**Step 1.2: Verify Database Connection**
```bash
node scripts/test-database-connection.js --env staging

# Expected output:
# Test 1: Direct connection .......................... PASS
# Test 2: PgBouncer connection ...................... PASS
# Test 3: Latency measurement ....................... PASS (< 100ms)
# Test 4: Concurrent connections (10x) ............. PASS
# Test 5: Timeout handling .......................... PASS
# Test 6: Query execution ........................... PASS
# Test 7: Graceful shutdown ......................... PASS
#
# ✓ All 7 connection tests passed
```

**Step 1.3: Run Database Optimization**
```bash
# Connect to PostgreSQL and run optimization
psql -h staging-db.rds.amazonaws.com -U reset_primal_admin \
  -d reset_primal_staging < scripts/optimize-database.sql

# Expected: Creates 14 indexes, 2 materialized views, configures query logging
```

---

### Phase 2: Setup RBAC & Audit Logging (20 minutes)

**Step 2.1: Configure RBAC**
```bash
psql -h staging-db.rds.amazonaws.com -U reset_primal_admin \
  -d reset_primal_staging < scripts/setup-rbac.sql

# Expected output:
# CREATE ROLE reset_primal_app
# CREATE ROLE reset_primal_reporting
# CREATE ROLE reset_primal_admin
# GRANT PERMISSIONS...
```

**Step 2.2: Enable Audit Logging**
```bash
psql -h staging-db.rds.amazonaws.com -U reset_primal_admin \
  -d reset_primal_staging < scripts/setup-audit-logging.sql

# Expected: Creates audit_logs table, triggers on users/purchases/products
```

**Step 2.3: Verify Audit Logging**
```bash
# Check audit logs table exists
psql -h staging-db.rds.amazonaws.com -U reset_primal_admin \
  -d reset_primal_staging -c "SELECT * FROM audit_logs LIMIT 1;"

# Expected: Table exists with columns: id, table_name, operation, old_values, new_values, timestamp
```

---

### Phase 3: Backup & Disaster Recovery (30 minutes)

**Step 3.1: Test Backup Script**
```bash
bash scripts/backup-database.sh --env staging --bucket reset-primal-staging-backups

# Expected output:
# Starting backup: reset_primal_staging
# Backup file: reset_primal_staging_2026-01-29_14-30-00.sql.gz
# Uploading to S3...
# ✓ Backup completed successfully
# ✓ Checksum: abc123def456
# ✓ Encryption: AES-256 enabled
```

**Step 3.2: Test Backup Restoration**
```bash
bash scripts/test-backup-restore.sh --env staging

# Expected output:
# Verifying backup integrity...
# ✓ Backup file integrity: OK
#
# Testing restoration...
# ✓ Restored 21,850 records
# ✓ Row count matches: OK
# ✓ Checksum validation: OK
#
# Testing PITR capability...
# ✓ WAL files available: OK
# ✓ PITR target: 2026-01-29 12:00:00 (accessible)
```

**Step 3.3: Verify RDS Multi-AZ Failover**
```bash
# In AWS Console:
# 1. Go to RDS → Databases → reset-primal-staging
# 2. Check "Multi-AZ deployment" is enabled
# 3. Note primary and secondary AZ
# 4. Click "Actions" → "Reboot with failover"
# 5. Wait for failover to complete (2-3 minutes)
# 6. Verify connection still works after failover

# Test with script:
node scripts/failover-manager.js --env staging --verify

# Expected:
# ✓ Primary AZ: us-east-1a
# ✓ Secondary AZ: us-east-1b
# ✓ Failover detected and handled
# ✓ Connection restored automatically
```

---

### Phase 4: Configure Monitoring & Alarms (40 minutes)

**Step 4.1: Create SNS Topics**
```bash
# Create SNS topics for alerts
aws sns create-topic \
  --name reset-primal-staging-alerts \
  --region us-east-1

# Subscribe to topic (email)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:reset-primal-staging-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Expected: Confirmation email sent to your inbox
# ⚠️ ACTION REQUIRED: Confirm subscription in email
```

**Step 4.2: Create CloudWatch Dashboards**
```bash
# Upload production overview dashboard
aws cloudwatch put-dashboard \
  --dashboard-name reset-primal-staging-overview \
  --dashboard-body file://monitoring/dashboards/prod-overview.json

# Upload database performance dashboard
aws cloudwatch put-dashboard \
  --dashboard-name reset-primal-staging-db-performance \
  --dashboard-body file://monitoring/dashboards/database-performance.json

# Expected: Both dashboards created in CloudWatch console
```

**Step 4.3: Create CloudWatch Alarms**
```bash
# Load alarms from template
aws cloudwatch put-metric-alarms \
  --cli-input-json file://monitoring/alarms/database-alarms.json

# Expected alarms created:
# - reset-primal-staging-cpu-high (80% threshold)
# - reset-primal-staging-cpu-critical (95% threshold)
# - reset-primal-staging-storage-high (85%)
# - reset-primal-staging-storage-critical (95%)
# - reset-primal-staging-connections-high (150/190)
# - reset-primal-staging-replication-lag (>1 sec)
# - reset-primal-staging-query-latency (>100ms)
# - reset-primal-staging-backup-failed
# - reset-primal-staging-app-error-rate (>5%)
```

**Step 4.4: Deploy Application with Monitoring Middleware**
```bash
# Update environment variables
export CLOUDWATCH_NAMESPACE=reset-primal/staging
export LOGGING_LEVEL=info
export MONITORING_ENABLED=true

# Deploy application (with monitoring.middleware.js active)
npm run deploy:staging

# Expected: App starts with monitoring middleware
# Check logs: "Monitoring middleware initialized"
```

**Step 4.5: Verify CloudWatch Dashboard Data**
```bash
# Open CloudWatch console
# Navigate to: Dashboards → reset-primal-staging-overview
# Wait 2 minutes for metrics to start flowing

# Expected metrics visible:
# - Response Time (ms) - should show metrics
# - Request Count - should increment
# - Error Count - should be 0 or low
# - Database Latency - should show DB metrics
# - Memory Usage - should show heap usage
# - Backup Status - should show recent backup
```

---

### Phase 5: Health Checks & Kubernetes Integration (20 minutes)

**Step 5.1: Verify Health Check Endpoints**
```bash
# Test each health check endpoint
curl -i http://staging-api.example.com/health/ping
curl -i http://staging-api.example.com/health/status
curl -i http://staging-api.example.com/health/readiness
curl -i http://staging-api.example.com/health/live
curl -i http://staging-api.example.com/health/metrics

# Expected responses:
# GET /health/ping
# { "status": "alive", "uptime": 1234.567, "timestamp": "2026-01-29T..." }

# GET /health/status
# { "status": "healthy", "components": {...}, "totalResponseTimeMs": 45 }

# GET /health/readiness
# { "status": "ready", "timestamp": "2026-01-29T..." }

# GET /health/live
# { "status": "live", "timestamp": "2026-01-29T..." }

# GET /health/metrics
# { "timestamp": "2026-01-29T...", "metrics": {...} }
```

**Step 5.2: Configure Kubernetes Probes** (if using K8s)
```yaml
# In your Kubernetes deployment manifest:
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 2
```

**Step 5.3: Test Health Checks**
```bash
# Make 5 requests to each endpoint
for i in {1..5}; do
  curl http://staging-api.example.com/health/status \
    | jq '.status'
done

# Expected: All return "healthy" or appropriate status
```

---

### Phase 6: Load Testing & Performance Baseline (60 minutes)

**Step 6.1: Install k6** (if not already installed)
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Verify installation
k6 version
```

**Step 6.2: Run Baseline Load Test**
```bash
# Run load test against staging environment
k6 run scripts/load-test.js \
  --vus 10 \
  --duration 5m \
  -e STAGING_URL=http://staging-api.example.com

# Expected output:
# 
#   ✓ request_duration...........: avg=45ms, min=10ms, max=200ms, p95=120ms, p99=180ms
#   ✓ request_failed.............: 0.00%
#   ✓ request_succeeded..........: 100%
#   ✓ requests....................: 3000/s
#
# Summary:
# - Completed 15,000 requests in 5 minutes
# - 0 errors
# - Cache hit rate: 82.3%
```

**Step 6.3: Run Peak Load Test**
```bash
# Simulate peak traffic (100 concurrent users)
k6 run scripts/load-test.js \
  --vus 100 \
  --duration 10m \
  -e STAGING_URL=http://staging-api.example.com

# Expected:
# - All endpoints respond
# - p95 latency < 500ms
# - Error rate < 1%
# - Cache hit rate > 75%
```

**Step 6.4: Spike Test**
```bash
# Simulate sudden traffic spike (500 users)
k6 run scripts/load-test.js \
  --vus 500 \
  --ramp-up 30s \
  --duration 2m \
  -e STAGING_URL=http://staging-api.example.com

# Expected:
# - System handles spike without crashing
# - Recovery time < 2 minutes
# - No cascading failures
```

**Step 6.5: Analyze Performance Results**
```bash
# Check baseline metrics in CloudWatch
# 1. Go to CloudWatch → Dashboards → reset-primal-staging-db-performance
# 2. Verify:
#    - CPU usage < 60%
#    - Memory usage < 70%
#    - Query latency p95 < 100ms
#    - Connection pool utilization < 80%
#    - Cache hit rate > 80%

# Expected baseline:
# - API Response Time p95: 100ms
# - Database Query Time p95: 50ms
# - Cache Hit Rate: 82%
# - Error Rate: 0%
```

---

### Phase 7: Alert Trigger Testing (30 minutes)

**Step 7.1: Test CPU Alert**
```bash
# Simulate high CPU load
stress-ng --cpu 4 --timeout 2m &

# Watch CloudWatch for alarm
# Expected:
# 1. CPU metric rises above 80%
# 2. CPU_HIGH alarm triggered within 2 minutes
# 3. SNS notification sent
# 4. Email received with alert
# 5. Alarm status changes to "ALARM"
```

**Step 7.2: Test Storage Alert**
```bash
# Create large file to simulate storage usage
dd if=/dev/zero of=/tmp/large_file bs=1M count=5000

# Expected:
# 1. Storage metric rises above 85%
# 2. Storage alert triggered
# 3. SNS notification sent
# 4. Email received
```

**Step 7.3: Test Application Error Alert**
```bash
# Simulate application errors
curl http://staging-api.example.com/api/error

# Expected:
# 1. Error rate spike detected in CloudWatch
# 2. If error rate exceeds threshold, alert triggered
# 3. SNS notification sent
# 4. Alert contains error details
```

**Step 7.4: Test Database Connection Alert**
```bash
# Simulate high connection count
# (open 150+ concurrent connections to database)

# Expected:
# 1. Connection count rises above 150
# 2. Connection alert triggered
# 3. SNS notification sent
# 4. Alert contains connection pool status
```

---

### Phase 8: Security Validation (20 minutes)

**Step 8.1: Verify Encryption**
```bash
# Check database connection is encrypted
psql -h staging-db.rds.amazonaws.com \
  --ssl-mode require \
  -U reset_primal_admin \
  -d reset_primal_staging \
  -c "SHOW ssl;"

# Expected output: on
```

**Step 8.2: Verify RBAC**
```bash
# Test application role has limited permissions
psql -h staging-db.rds.amazonaws.com \
  -U reset_primal_app \
  -d reset_primal_staging \
  -c "DROP TABLE users;"

# Expected: ERROR: permission denied for schema public
```

**Step 8.3: Test Audit Logging**
```bash
# Insert test record
psql -h staging-db.rds.amazonaws.com \
  -U reset_primal_admin \
  -d reset_primal_staging \
  -c "INSERT INTO users (email) VALUES ('test@example.com');"

# Check audit log
psql -h staging-db.rds.amazonaws.com \
  -U reset_primal_admin \
  -d reset_primal_staging \
  -c "SELECT * FROM audit_logs WHERE table_name='users' ORDER BY timestamp DESC LIMIT 1;"

# Expected: INSERT operation logged with old_values and new_values
```

**Step 8.4: Verify Brute Force Detection**
```bash
# Make 5+ failed login attempts
for i in {1..6}; do
  psql -h staging-db.rds.amazonaws.com \
    -U reset_primal_admin \
    -d reset_primal_staging \
    --password < /dev/null 2>&1 || true
done

# Expected:
# - After 5 failures, detection alert triggered
# - Brute force metric increased in CloudWatch
```

---

## 📊 VALIDATION SUMMARY CHECKLIST

After completing all phases, verify:

### Database ✅
- [ ] PostgreSQL 15+ running
- [ ] All 14 indexes created
- [ ] 2 materialized views available
- [ ] RBAC roles configured correctly
- [ ] Audit logging active
- [ ] Backups working and tested
- [ ] PITR capabilities verified
- [ ] Failover tested and working

### Monitoring ✅
- [ ] CloudWatch dashboards showing data
- [ ] 3 dashboards visible (overview, DB, security)
- [ ] 9 alarms configured and active
- [ ] SNS topics subscribed
- [ ] Alert emails being received
- [ ] Health check endpoints responding
- [ ] Metrics flowing to CloudWatch

### Performance ✅
- [ ] API p95 latency < 100ms (normal load)
- [ ] Database p95 latency < 50ms
- [ ] Cache hit rate > 80%
- [ ] Load test baseline established
- [ ] Spike handling verified
- [ ] Connection pool < 80% utilization
- [ ] Compression working (60-70% reduction)

### Security ✅
- [ ] Encryption verified (at-rest and in-transit)
- [ ] RBAC preventing unauthorized access
- [ ] Audit logging capturing all operations
- [ ] Brute force detection working
- [ ] No hardcoded secrets found
- [ ] LGPD compliance verified

---

## 🚨 TROUBLESHOOTING

### Issue: Database connection fails
**Solution:**
```bash
# Check security group allows access
# Check RDS endpoint is correct
# Verify credentials
# Check network connectivity: ping staging-db.rds.amazonaws.com
```

### Issue: CloudWatch metrics not showing
**Solution:**
```bash
# Wait 2-5 minutes for first metrics
# Check IAM role has CloudWatch permissions
# Verify monitoring middleware is enabled
# Check CLOUDWATCH_NAMESPACE environment variable
```

### Issue: Backup fails
**Solution:**
```bash
# Check S3 bucket exists and is writable
# Verify AWS credentials have S3 permissions
# Check disk space available
# Check database is not locked
```

### Issue: Alarms not triggering
**Solution:**
```bash
# Check SNS topic exists and is subscribed
# Verify alarm threshold configuration
# Check metric is being published to CloudWatch
# Look at alarm history for failed evaluations
```

---

## ✨ NEXT STEPS

Once all validations pass:

1. **Review Results**
   - Compile validation report
   - Document baseline metrics
   - Identify any performance issues

2. **Production Preparation**
   - Copy validated configuration to production
   - Create production RDS cluster
   - Set production alarm thresholds

3. **Production Deployment** (in separate process)
   - Execute migration scripts
   - Enable production monitoring
   - Monitor for 24 hours post-deployment

---

## 📞 SUPPORT

If you encounter issues:
1. Check troubleshooting section above
2. Review logs in CloudWatch Logs
3. Check script output for error messages
4. Verify all pre-requisites are met

---

*Staging Deployment Guide for FASE 3*  
*Last Updated: 29 January 2026*

