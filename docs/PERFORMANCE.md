# Performance Optimization & Testing - Reset Primal

**Status:** Production Ready
**Last Updated:** 29 January 2026
**Baseline Date:** 29 January 2026

---

## Performance Targets

### API Response Times (Normal Load - 10 concurrent users)
| Percentile | Target | Current |
|-----------|--------|---------|
| p50 | 50ms | ⏳ |
| p95 | 100ms | ⏳ |
| p99 | 500ms | ⏳ |

### API Response Times (Peak Load - 100 concurrent users)
| Percentile | Target | Current |
|-----------|--------|---------|
| p95 | 500ms | ⏳ |
| p99 | 1000ms | ⏳ |
| Error Rate | < 1% | ⏳ |

### Database Query Times
| Percentile | Target | Current |
|-----------|--------|---------|
| p50 | 20ms | ⏳ |
| p95 | 100ms | ⏳ |
| p99 | 500ms | ⏳ |
| Slow Query Count | < 10 in 5 min | ⏳ |

### Caching Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Overall Hit Rate | > 80% | ⏳ |
| User Profile Hit Rate | > 85% | ⏳ |
| Product Hit Rate | > 90% | ⏳ |
| Database Load Reduction | 30%+ | ⏳ |
| Response Time Reduction | 50%+ | ⏳ |

---

## Load Testing

### Running Load Tests

**Prerequisites:**
- k6 installed locally or in CI/CD
- Staging/test environment with production-like data
- API key with appropriate permissions

**Execute Load Test:**
```bash
# Normal load test
k6 run scripts/load-test.js

# Peak load test
BASE_URL=https://api.reset-primal.com k6 run scripts/load-test.js --stage peak

# Full load testing suite
npm run test:load
```

### Test Scenarios

**1. Normal Load (5 minutes)**
- 0-1 min: Ramp up to 10 users
- 1-4 min: Sustain 10 users
- 4-5 min: Ramp down
- Target: p95 < 100ms, error rate < 1%

**2. Peak Load (10 minutes)**
- 0-2 min: Ramp to 50 users
- 2-4 min: Ramp to 100 users
- 4-8 min: Sustain 100 users
- 8-10 min: Ramp down
- Target: p95 < 500ms, error rate < 1%

**3. Spike Load (10 minutes)**
- 0-1 min: 10 users
- 1-3 min: Spike to 500 users
- 3-8 min: Sustain 500 users
- 8-10 min: Cool down
- Target: p95 < 1000ms, error rate < 10%

**4. Sustained Peak (30 minutes)**
- 0-5 min: Ramp to 100 users
- 5-25 min: Sustain 100 users
- 25-30 min: Ramp down
- Target: Stable metrics, no degradation

**5. Webhook Stress (5 minutes)**
- Test webhook processing at 100/second
- Verify queue doesn't overflow
- Check error handling

---

## Database Optimization

### Indexes Added

**Hot Queries:**
- `idx_users_email` - User lookups by email
- `idx_purchases_user_status` - User purchases filtering
- `idx_purchases_created_at` - Time-based queries
- `idx_products_category` - Category filtering
- `idx_transactions_purchase_id` - Transaction lookups

**Composite Indexes:**
- `idx_purchases_user_created` - User + date lookups
- `idx_transactions_purchase_status` - Transaction filtering

**Run Index Creation:**
```sql
psql -h <db-host> -U postgres -d reset_primal_prod -f scripts/optimize-database.sql
```

### Query Optimization Techniques

**1. N+1 Query Prevention**
- Use batch queries: `SELECT * FROM users WHERE id IN (1,2,3,4,5)`
- Instead of: 5 separate queries
- Impact: 5x performance improvement

**2. Index Usage Verification**
```sql
EXPLAIN ANALYZE
SELECT * FROM purchases
WHERE user_id = 1 AND status = 'APPROVED'
ORDER BY created_at DESC;
```

Look for "Index Scan" not "Seq Scan".

**3. Query Plan Optimization**
- Enable `auto_explain` to log slow queries
- Review `EXPLAIN ANALYZE` output
- Look for Seq Scans on large tables

**4. Materialized Views**
- `v_user_purchase_summary` - User purchase statistics
- `v_product_sales_summary` - Product sales analytics
- Refresh: `REFRESH MATERIALIZED VIEW v_user_purchase_summary`

---

## Caching Strategy

### Redis Configuration

**Installation:**
```bash
bash scripts/setup-redis.sh
```

**Configuration:**
```javascript
const redis = require('redis').createClient({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});
```

