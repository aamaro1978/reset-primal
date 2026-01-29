# Monitoring & Alerting - Reset Primal

**Status:** Production Ready
**Last Updated:** 29 January 2026

---

## Overview

Comprehensive monitoring and alerting system for Reset Primal production database and application, built on AWS CloudWatch.

**Key Metrics:**
- Real-time database performance (CPU, memory, disk, connections)
- Application performance (response time, error rate, throughput)
- Business metrics (purchases, revenue, active users)
- System health (backups, failover status, service availability)

**Update Frequency:** 60 seconds with < 5-second latency

---

## Dashboard Architecture

### Primary Dashboards

**1. Production Overview (`reset-primal-prod-overview`)**
- Real-time view of entire system
- Refresh: Every 60 seconds
- 11 metric widgets covering all system aspects

**2. Database Performance (`reset-primal-database-performance`)**
- Deep dive into database metrics
- CPU, memory, connections, I/O latency
- Replication lag and query performance

**3. Application Health**
- Response times (p50, p95, p99)
- Error rates and error distribution
- Webhook and email delivery metrics

**4. Disaster Recovery**
- Backup status and age
- PITR window availability
- Replication lag monitoring

---

## Metrics Configuration

### Custom Metrics

All custom metrics use namespace `reset-primal/{component}`:

**Application Metrics:**
- `ResponseTime` - API response duration (milliseconds)
- `ErrorCount` - API errors (count)
- `RequestCount` - Total API requests
- `ErrorRate` - Error percentage (%)
- `ThroughputPerSecond` - Requests per second

**Database Metrics:**
- `QueryCountPerSecond` - Queries per second
- `SlowQueryCount` - Queries > 100ms
- `ConnectionPoolUtilization` - Pool usage (%)
- `ReplicationLagSeconds` - Replica lag (seconds)

**Business Metrics:**
- `PurchasesPerHour` - Hourly purchase count
- `RevenuePerDay` - Daily revenue
- `ActiveUsersOnline` - Current active users

**Webhook Metrics:**
- `ProcessingRate` - Webhooks processed per second
- `FailureRate` - Webhook failure percentage (%)
- `QueueDepth` - Pending webhooks

**Email Metrics:**
- `DeliveryRate` - Email delivery success (%)
- `FailureRate` - Email delivery failures (%)
- `ProcessingTime` - Email processing duration (ms)

**Backup Metrics:**
- `BackupStatus` - Success (1) / Failure (0)
- `BackupAgeHours` - Hours since last backup
- `BackupSizeGB` - Backup size in gigabytes

---

## Alert Configuration

### Alert Severity Levels

**CRITICAL** - Immediate action required
- Database CPU > 95%
- Storage > 95%
- Connections > 190 of 200
- Backup failed
- Backup > 24 hours old
- Application down
- Error rate > 5%

**HIGH** - Investigate within 15 minutes
- Database CPU > 80%
- Storage > 85%
- Connections > 150 of 200
- Response time p95 > 1000ms
- Error rate > 1%
- Webhook failures > 5 in 5 min
- Email delivery failures > 10%
- Replication lag > 1 second
- Disk free < 5GB

**MEDIUM** - Investigate within 1 hour
- Response time p95 > 500ms
- Slow queries > 10 in 5 min
- PITR window < 24 hours
- Cache hit rate < 70%
- Memory available < 1GB

---

## CloudWatch Logs

### Log Groups

| Log Group | Retention | Purpose |
|-----------|-----------|---------|
| `/aws/api/production` | 30 days | Application logs |
| `/aws/api/webhook` | 30 days | Webhook processing |
| `/aws/api/email` | 30 days | Email service logs |
| `/aws/api/analytics` | 30 days | Analytics logs |
| `/aws/database/postgres` | 14 days | Database logs |

### Log Format

All logs use JSON structure for CloudWatch Logs Insights queries:

```json
{
  "@timestamp": "2026-01-29T10:00:00Z",
  "level": "INFO",
  "message": "Request completed",
  "service": "reset-primal-api",
  "environment": "production",
  "version": "1.0.0",
  "requestId": "xyz123",
  "userId": "user123",
  "ipAddress": "192.168.1.1",
  "metadata": {
    "path": "/api/purchases",
    "method": "POST",
    "statusCode": 201,
    "durationMs": 145
  }
}
```

---

## CloudWatch Insights Queries

### Pre-Built Queries

**1. Errors in Last Hour**
```
fields @timestamp, @message, level, error
| filter level = "ERROR" or level = "CRITICAL"
| stats count() as error_count by level
```

**2. Slow Queries**
```
fields @timestamp, operation, durationMs
| filter durationMs > 500
| stats avg(durationMs) as avg_time, max(durationMs) as max_time, count() as query_count
```

**3. Failed Webhook Processing**
```
fields @timestamp, webhookId, status, error
| filter status != "success"
| stats count() as failure_count by error
```

**4. Email Delivery Failures**
```
fields @timestamp, recipient, status, reason
| filter status = "failed"
| stats count() as failure_count by reason
```

