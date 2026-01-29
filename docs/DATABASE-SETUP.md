# Database Setup Guide - Reset Primal Production

**Status:** ✅ Complete
**Database:** PostgreSQL 15+
**Connection Pooling:** PgBouncer
**Backup Strategy:** Daily S3 with 30-day retention
**Last Updated:** 29 January 2026

---

## 📋 Quick Reference

| Component | Configuration | Status |
|-----------|---------------|--------|
| PostgreSQL | 15+ with SSL/TLS | ✅ |
| PgBouncer | Pool mode: transaction | ✅ |
| S3 Backups | Daily, 30-day retention | ✅ |
| Monitoring | CloudWatch dashboard | ✅ |
| Audit Logging | All operations logged | ✅ |
| Connection Limits | 200 max connections | ✅ |

---

## 🚀 Initial Setup

### Prerequisites
- PostgreSQL 15 or newer installed
- AWS account with S3 and KMS access
- PgBouncer installed
- Node.js 18+ with Prisma CLI

### Environment Variables Required

Create `.env.production`:
```env
# Database Connection
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=reset_primal_prod
DATABASE_USER=app_user
DATABASE_PASSWORD=<secure-password-from-secrets-manager>

# PgBouncer
PGBOUNCER_HOST=app-server.example.com
PGBOUNCER_PORT=6432

# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=production
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:...

# Backup Configuration
BACKUP_RETENTION_DAYS=30
S3_BACKUP_BUCKET=reset-primal-backups-prod

# SSL/TLS (optional, for client certificates)
DATABASE_CA_CERT=/path/to/ca.crt
DATABASE_CLIENT_CERT=/path/to/client.crt
DATABASE_CLIENT_KEY=/path/to/client.key
```

### Step 1: Provision PostgreSQL

**For AWS RDS:**
```bash
# Use AWS CLI or Console to create RDS instance
aws rds create-db-instance \
  --db-instance-identifier reset-primal-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 30
```

**For Self-Hosted:**
```bash
# Install PostgreSQL 15
# macOS:
brew install postgresql@15

# Linux (Ubuntu/Debian):
sudo apt-get install postgresql-15

# Start PostgreSQL
sudo systemctl start postgresql
```

### Step 2: Run Setup Script

```bash
# Make script executable
chmod +x scripts/setup-postgres.sh

# Run setup (requires sudo for self-hosted)
./scripts/setup-postgres.sh

# Expected output:
# ✅ PostgreSQL 15 Production Setup Complete!
```

### Step 3: Configure PgBouncer

```bash
# 1. Edit PgBouncer configuration
sudo vi /etc/pgbouncer/pgbouncer.ini

# 2. Update configuration from scripts/pgbouncer.ini
# Replace DATABASE_HOST, APP_USER_PASSWORD

# 3. Create user list file
sudo vi /etc/pgbouncer/userlist.txt
# Format: "username" "password_hash"

# 4. Start PgBouncer
sudo systemctl restart pgbouncer

# 5. Verify PgBouncer is running
pgbouncer -R /etc/pgbouncer/pgbouncer.ini

# 6. Check pool status
psql -h localhost -p 6432 -U pgbouncer_admin -d pgbouncer
# Query: SHOW POOLS;
```

### Step 4: Initialize Prisma Migrations

```bash
# 1. Update Prisma schema for production
cp .env.example .env.production

# 2. Create initial migration
npx prisma migrate create production_setup

# 3. Deploy migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate
```

### Step 5: Test Connections

```bash
# Run comprehensive connection tests
npm run test:db-connection

# Expected: ✅ ALL 7 TESTS PASSED
```

---

## 🔌 Connection Configuration

### Direct PostgreSQL (Admin/Migrations)
```javascript
// For administrative tasks and migrations
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: 5432,
  database: 'reset_primal_prod',
  user: 'postgres', // or admin user
  password: process.env.ADMIN_PASSWORD,
});
```

### PgBouncer (Application)
```javascript
// For application connections (preferred)
const pool = new Pool({
  host: process.env.PGBOUNCER_HOST || process.env.DATABASE_HOST,
  port: 6432, // PgBouncer port
  database: 'reset_primal_prod',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 25, // Pool size
});
```

### Prisma Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // For production, use PgBouncer URL
}
```

---

## 📊 Database Administration

### Check Database Status

```bash
# Connect to database
psql -h localhost -p 5432 -U postgres -d reset_primal_prod

# Show active connections
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;

# Show table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Show slow queries (requires pg_stat_statements extension)
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Create Backups Manually

```bash
# Full backup
./scripts/backup-database.sh full

# Verify latest backup
./scripts/backup-database.sh verify

# Test restore procedure
./scripts/backup-database.sh restore-test
```

### Monitor Connections