### Cache TTL Configuration

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User Profile | 5 min | Changes frequently |
| Product | 10 min | Changes moderately |
| Purchase History | 1 min | Real-time updates needed |
| Analytics | 1 hour | Stable data |
| Settings | 1 hour | Rarely changes |

### Cache Invalidation

**Event-Based Invalidation:**
```javascript
// When user is updated
await invalidateUserCache(userId);

// When product is updated
await invalidateProductCache(productId);

// When purchase is created
await invalidatePurchaseCache(purchaseId, userId);
```

### Monitoring Cache Health

```javascript
// Get cache statistics
const stats = await getCacheStats();
console.log(`Hit Rate: ${stats.keyspace_hits / stats.keyspace_misses}`);

// Check cache availability
const isHealthy = await cacheHealthCheck();
if (!isHealthy) {
  console.log('Redis down - falling back to database');
}
```

---

## API Response Optimization

### Response Compression

Gzip compression enabled automatically:
- Typical reduction: 60-70%
- Threshold: 1KB
- Compression level: 6 (balance speed vs ratio)

### Pagination Implementation

**Cursor-Based Pagination (More Efficient):**
```http
GET /api/purchases?cursor=xyz&limit=50
```

Response includes `nextCursor` for pagination.

**Offset-Based Pagination (Legacy):**
```http
GET /api/purchases?offset=0&limit=50
```

Cursor-based is preferred for large datasets.

### Response Field Selection

**With Field Selection:**
```http
GET /api/users?fields=id,email,name
```

Reduces response payload by filtering fields.

---

## Frontend Performance

### Lighthouse Scores
| Metric | Target | Status |
|--------|--------|--------|
| Performance | > 90 | ⏳ |
| First Contentful Paint (FCP) | < 1.5s | ⏳ |
| Largest Contentful Paint (LCP) | < 2.5s | ⏳ |
| Cumulative Layout Shift (CLS) | < 0.1 | ⏳ |

### Static Asset Optimization
- Minify CSS/JavaScript
- Compress images (WebP format)
- Set cache headers (long-lived for hashed assets)
- Use CDN for static assets

---

## Connection Pool Optimization

### PgBouncer Configuration

**Current Settings:**
- Min pool size: 10
- Max pool size: 100
- Transaction pooling mode
- Idle timeout: 5 minutes

**Optimization Steps:**
1. Monitor peak connection usage
2. Set `min_pool_size` to 50% of peak
3. Set `max_pool_size` to peak usage + 10%
4. Monitor connection wait times (target: < 10ms)

---

## Bottleneck Analysis

### Identifying Performance Bottlenecks

**1. High API Latency (p95 > 100ms)**
- Check database query performance
- Review slow query logs
- Verify indexes are being used
- Check cache hit rate

**2. High Error Rate (> 1%)**
- Review application error logs
- Check database connectivity
- Verify resource availability
- Review external API integrations

**3. Low Cache Hit Rate (< 70%)**
- Increase cache TTL
- Review cache invalidation logic
- Check cache key patterns
- Monitor cache eviction rate

**4. High Database Load (CPU > 80%)**
- Add missing indexes
- Optimize slow queries
- Increase connection pool size
- Implement query batching

---

## Continuous Performance Monitoring

### Performance Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| API p95 Latency High | > 500ms | Investigate database |
| Database p95 Latency High | > 200ms | Review slow query logs |
| Error Rate High | > 1% | Check error logs |
| Cache Hit Rate Low | < 70% | Review cache config |
| Connection Pool Saturated | > 80% | Increase pool size |

### Monthly Performance Reviews

1. Compare metrics to baseline
2. Identify trends (improving/degrading)
3. Review optimization opportunities
4. Document improvements
5. Update load test results

---

## Performance Regression Prevention

### Before Deployment

```bash
# Run baseline comparison
npm run test:performance:baseline

# Run load tests
npm run test:load

# Check for regressions
npm run test:performance:check
```

### Continuous Integration

- Automatic performance tests on PR
- Alert on > 10% regression
- Block merge on p95 latency > target

---

## Related Documentation

- [Monitoring Guide](./MONITORING.md) - Metrics & dashboards
- [Database Setup](./DATABASE-SETUP.md) - Database configuration
- [Troubleshooting](./TROUBLESHOOTING.md) - Common performance issues

---

**Created:** 29 January 2026
**Status:** Production Ready
**Last Performance Review:** 29 January 2026
**Next Review:** 29 February 2026
