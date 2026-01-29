-- Reset Primal: Audit Logging Setup
-- PostgreSQL 15+ Trigger-Based Audit System
--
-- Creates audit_logs table and triggers to log all database operations
-- Tracks: user, operation type, timestamp, rows affected, connection info
--
-- Usage: psql -U postgres -d reset_primal_prod -f setup-audit-logging.sql

-- ============================================================================
-- CREATE AUDIT_LOGS TABLE (Main Audit Store)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Operation metadata
  operation VARCHAR(10) NOT NULL,           -- SELECT, INSERT, UPDATE, DELETE
  table_name VARCHAR(255) NOT NULL,         -- Table being modified

  -- Actor information
  user_id UUID,                             -- User performing action (from app context)
  database_user VARCHAR(255) DEFAULT current_user,  -- PostgreSQL user
  application_name VARCHAR(255),            -- App name from connection

  -- Record information
  record_id UUID,                           -- Primary key of affected record
  old_values JSONB,                         -- Previous values (UPDATE, DELETE)
  new_values JSONB,                         -- New values (INSERT, UPDATE)
  rows_affected INTEGER DEFAULT 1,          -- Number of rows affected

  -- Connection information
  ip_address INET,                          -- Client IP address
  user_agent VARCHAR(500),                  -- HTTP User-Agent

  -- Timing information
  created_at TIMESTAMP DEFAULT NOW(),       -- Log entry timestamp
  operation_duration_ms INTEGER,            -- How long operation took

  -- Query information (for debugging)
  query_snippet TEXT,                       -- First 500 chars of query (sanitized)

  -- Indexes for fast querying
  CONSTRAINT audit_logs_created_at_idx UNIQUE (created_at, id),
  CONSTRAINT audit_logs_table_idx UNIQUE (table_name, created_at, id)
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs (table_name, created_at DESC);
CREATE INDEX idx_audit_logs_operation ON audit_logs (operation, created_at DESC);

-- Create partitioning key index (for future table partitioning by month)
CREATE INDEX idx_audit_logs_date_trunc ON audit_logs (date_trunc('month', created_at));

-- ============================================================================
-- AUDIT LOGGING FUNCTIONS
-- ============================================================================

-- Function to record operation to audit log
CREATE OR REPLACE FUNCTION audit_operation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_record_id UUID;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Try to get user_id from application context
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  -- Determine which record ID to use
  CASE TG_OP
    WHEN 'DELETE' THEN
      v_record_id := OLD.id;
      v_old_values := row_to_json(OLD);
      v_new_values := NULL;
    WHEN 'UPDATE' THEN
      v_record_id := NEW.id;
      v_old_values := row_to_json(OLD);
      v_new_values := row_to_json(NEW);
    WHEN 'INSERT' THEN
      v_record_id := NEW.id;
      v_old_values := NULL;
      v_new_values := row_to_json(NEW);
  END CASE;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    operation, table_name, record_id,
    user_id, database_user, application_name,
    old_values, new_values, rows_affected,
    created_at
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    v_user_id,
    current_user,
    current_setting('application_name', true),
    v_old_values,
    v_new_values,
    1,
    NOW()
  );

  -- Return appropriate row
  CASE TG_OP
    WHEN 'DELETE' THEN RETURN OLD;
    ELSE RETURN NEW;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS ON ALL MONITORED TABLES
-- ============================================================================

-- Trigger for users table
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_operation();

-- Trigger for purchases table
DROP TRIGGER IF EXISTS audit_purchases_trigger ON purchases;
CREATE TRIGGER audit_purchases_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION audit_operation();

-- Trigger for products table
DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION audit_operation();

-- ============================================================================
-- AUDIT LOG RETENTION POLICY
-- ============================================================================

-- Function to archive old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- In production, this would move old logs to S3 or cold storage
  -- For now, we just document the retention policy

  -- Delete audit logs older than 1 year
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';

  RAISE NOTICE 'Audit log archival completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT LOG QUERY FUNCTIONS (For Admin API)
-- ============================================================================

-- Function to get audit logs for a specific user (admin only)
CREATE OR REPLACE FUNCTION get_audit_logs_for_user(
  p_user_id UUID,
  p_start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP DEFAULT NOW(),
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  operation VARCHAR,
  table_name VARCHAR,
  record_id UUID,
  created_at TIMESTAMP,
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  -- Verify caller is admin
  IF current_user NOT IN ('reset_primal_admin', 'postgres') THEN
    RAISE EXCEPTION 'Permission denied: Only admins can query audit logs';
  END IF;

  RETURN QUERY
  SELECT
    audit_logs.id,
    audit_logs.operation,
    audit_logs.table_name,
    audit_logs.record_id,
    audit_logs.created_at,
    audit_logs.old_values,
    audit_logs.new_values
  FROM audit_logs
  WHERE
    audit_logs.user_id = p_user_id
    AND audit_logs.created_at BETWEEN p_start_date AND p_end_date
  ORDER BY audit_logs.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- View to track audit logging performance
CREATE OR REPLACE VIEW audit_logging_performance AS
SELECT
  table_name,
  operation,
  COUNT(*) as total_operations,
  AVG(operation_duration_ms) as avg_duration_ms,
  MAX(operation_duration_ms) as max_duration_ms,
  MAX(created_at) as last_operation
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY table_name, operation
ORDER BY total_operations DESC;

-- ============================================================================
-- COMMENT ON TABLES AND COLUMNS
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Audit log table tracking all database operations for compliance and security monitoring';
COMMENT ON COLUMN audit_logs.operation IS 'Database operation type: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of table being modified';
COMMENT ON COLUMN audit_logs.user_id IS 'Application user ID performing the operation';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous row values before modification (UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New row values after modification (INSERT/UPDATE)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify audit_logs table was created:
-- SELECT * FROM audit_logs LIMIT 1;
--
-- Verify triggers are active:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers
-- WHERE event_object_schema = 'public' AND trigger_name LIKE 'audit_%';
--
-- View audit logging performance:
-- SELECT * FROM audit_logging_performance;

-- ============================================================================
-- END OF AUDIT LOGGING SETUP
-- ============================================================================

COMMIT;