```bash
# Check PgBouncer pool status
psql -h localhost -p 6432 -U pgbouncer_admin -d pgbouncer -c "SHOW POOLS;"

# Output shows:
# database   | user   | cl_active | cl_waiting | sv_active | sv_idle
# -----------+--------+-----------+------------+-----------+--------
# reset_primal_prod | app_user | 5 | 0 | 25 | 5
```

---

## 🔒 Security Considerations

### Credentials Management
- **DO NOT** store passwords in `.env` files in production
- Use AWS Secrets Manager to store database passwords
- Rotate passwords every 90 days
- Use environment variables for credentials

### Network Security
- Restrict database access to application servers only
- Use VPC Security Groups to limit connections
- Enable SSL/TLS for all connections
- Configure database firewall rules

### Backup Security
- Encrypt backups with KMS
- Store backups in separate AWS region
- Restrict S3 bucket access with IAM policies
- Enable versioning on backup buckets

### Audit Logging
- All connections are logged to `audit_logs` table
- All operations (SELECT, INSERT, UPDATE, DELETE) logged
- Logs retained for 1 year
- Audit logs accessible only to admin users

---

## 🔧 Performance Tuning

### Connection Pool Configuration
```
min_pool_size = 10         # Minimum connections to maintain
default_pool_size = 25     # Default pool size per database/user
max_pool_size = 100        # Maximum connections allowed
pool_mode = transaction    # Return connection after each transaction
reserve_pool_size = 5      # Reserved for high-priority connections
```

### PostgreSQL Configuration
See `config/database.prod.js` for recommended settings:
- `shared_buffers = 512MB` (25% of RAM)
- `effective_cache_size = 1536MB` (75% of RAM)
- `work_mem = 16MB`
- `max_connections = 200`

### Query Optimization
- Use prepared statements (prevents SQL injection)
- Add indexes on frequently queried columns
- Monitor slow query logs (`log_min_duration_statement = 1000`)
- Use EXPLAIN ANALYZE for query planning

---

## 📈 Monitoring

### CloudWatch Dashboard
- CPU utilization
- Storage usage
- Active connections
- Query latency (p50, p95, p99)
- Backup status
- Replication lag

### CloudWatch Alarms
- CPU > 80%: High priority alert
- Storage > 85%: High priority alert
- Connections > 150: Warning alert
- Backup failed: Critical alert

### Check Dashboard
```bash
# Open CloudWatch Dashboard
aws cloudwatch get-dashboard --dashboard-name "Reset Primal - Database Monitoring"
```

---

## 🚨 Troubleshooting

### Connection Refused
```bash
# Check PostgreSQL is running
psql -h localhost -c "SELECT 1;"

# Check firewall rules
sudo iptables -L | grep 5432

# Check port is listening
netstat -tlnp | grep 5432
```

### High Connection Count
```bash
# Identify slow queries
SELECT pid, usename, application_name, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle' ORDER BY query_start;

# Kill long-running queries (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'app_user' AND query_start < NOW() - INTERVAL '5 minutes';
```

### Slow Queries
```bash
# Enable slow query logging
ALTER DATABASE reset_primal_prod SET log_min_duration_statement = 1000;

# View slow queries
psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC;"

# Analyze query performance
EXPLAIN ANALYZE SELECT ... FROM ...;
```

### PgBouncer Issues
```bash
# Restart PgBouncer
sudo systemctl restart pgbouncer

# Check PgBouncer logs
tail -f /var/log/pgbouncer/pgbouncer.log

# Test direct connection (bypass pool)
psql -h db-host -p 5432 -U app_user
```

---

## ✅ Maintenance Tasks

### Daily
- Monitor CloudWatch dashboard
- Check backup completion status
- Review error logs

### Weekly
- Run `./scripts/backup-database.sh verify` to verify backups
- Check slow query logs
- Monitor connection pool utilization

### Monthly
- Run `./scripts/backup-database.sh restore-test` to test backups
- Review and optimize slow queries
- Check and rotate credentials if needed

### Quarterly
- Review database size and growth rate
- Assess capacity for next quarter
- Plan scaling if needed (add read replicas, larger instance)

---

## 📞 Support & Escalation

**Database Issues:**
- Check `/var/log/postgresql/postgresql.log`
- Monitor CloudWatch metrics
- Run connection test: `npm run test:db-connection`

**Backup Issues:**
- Check `/var/log/postgresql/backup.log`
- Verify S3 bucket access: `aws s3 ls s3://reset-primal-backups-prod/`
- Test restore: `./scripts/backup-database.sh restore-test`

**Performance Issues:**
- Check slow query logs
- Review connection pool utilization
- Run EXPLAIN ANALYZE on slow queries

---

## 📚 References

- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [Prisma Database Docs](https://www.prisma.io/docs/reference/database-reference)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)

---

**Last Updated:** 29 January 2026
**Maintained By:** @dev (Dex)
**Status:** ✅ Production Ready
