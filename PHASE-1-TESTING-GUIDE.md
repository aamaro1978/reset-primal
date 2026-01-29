# 🧪 PHASE 1 - Testing Guide (DigitalOcean Adaptation)

**Purpose:** Validate all Phase 1 components before moving to Phase 2  
**Duration:** 30-45 minutes  
**Status:** Ready to execute

---

## ✅ PRE-TEST CHECKLIST

Before running tests, verify you have:

- [ ] DigitalOcean API Token configured
- [ ] DO Database credentials ready
- [ ] DO Spaces bucket created (`resetprimal-backups`)
- [ ] SendGrid API Key configured
- [ ] Email address for alerts
- [ ] PostgreSQL client (psql) installed
- [ ] AWS CLI installed (for Spaces upload)
- [ ] Node.js installed

---

## 📋 TEST PLAN

### Test Group 1: Database Connection
- [ ] Test direct connection to DO Managed DB
- [ ] Verify SSL/TLS connectivity
- [ ] Check database version

### Test Group 2: RBAC Setup
- [ ] Verify app role created
- [ ] Verify reporting role created
- [ ] Test role permissions
- [ ] Verify connection limits

### Test Group 3: Audit Logging
- [ ] Create test record
- [ ] Verify audit log entry
- [ ] Check JSONB fields

### Test Group 4: Backup
- [ ] Execute backup script
- [ ] Verify backup file created
- [ ] Test Spaces upload
- [ ] Verify checksum

### Test Group 5: Alerting
- [ ] Test SendGrid configuration
- [ ] Send test alert email
- [ ] Verify email received

### Test Group 6: Monitoring
- [ ] Test metric publishing
- [ ] Verify metric collection
- [ ] Check health endpoints

---

## 🔧 TEST 1: Database Connection

### 1.1 Direct Connection
```bash
# Set environment variables first
export DO_DB_HOST="your-db-host.db.ondigitalocean.com"
export DO_DB_PORT="25060"
export DO_DB_NAME="reset_primal"
export DO_DB_USER="doadmin"
export DO_DB_PASSWORD="your-password"

# Test connection
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c "SELECT version();"

# Expected output:
# PostgreSQL 15.x on ...
```

### 1.2 SSL/TLS Verification
```bash
# Force SSL connection
PGSSLMODE=require psql \
  -h $DO_DB_HOST \
  -p $DO_DB_PORT \
  -U $DO_DB_USER \
  -d $DO_DB_NAME \
  -c "SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();"

# Expected output:
# t (true)
```

### 1.3 Connection Pool Test
```bash
# Check current connections
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c \
  "SELECT datname, count(*) as connections FROM pg_stat_activity GROUP BY datname;"

# Expected: Should show reset_primal with 1 connection
```

---

## 🔧 TEST 2: RBAC Setup

### 2.1 Run Setup Script
```bash
# Execute the DO setup script
bash scripts/do-setup-postgres.sh

# Expected output should include:
# ✓ Environment variables validated
# ✓ Database connection successful
# ✓ RBAC roles created
# ✓ Audit logging enabled
# ✓ Application tables created
```

### 2.2 Verify Roles Created
```bash
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c "\du"

# Expected output should show:
# reset_primal_app          | Create role
# reset_primal_reporting    | Create role
# doadmin                   | Superuser
```

### 2.3 Test App Role Permissions
```bash
# Try to create table as app role (should fail)
PGPASSWORD="$DO_DB_APP_PASSWORD" psql \
  -h $DO_DB_HOST \
  -p $DO_DB_PORT \
  -U reset_primal_app \
  -d $DO_DB_NAME \
  -c "CREATE TABLE test (id INT);"

# Expected: ERROR: permission denied for schema public
```

### 2.4 Test Select Permission
```bash
# Select should work
PGPASSWORD="$DO_DB_APP_PASSWORD" psql \
  -h $DO_DB_HOST \
  -p $DO_DB_PORT \
  -U reset_primal_app \
  -d $DO_DB_NAME \
  -c "SELECT COUNT(*) FROM users;"

# Expected: 0 (table exists but is empty)
```

---

## 🔧 TEST 3: Audit Logging

### 3.1 Insert Test Record
```bash
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME << SQL
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');
SQL

# Expected: INSERT 0 1
```

### 3.2 Check Audit Log
```bash
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME << SQL
SELECT 
  table_name, 
  operation, 
  user_name, 
  new_values::text as data
FROM audit_logs 
WHERE table_name = 'users' 
ORDER BY timestamp DESC 
LIMIT 1;
SQL

# Expected: Should show INSERT with new_values as JSON
```