**5. Authentication Failures**
```
fields @timestamp, email, ipAddress, attempt
| filter attempt = "failed"
| stats count() as failure_count by ipAddress
```

**6. Request Latency Distribution**
```
fields @timestamp, durationMs
| stats pct(durationMs, 50) as p50, pct(durationMs, 95) as p95, pct(durationMs, 99) as p99
```

---

## Health Check Endpoint

### GET /health/status

Full system health check with component details.

**Response:** 200 (healthy) or 503 (unhealthy)

```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T10:00:00Z",
  "components": {
    "database": {
      "status": "up",
      "latency_ms": 15
    },
    "email": {
      "status": "up",
      "latency_ms": 200
    },
    "ga4": {
      "status": "up",
      "latency_ms": 100
    },
    "webhook": {
      "status": "up",
      "processed": 150
    },
    "cache": {
      "status": "up",
      "hit_rate": 0.85
    }
  },
  "totalResponseTimeMs": 350
}
```

### GET /health/ping

Simple liveness probe (always 200).

### GET /health/readiness

Readiness check (202 if ready, 503 if not ready).

---

## Alert Notifications

### SNS Integration

Alarms send to SNS topics:
- **Ops Team:** `arn:aws:sns:us-east-1:123456789:ops-team` (HIGH alerts)
- **Critical Team:** `arn:aws:sns:us-east-1:123456789:ops-critical` (CRITICAL alerts)

### Slack Integration

All alerts post to `#alerts` channel with:
- Alarm name and severity
- Affected resource
- Metric value and threshold
- Recommended action

### Email Alerts

Critical alerts trigger email to on-call engineer.

---

## Metric Collection

### Application Metrics

Collected via `monitoringMiddleware` on every request:

```javascript
req.logger.info('Request completed', {
  method: 'POST',
  path: '/api/purchases',
  statusCode: 201,
  durationMs: 145,
  responseSize: 1024
});
```

### Database Metrics

Collected via RDS CloudWatch integration (automatic).

### Custom Metrics

Published via `publishMetric()` from application:

```javascript
await publishMetric('reset-primal/business', 'PurchasesPerHour', 45, 'Count');
```

---

## Monitoring Best Practices

### 1. Baseline Performance
- Establish baseline metrics during normal load
- Use baselines to detect anomalies (2x normal = alert)
- Review baselines quarterly

### 2. Alert Tuning
- Set thresholds based on business SLA, not arbitrary numbers
- Use composite alerts (multiple conditions) to reduce false positives
- Require 2-3 consecutive failures before alerting (prevent noise)

### 3. Log Retention
- Application logs: 30 days (compliance requirement)
- Database logs: 14 days (for troubleshooting)
- Archive to S3 Glacier after retention period

### 4. Dashboard Refresh
- Use 1-minute refresh for operational dashboards
- Use 5-minute refresh for trend analysis
- Avoid sub-minute refresh (wastes API calls)

### 5. Metric Costs
- CloudWatch charges per custom metric ($0.30/month each)
- Current: ~20 custom metrics = ~$6/month
- Monitor and consolidate metrics as usage grows

---

## Performance Baselines

**Established:** 29 January 2026

### API Response Times
- p50: 50ms
- p95: 100ms (normal load)
- p99: 500ms

### Database Query Times
- p50: 20ms
- p95: 100ms
- p99: 500ms

### Error Rates
- Normal load: < 0.1%
- Peak load: < 1%
- Critical threshold: > 5%

### Cache Hit Rate
- Target: > 80%
- Acceptable: > 70%
- Alert: < 70%

---

## Troubleshooting

### Dashboard Data Not Updating

1. Check CloudWatch API quota (20 TPS default)
2. Verify IAM role has `cloudwatch:GetMetricStatistics` permission
3. Check if metrics are being published (look in Recent metrics)
4. Refresh browser (data may be cached)

### Alerts Not Triggering

1. Verify SNS topic exists and has subscribers
2. Check alarm state history: Metrics → Alarms → Alarm history
3. Verify metric data is flowing (check Recent metrics)
4. Check alarm evaluation periods (may require multiple periods)

### Missing Logs

1. Verify log group exists: Logs → Log groups
2. Check log retention: Log group settings
3. Verify IAM role has `logs:PutLogEvents` permission
4. Check if application is logging to CloudWatch

---

## Cost Management

**Estimated Monthly Cost:**
- CloudWatch Dashboard: $3
- Custom Metrics: ~$6 (20 metrics)
- Logs: ~$10 (180GB ingestion)
- Alarms: ~$5 (25 alarms)
- **Total: ~$24/month**

**Optimization Tips:**
- Archive old logs to S3 Glacier
- Consolidate related metrics
- Use metric math instead of custom metrics where possible
- Review and remove unused dashboards

---

## Related Documentation

- [Disaster Recovery Plan](./DISASTER-RECOVERY.md) - Backup & recovery procedures
- [Performance Tuning](./PERFORMANCE.md) - Optimization guide
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues & solutions

---

**Created:** 29 January 2026
**Status:** Production Ready
**Maintained by:** @dev (Dex)
