-- Reset Primal: Role-Based Access Control (RBAC) Setup
-- PostgreSQL 15+ Role and Permission Configuration
--
-- This script creates three roles with minimal required permissions:
-- 1. reset_primal_app - Application user (SELECT, INSERT, UPDATE on specific tables)
-- 2. reset_primal_reporting - Read-only role for analytics
-- 3. reset_primal_admin - Admin role (requires MFA override in production)
--
-- Usage: psql -U postgres -d reset_primal_prod -f setup-rbac.sql

-- ============================================================================
-- ROLE 1: reset_primal_app - Application User (Limited Write Access)
-- ============================================================================

-- Drop existing role if it exists (for idempotency)
DROP ROLE IF EXISTS reset_primal_app;

-- Create the application user role
CREATE ROLE reset_primal_app WITH
  ENCRYPTED PASSWORD 'REPLACE_WITH_SECURE_PASSWORD',
  LOGIN,
  VALID UNTIL '2027-01-29';

-- Grant connection privileges
ALTER ROLE reset_primal_app SET statement_timeout = '30s';
ALTER ROLE reset_primal_app SET lock_timeout = '30s';
ALTER ROLE reset_primal_app SET idle_in_transaction_session_timeout = '60s';

-- Grant database connection
GRANT CONNECT ON DATABASE reset_primal_prod TO reset_primal_app;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO reset_primal_app;

-- Table-level permissions for reset_primal_app
-- Tables: users, purchases, products (SELECT, INSERT, UPDATE allowed)
GRANT SELECT, INSERT, UPDATE ON public.users TO reset_primal_app;
GRANT SELECT, INSERT, UPDATE ON public.purchases TO reset_primal_app;
GRANT SELECT, INSERT, UPDATE ON public.products TO reset_primal_app;

-- Explicitly DENY access to sensitive tables
GRANT USAGE ON SCHEMA public TO reset_primal_app;
REVOKE ALL PRIVILEGES ON public.audit_logs FROM reset_primal_app;

-- Grant sequence access for auto-increment fields (if using native sequences)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reset_primal_app;

-- Set connection limit: Max 20 concurrent connections
ALTER ROLE reset_primal_app CONNECTION LIMIT 20;

-- ============================================================================
-- ROLE 2: reset_primal_reporting - Read-Only Role (Analytics)
-- ============================================================================

DROP ROLE IF EXISTS reset_primal_reporting;

CREATE ROLE reset_primal_reporting WITH
  ENCRYPTED PASSWORD 'REPLACE_WITH_SECURE_PASSWORD',
  LOGIN,
  VALID UNTIL '2027-01-29';

-- Grant connection privileges
ALTER ROLE reset_primal_reporting SET statement_timeout = '60s';

-- Grant database connection
GRANT CONNECT ON DATABASE reset_primal_prod TO reset_primal_reporting;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO reset_primal_reporting;

-- Read-only access to all tables (SELECT only)
GRANT SELECT ON public.users TO reset_primal_reporting;
GRANT SELECT ON public.purchases TO reset_primal_reporting;
GRANT SELECT ON public.products TO reset_primal_reporting;
GRANT SELECT ON public.audit_logs TO reset_primal_reporting;

-- Grant sequence access for reading
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reset_primal_reporting;

-- Set connection limit: Max 20 concurrent connections
ALTER ROLE reset_primal_reporting CONNECTION LIMIT 20;

-- ============================================================================
-- ROLE 3: reset_primal_admin - Admin Role (Full Access)
-- ============================================================================

DROP ROLE IF EXISTS reset_primal_admin;

CREATE ROLE reset_primal_admin WITH
  ENCRYPTED PASSWORD 'REPLACE_WITH_SECURE_PASSWORD',
  LOGIN,
  SUPERUSER,
  VALID UNTIL '2027-01-29';

-- Admin role has full access - no additional grants needed
-- Note: In production, this should require MFA and be monitored closely

-- Set connection limit: Max 10 concurrent connections (restricted)
ALTER ROLE reset_primal_admin CONNECTION LIMIT 10;

-- ============================================================================
-- DEFAULT PRIVILEGES FOR FUTURE OBJECTS
-- ============================================================================

-- Set default privileges so future tables automatically grant correct permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO reset_primal_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reset_primal_reporting;

-- ============================================================================
-- AUDIT LOGGING FOR ROLE CHANGES
-- ============================================================================

-- Create a log table for role permission changes
CREATE TABLE IF NOT EXISTS role_audit_log (
  id BIGSERIAL PRIMARY KEY,
  role_name VARCHAR(255),
  action VARCHAR(50),
  details TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial role creation log entries
INSERT INTO role_audit_log (role_name, action, details, changed_by)
VALUES
  ('reset_primal_app', 'CREATED', 'Application user role with limited write access', 'postgres'),
  ('reset_primal_reporting', 'CREATED', 'Read-only reporting user role', 'postgres'),
  ('reset_primal_admin', 'CREATED', 'Admin role with full access', 'postgres');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify roles were created correctly:
--
-- SELECT * FROM pg_roles WHERE rolname LIKE 'reset_primal%';
--
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name = 'users';
--
-- SELECT rolname, rolconnlimit, rolcanlogin FROM pg_roles WHERE rolname LIKE 'reset_primal%';

-- ============================================================================
-- END OF RBAC SETUP
-- ============================================================================

COMMIT;