### 3.3 Update and Verify
```bash
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME << SQL
UPDATE users SET name = 'Updated User' WHERE email = 'test@example.com';

SELECT 
  operation, 
  old_values->>'name' as old_name,
  new_values->>'name' as new_name
FROM audit_logs 
WHERE table_name = 'users' 
ORDER BY timestamp DESC 
LIMIT 1;
SQL

# Expected: Should show UPDATE with old and new values
```

---

## 🔧 TEST 4: Backup to Spaces

### 4.1 Configure Spaces Access
```bash
# Set Spaces credentials
export DO_SPACES_KEY="your-spaces-key"
export DO_SPACES_SECRET="your-spaces-secret"
export DO_SPACES_BUCKET="resetprimal-backups"
export DO_SPACES_REGION="sfo3"
```

### 4.2 Run Backup Script
```bash
bash scripts/do-backup-database.sh

# Expected output:
# Starting DigitalOcean Database Backup...
# ✓ Backup created: XXX MB
# ✓ Checksum: abc123...
# ✓ Backup uploaded to Spaces
#   Location: s3://resetprimal-backups/backups/reset_primal_YYYY-MM-DD_HH-MM-SS.sql.gz
```

### 4.3 Verify Backup in Spaces
```bash
# List backups in Spaces
aws s3 ls s3://resetprimal-backups/backups/ \
  --endpoint-url https://sfo3.digitaloceanspaces.com \
  --region sfo3

# Expected: Should show backup files
```

### 4.4 Test Backup File Integrity
```bash
# Check file size and format
gunzip -t /tmp/backups/reset_primal_*.sql.gz

# Expected: Should verify gzip integrity (exit 0)
```

---

## 🔧 TEST 5: AlertING

### 5.1 Test SendGrid Configuration
```bash
# Create test script
cat > /tmp/test-alert.js << 'TESTJS'
const alerting = require('/Users/acacioamaro/Projects/reset-primal/config/do-alerting.js');

// Validate config
console.log('Validating SendGrid config...');
const valid = alerting.validateConfiguration();
console.log('Valid:', valid);

// Test alert
console.log('\nSending test alert...');
alerting.sendAlert(
  'application',
  alerting.AlertSeverity.MEDIUM,
  'Test Alert',
  'This is a test alert from Phase 1 testing',
  { environment: 'staging', test: true }
).then(result => {
  console.log('Alert sent:', result);
  process.exit(result ? 0 : 1);
});
TESTJS

# Run test (requires Node.js and nodemailer)
node /tmp/test-alert.js
```

### 5.2 Verify Email Received
- Check email inbox for alert
- Verify email contains:
  - [ ] Subject with severity level
  - [ ] Timestamp
  - [ ] Alert description
  - [ ] Test data

### 5.3 Test Different Severity Levels
```bash
# Send HIGH severity alert
export ALERT_RECIPIENTS_HIGH="your-email@example.com"
# Then run alert test again with HIGH severity
```

---

## 🔧 TEST 6: Monitoring

### 6.1 Test Metric Publishing
```bash
# Create test script
cat > /tmp/test-metrics.js << 'TESTJS'
const monitoring = require('/Users/acacioamaro/Projects/reset-primal/config/do-monitoring.js');

console.log('Testing Monitoring Configuration...\n');

// Test metric publishing
monitoring.publishMetric('test_metric', 100, 'Count', { 
  component: 'test',
  environment: 'staging' 
}).then(result => {
  console.log('✓ Metric published:', result);
});

// Test system metrics
const sysMetrics = monitoring.getSystemMetrics();
console.log('System Metrics:', sysMetrics);

// Test database metrics
monitoring.publishDatabaseMetrics({
  cpuPercent: 45,
  memoryPercent: 60,
  connections: 15,
  queryTime: 250
}).then(() => {
  console.log('✓ Database metrics published');
  process.exit(0);
});
TESTJS

# Run test
node /tmp/test-metrics.js
```

### 6.2 Verify Metrics Collection
```bash
# For DO monitoring, check via DigitalOcean console
# Databases → Your DB → Monitoring tab
# Should show:
# - CPU usage
# - Memory usage
# - Connections
# - Query performance
```

---

## 🧪 INTEGRATION TEST

