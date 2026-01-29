-- Reset Primal: Database Query Optimization Script
-- PostgreSQL 15+ optimization for production database
-- Adds strategic indexes and optimizes query patterns

-- ============================================================================
-- INDEX CREATION - Hot Queries
-- ============================================================================

-- User queries
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON users(created_at DESC)
  WHERE deleted_at IS NULL;

-- Purchase queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_status
  ON purchases(user_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_created_at
  ON purchases(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_status
  ON purchases(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_product_id
  ON purchases(product_id)
  WHERE deleted_at IS NULL;

-- Product queries
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_name
  ON products(name)
  WHERE deleted_at IS NULL;

-- Transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_id
  ON transactions(purchase_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions(status)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- COMPOSITE INDEXES - Common JOIN patterns
-- ============================================================================

-- User + purchase lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_created
  ON purchases(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Purchase + transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_purchase_status
  ON transactions(purchase_id, status)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PARTIAL INDEXES - Filter out soft-deleted records
-- ============================================================================

-- Users index excluding deleted
CREATE INDEX IF NOT EXISTS idx_users_active
  ON users(id)
  WHERE deleted_at IS NULL;

-- Products index excluding archived
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products(id, category)
  WHERE archived_at IS NULL;

-- ============================================================================
-- ENABLE TABLE STATISTICS
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE users;
ANALYZE products;
ANALYZE purchases;
ANALYZE transactions;

-- ============================================================================
-- QUERY OPTIMIZATION HINTS
-- ============================================================================

-- Enable query plan cache for better performance
ALTER SYSTEM SET plan_cache_mode = 'auto';

-- Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '256MB';

-- Increase maintenance memory for index operations
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Increase shared buffers (typically 25% of system RAM, but AWS RDS manages this)
-- ALTER SYSTEM SET shared_buffers = '8GB';

-- Enable automatic query explain logging for slow queries
ALTER SYSTEM SET auto_explain.log_min_duration = 1000;  -- 1 second
ALTER SYSTEM SET auto_explain.log_analyze = true;

-- Increase random page cost for SSDs (default 4.0, reduce for SSDs)
ALTER SYSTEM SET random_page_cost = 1.1;

-- Reload configuration
SELECT pg_reload_conf();

-- ============================================================================
-- N+1 QUERY PREVENTION - Indexes for batching
-- ============================================================================

-- Index for batch user lookups
CREATE INDEX IF NOT EXISTS idx_users_id_batch
  ON users(id)
  WHERE deleted_at IS NULL;

-- Index for batch product lookups
CREATE INDEX IF NOT EXISTS idx_products_id_batch
  ON products(id)
  WHERE archived_at IS NULL;

-- ============================================================================
-- SLOW QUERY LOGGING CONFIGURATION
-- ============================================================================

-- Enable slow query log (queries > 100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Log slow queries with query plan
ALTER SYSTEM SET log_statement = 'all';

-- Include query plan in logs
ALTER SYSTEM SET log_explain = true;

-- Reload configuration
SELECT pg_reload_conf();

-- ============================================================================
-- VIEW OPTIMIZATION - Common queries as materialized views
-- ============================================================================

-- User purchase summary for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS v_user_purchase_summary AS
SELECT
  u.id,
  u.email,
  COUNT(p.id) as total_purchases,
  COALESCE(SUM(p.amount), 0) as total_spent,
  MAX(p.created_at) as last_purchase_date,
  COUNT(CASE WHEN p.status = 'APPROVED' THEN 1 END) as approved_purchases,
  COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pending_purchases,
  COUNT(CASE WHEN p.status = 'FAILED' THEN 1 END) as failed_purchases
FROM users u
LEFT JOIN purchases p ON u.id = p.user_id AND p.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email;

CREATE INDEX IF NOT EXISTS idx_v_user_purchase_summary_user_id
  ON v_user_purchase_summary(id);

-- Product sales summary for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS v_product_sales_summary AS
SELECT
  p.id,
  p.name,
  p.category,
  COUNT(pu.id) as total_sales,
  COALESCE(SUM(pu.amount), 0) as total_revenue,
  AVG(CASE WHEN pu.status = 'APPROVED' THEN pu.amount END) as avg_sale_price,
  MAX(pu.created_at) as last_sale_date,
  COUNT(DISTINCT pu.user_id) as unique_buyers
FROM products p
LEFT JOIN purchases pu ON p.id = pu.product_id AND pu.deleted_at IS NULL
WHERE p.archived_at IS NULL
GROUP BY p.id, p.name, p.category;

CREATE INDEX IF NOT EXISTS idx_v_product_sales_summary_id
  ON v_product_sales_summary(id);

-- ============================================================================
-- REFRESH MATERIALIZED VIEWS
-- ============================================================================

-- Refresh all materialized views with new data
REFRESH MATERIALIZED VIEW v_user_purchase_summary;
REFRESH MATERIALIZED VIEW v_product_sales_summary;

-- ============================================================================
-- TABLE STATISTICS AND MAINTENANCE
-- ============================================================================

-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Check index bloat and efficiency
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  round((100 * (pg_relation_size(indexrelid) - pg_relation_size(relid))) / pg_relation_size(relid), 2) as overhead_pct
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
JOIN pg_tables ON pg_tables.tablename = pg_indexes.tablename
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- PERFORMANCE BASELINE - Query Plan Examples
-- ============================================================================

-- Verify index usage on common queries
EXPLAIN ANALYZE
SELECT * FROM purchases
WHERE user_id = 1 AND status = 'APPROVED'
ORDER BY created_at DESC;

EXPLAIN ANALYZE
SELECT u.email, COUNT(p.id) as purchase_count
FROM users u
LEFT JOIN purchases p ON u.id = p.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email;

EXPLAIN ANALYZE
SELECT * FROM purchases
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
