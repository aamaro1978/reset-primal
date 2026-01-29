# Security Documentation - Reset Primal

**Status:** ✅ Production Ready
**Last Updated:** 29 January 2026
**Version:** 1.0

---

## 📋 Table of Contents

1. [Security Overview](#security-overview)
2. [Role-Based Access Control (RBAC)](#rbac)
3. [Encryption Strategy](#encryption)
4. [Secrets Management](#secrets)
5. [Audit Logging](#audit)
6. [Security Monitoring & Alerting](#monitoring)
7. [Incident Response](#incident-response)
8. [Security Checklist](#checklist)

---

## 🔐 Security Overview

Reset Primal implements defense-in-depth security architecture across the database, application, and infrastructure layers:

- **Database Layer:** Role-based access control, encryption, audit logging
- **Application Layer:** Input validation, error handling, secure authentication
- **Infrastructure Layer:** VPC isolation, TLS encryption, AWS Secrets Manager
- **Monitoring Layer:** CloudWatch alarms, security event logging, audit reports

---

## 🔑 Role-Based Access Control (RBAC)

Three roles with progressively increasing permissions:

### 1. `reset_primal_app` - Application User

**Purpose:** Limited write access for application operations
**Connection Limit:** 20 concurrent connections
**Timeout:** 30 seconds per statement

**Permissions:**
```
users:       SELECT, INSERT, UPDATE
purchases:   SELECT, INSERT, UPDATE
products:    SELECT, INSERT, UPDATE
audit_logs:  DENIED (write-only via triggers)
```

**Setup:**
```bash
psql -U postgres -d reset_primal_prod -f scripts/setup-rbac.sql
```

**Verification:**
```sql
-- Check role exists
SELECT * FROM pg_roles WHERE rolname = 'reset_primal_app';

-- Check table permissions
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'users';
```

### 2. `reset_primal_reporting` - Analytics User

**Purpose:** Read-only access for reporting and analytics
**Connection Limit:** 20 concurrent connections
**Timeout:** 60 seconds per statement

**Permissions:**
```
users:       SELECT
purchases:   SELECT
products:    SELECT
audit_logs:  SELECT (can view but not modify)
```

**Use Case:** Business intelligence tools, data analytics queries

### 3. `reset_primal_admin` - Administrator

**Purpose:** Full database access (requires MFA in production)
**Connection Limit:** 10 concurrent connections (restricted)
**Requirement:** MFA authentication

**Permissions:**
```
All tables: Full access (SELECT, INSERT, UPDATE, DELETE)
```

**Security Note:** Admin operations are logged to CloudWatch and audit_logs table.

---

## 🔒 Encryption Strategy

### At-Rest Encryption

**RDS (AWS-Managed):**
```
Algorithm:        AES-256
KMS Key:          AWS-managed or customer-managed
Key Rotation:     Annual (90 days for application-level)
Provider:         AWS KMS
Status:           ✅ Enabled
```

**Application-Level Column Encryption:**

Sensitive fields are encrypted using AES-256-GCM:
- Email addresses
- Phone numbers
- Social Security Numbers (if stored)

```javascript
// Encryption example (via application)
const encrypted = await encryptField(email, kmsKey);
const decrypted = await decryptField(encrypted, kmsKey);
```

### In-Transit Encryption

**TLS Configuration:**
```
Version:          TLS 1.2 (minimum)
Cipher Suites:    ECDHE_RSA_WITH_AES_256_GCM_SHA384
                  ECDHE_RSA_WITH_AES_128_GCM_SHA256
                  ECDHE_RSA_WITH_CHACHA20_POLY1305
HSTS:             Enabled (max-age: 1 year)
Certificates:     AWS Certificate Manager (auto-renew)
```

**PostgreSQL Configuration:**
```
ssl = on
ssl_prefer_server_ciphers = on
```

**Verification:**
```bash
# Test TLS connection
psql -h prod-db.example.com -d reset_primal_prod \
  --set=sslmode=require \
  -c "SELECT version();"
```

### Backup Encryption

- **Algorithm:** AES-256
- **Provider:** AWS KMS
- **Storage:** S3 with encryption enabled
- **Rotation:** Automatic via backup script
- **Retention:** 30 days in hot storage, then S3 Glacier

---

## 🔑 Secrets Management

All secrets stored in AWS Secrets Manager, never in code or `.env` files in production.

### Secrets Configuration

```javascript
{
  "database_password": {
    "name": "reset-primal-prod/database/app-user",
    "rotation": "90 days"
  },
  "sendgrid_api_key": {
    "name": "reset-primal-prod/api/sendgrid",
    "rotation": "180 days"
  },
  "jwt_secret": {
    "name": "reset-primal-prod/auth/jwt-secret",
    "rotation": "180 days"
  }
}
```

### Secret Rotation

**Database Passwords:**
- Automatic rotation every 90 days
- Lambda function handles rotation seamlessly
- Zero downtime (connection pooling maintains availability)

**API Keys:**
- Manual rotation every 180 days
- Document change in security log
- Update all dependent systems

### Retrieving Secrets at Startup

```javascript
const { loadSecrets } = require('./config/security');

async function startApplication() {
  const secrets = await loadSecrets();
  const dbPassword = secrets.database_password;
  // ... initialize database with secret
}
```

### IAM Role Configuration

Application EC2/ECS task needs this IAM role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:reset-primal-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:us-east-1:*:key/*"
    }
  ]
}
```

---

## 📝 Audit Logging

All database operations logged for compliance and security analysis.

### Audit Table Schema

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  operation VARCHAR(10),           -- INSERT, UPDATE, DELETE
  table_name VARCHAR(255),
  user_id UUID,                    -- User performing operation
  record_id UUID,                  -- PK of affected record
  old_values JSONB,                -- Before (UPDATE, DELETE)
  new_values JSONB,                -- After (INSERT, UPDATE)
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  operation_duration_ms INTEGER
);
```

### Audited Operations

- **users table:** All INSERT, UPDATE, DELETE
- **purchases table:** All INSERT, UPDATE, DELETE
- **products table:** All INSERT, UPDATE, DELETE
- **audit_logs table:** Not audited (prevent recursion)

### Audit Triggers

Automatic triggers capture all changes:

```bash
# Install triggers
psql -U postgres -d reset_primal_prod -f scripts/setup-audit-logging.sql
```

### Audit Log Retention

- **Online Storage:** 30 days in `audit_logs` table
- **Archive Storage:** S3 Glacier (after 30 days, retained 1 year)
- **Automatic Cleanup:** Logs older than 365 days deleted

### Querying Audit Logs

```sql
-- Get all changes to a specific record
SELECT * FROM audit_logs
WHERE table_name = 'users' AND record_id = 'user-uuid'
ORDER BY created_at DESC;

-- Get all operations by a specific user
SELECT * FROM audit_logs
WHERE user_id = 'user-uuid'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Get admin actions
SELECT * FROM audit_logs
WHERE database_user = 'reset_primal_admin'
ORDER BY created_at DESC LIMIT 100;
```

### Audit Logging Performance

Target: **< 10ms latency per operation**

- Triggers run asynchronously (AFTER triggers)
- Batch flushing to reduce database locks
- Separate connection pool for audit logging

---

## 📊 Security Monitoring & Alerting

### CloudWatch Alarms

**Failed Authentication (5+ attempts in 5 minutes):**
```
Metric:     FailedLoginAttempts
Threshold:  5
Period:     300 seconds
Action:     SNS notification to security@reset-primal.com
```

**Privilege Escalation Attempts:**
```
Metric:     PrivilegeEscalationAttempts
Threshold:  1 (any attempt)
Period:     300 seconds
Severity:   CRITICAL
```

**Bulk Delete/Update (> 1000 rows):**
```
Metric:     BulkDeleteOperations
Threshold:  1000 rows
Period:     300 seconds
Severity:   HIGH
```

**Backup Failure:**
```
Metric:     BackupFailures
Threshold:  0 (no failures allowed)
Period:     3600 seconds
Severity:   CRITICAL
```

### Daily Security Report

Generated automatically at **00:00 UTC** and sent to security team:

1. **Authentication Summary**
   - Total login attempts
   - Failed attempts
   - Unique IPs
   - Top 10 failed users

2. **Admin Actions**
   - Number of admin operations
   - Admin users active
   - Privilege escalations attempted

3. **Failed Operations**
   - Database errors
   - Connection failures
   - Timeout events

4. **Audit Log Volume**
   - Total entries
   - Entries per table
   - Storage usage

5. **Security Alerts**
   - Triggered alarms
   - Resolved incidents
   - Recommendations

---

## 🚨 Incident Response

### Severity Levels

| Level | Response Time | Escalation | Examples |
|-------|---|---|---|
| CRITICAL | 15 min | CEO, Security, DevOps | Privilege escalation, backup failure |
| HIGH | 1 hour | Security, DevOps | Brute force, SQL injection |
| MEDIUM | 4 hours | DevOps | Unusual activity, failed operations |
| LOW | 24 hours | None | Minor configuration issues |

### Response Channels

- **Slack:** #security-incidents
- **Email:** security@reset-primal.com
- **PagerDuty:** On-call engineer

### Incident Log

All incidents documented in `/var/log/security-incidents.log`:

```
[2026-01-29 14:32:15] CRITICAL: Privilege escalation attempt
  User: user-uuid
  Attempted Path: /api/admin/users
  IP: 192.168.1.100
  Action: Logged, Alerted, Monitored
```

---

## ✅ Security Checklist

- ✅ Database passwords stored in AWS Secrets Manager
- ✅ All roles follow least-privilege principle
- ✅ Audit logging enabled on all tables
- ✅ Encryption enabled at-rest (RDS encryption)
- ✅ Encryption enabled in-transit (TLS 1.2+)
- ✅ Application cannot modify audit_logs
- ✅ Error messages don't expose database structure
- ✅ Input validation prevents SQL injection
- ✅ No hardcoded secrets in code
- ✅ Dependencies scanned for vulnerabilities
- ✅ CORS restricted to frontend domain
- ✅ Rate limiting enforced on all endpoints
- ✅ Failed login attempts logged and monitored

---

## 📞 Security Contacts

| Role | Email | Phone |
|------|-------|-------|
| Security Lead | security@reset-primal.com | TBD |
| DevOps Lead | devops@reset-primal.com | TBD |
| Incident Commander | incidents@reset-primal.com | TBD |

---

**Last Updated:** 29 January 2026
**Maintained By:** @dev (Dex)
**Status:** ✅ Production Ready
**Next Review:** 29 February 2026