### Test Complete Workflow
```bash
#!/bin/bash
set -e

echo "Running Phase 1 Integration Test..."
echo ""

# 1. Database Connection
echo "1. Testing database connection..."
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c "SELECT 'Connection OK';" || exit 1
echo "✓ Database connected"
echo ""

# 2. RBAC Verification
echo "2. Testing RBAC roles..."
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c "\du" | grep reset_primal || exit 1
echo "✓ RBAC roles verified"
echo ""

# 3. Audit Logging
echo "3. Testing audit logging..."
psql -h $DO_DB_HOST -p $DO_DB_PORT -U $DO_DB_USER -d $DO_DB_NAME -c \
  "SELECT COUNT(*) FROM audit_logs;" || exit 1
echo "✓ Audit logging working"
echo ""

# 4. Backup
echo "4. Running backup..."
bash scripts/do-backup-database.sh || exit 1
echo "✓ Backup created"
echo ""

# 5. Monitoring
echo "5. Testing monitoring..."
node /tmp/test-metrics.js || exit 1
echo "✓ Monitoring working"
echo ""

echo "=========================================="
echo "✓ All Phase 1 tests passed!"
echo "=========================================="
```

---

## 📊 TEST RESULTS TEMPLATE

Use this to document your test results:

```
TEST EXECUTION REPORT - Phase 1
Date: [TODAY]
Environment: DigitalOcean Staging

DATABASE CONNECTION
- Direct connection: [ ] PASS [ ] FAIL
- SSL verification: [ ] PASS [ ] FAIL
- Connection pool: [ ] PASS [ ] FAIL

RBAC SETUP
- Roles created: [ ] PASS [ ] FAIL
- App permissions: [ ] PASS [ ] FAIL
- Reporting permissions: [ ] PASS [ ] FAIL

AUDIT LOGGING
- Insert tracking: [ ] PASS [ ] FAIL
- Update tracking: [ ] PASS [ ] FAIL
- Delete tracking: [ ] PASS [ ] FAIL

BACKUP
- Backup execution: [ ] PASS [ ] FAIL
- Spaces upload: [ ] PASS [ ] FAIL
- File integrity: [ ] PASS [ ] FAIL

ALERTING
- SendGrid config: [ ] PASS [ ] FAIL
- Test email sent: [ ] PASS [ ] FAIL
- Email received: [ ] PASS [ ] FAIL

MONITORING
- Metrics published: [ ] PASS [ ] FAIL
- System metrics: [ ] PASS [ ] FAIL
- Database metrics: [ ] PASS [ ] FAIL

OVERALL: [ ] ALL PASS [ ] ISSUES FOUND
```

---

## 🚨 TROUBLESHOOTING

### Connection Fails
**Error:** `psql: could not connect to server`
**Solution:**
- Verify DO_DB_HOST is correct
- Check security group allows port 25060
- Verify password is correct
- Try with explicit SSL: `PGSSLMODE=require`

### RBAC Roles Not Found
**Error:** `role does not exist`
**Solution:**
- Run `do-setup-postgres.sh` again
- Check admin credentials
- Verify script executed without errors

### Backup Upload Fails
**Error:** `Access Denied` or `The specified bucket does not exist`
**Solution:**
- Verify Spaces bucket name
- Check access keys are correct
- Verify region matches bucket location
- Test with: `aws s3 ls --endpoint-url ...`

### Alert Email Not Received
**Error:** Email not in inbox after 5 minutes
**Solution:**
- Verify SENDGRID_API_KEY is correct
- Check ALERT_RECIPIENTS_CRITICAL is set
- Check spam folder
- Verify SendGrid account has credits

### Monitoring Metrics Not Showing
**Error:** No metrics in DO console
**Solution:**
- Wait 2-5 minutes for first metrics
- Verify DIGITALOCEAN_TOKEN is correct
- Check metrics are being published (look for log output)
- Verify database is actually running

---

## ✅ COMPLETION CRITERIA

Phase 1 testing is complete when:
- [ ] All 6 test groups pass
- [ ] No critical errors
- [ ] Backup can be restored (tested in Phase 3)
- [ ] Alerts are being sent
- [ ] Metrics are being collected
- [ ] All documentation reviewed

---

## 📝 NEXT STEPS

Once Phase 1 testing passes:
1. Document any issues found
2. Review logs for warnings
3. Proceed to Phase 2: Data Migration

---

*Phase 1 Testing Guide - DigitalOcean Adaptation*  
*Last Updated: 29 January 2026*

