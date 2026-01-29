#!/bin/bash

###############################################################################
# DigitalOcean PostgreSQL Setup Script
# 
# Configures RBAC, audit logging, and optimization for DigitalOcean 
# Managed Databases
# 
# Usage: bash do-setup-postgres.sh
# 
# Environment variables required:
#   DO_DB_HOST           - Database hostname
#   DO_DB_PORT           - Database port (default: 25060)
#   DO_DB_NAME           - Database name
#   DO_DB_USER           - Admin user (default: doadmin)
#   DO_DB_PASSWORD       - Admin password
#   DO_DB_APP_ROLE       - App role name (default: reset_primal_app)
#   DO_DB_APP_PASSWORD   - App role password
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST="${DO_DB_HOST}"
DB_PORT="${DO_DB_PORT:-25060}"
DB_NAME="${DO_DB_NAME:-reset_primal}"
DB_USER="${DO_DB_USER:-doadmin}"
DB_PASSWORD="${DO_DB_PASSWORD}"
APP_ROLE="${DO_DB_APP_ROLE:-reset_primal_app}"
APP_PASSWORD="${DO_DB_APP_PASSWORD}"
REPORTING_ROLE="${DO_DB_REPORTING_ROLE:-reset_primal_reporting}"
REPORTING_PASSWORD="${DO_DB_REPORTING_PASSWORD}"

# Functions
print_header() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Validate environment
validate_env() {
  print_header "Validating Environment"
  
  if [ -z "$DB_HOST" ]; then
    print_error "DO_DB_HOST is required"
    exit 1
  fi
  
  if [ -z "$DB_PASSWORD" ]; then
    print_error "DO_DB_PASSWORD is required"
    exit 1
  fi
  
  if [ -z "$APP_PASSWORD" ]; then
    print_error "DO_DB_APP_PASSWORD is required"
    exit 1
  fi
  
  print_success "Environment variables validated"
  echo ""
}

# Test database connection
test_connection() {
  print_header "Testing Database Connection"
  
  if PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection successful"
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "SELECT version();"
  else
    print_error "Failed to connect to database"
    exit 1
  fi
  echo ""
}

# Create RBAC roles
create_rbac() {
  print_header "Creating RBAC Roles"
  
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    <<'RBAC_SQL'
-- Create app role with limited permissions
CREATE ROLE reset_primal_app WITH LOGIN PASSWORD :'app_password';
ALTER ROLE reset_primal_app CONNECTION LIMIT 20;
GRANT CONNECT ON DATABASE reset_primal TO reset_primal_app;
GRANT USAGE ON SCHEMA public TO reset_primal_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reset_primal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reset_primal_app;

-- Create reporting role (read-only)
CREATE ROLE reset_primal_reporting WITH LOGIN PASSWORD :'reporting_password';
ALTER ROLE reset_primal_reporting CONNECTION LIMIT 10;
GRANT CONNECT ON DATABASE reset_primal TO reset_primal_reporting;
GRANT USAGE ON SCHEMA public TO reset_primal_reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reset_primal_reporting;
RBAC_SQL
  
  print_success "RBAC roles created"
  echo ""
}

# Enable audit logging
enable_audit() {
  print_header "Enabling Audit Logging"
  
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    <<'AUDIT_SQL'
-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation VARCHAR(10) NOT NULL,
  user_name TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  old_values JSONB,
  new_values JSONB
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_table_time 
  ON audit_logs(table_name, timestamp DESC);

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs(table_name, operation, user_name, old_values)
    VALUES(TG_TABLE_NAME, TG_OP, CURRENT_USER, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs(table_name, operation, user_name, old_values, new_values)
    VALUES(TG_TABLE_NAME, TG_OP, CURRENT_USER, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs(table_name, operation, user_name, new_values)
    VALUES(TG_TABLE_NAME, TG_OP, CURRENT_USER, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable log statement
ALTER DATABASE reset_primal SET log_statement = 'all';
ALTER DATABASE reset_primal SET log_min_duration_statement = 1000;

AUDIT_SQL
  
  print_success "Audit logging enabled"
  echo ""
}

# Create application tables (basic structure)
create_tables() {
  print_header "Creating Application Tables"
  
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    <<'TABLES_SQL'
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

TABLES_SQL
  
  print_success "Application tables created"
  echo ""
}

# Verify setup
verify_setup() {
  print_header "Verifying Setup"
  
  # Check roles
  echo "Checking roles..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "\du" | grep reset_primal
  
  # Check tables
  echo ""
  echo "Checking tables..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "\dt public.*"
  
  print_success "Setup verification complete"
  echo ""
}

# Main execution
main() {
  echo ""
  print_header "DigitalOcean PostgreSQL Setup"
  echo "Host: $DB_HOST"
  echo "Port: $DB_PORT"
  echo "Database: $DB_NAME"
  echo ""
  
  validate_env
  test_connection
  create_rbac
  enable_audit
  create_tables
  verify_setup
  
  echo ""
  print_header "Setup Complete!"
  echo -e "${GREEN}PostgreSQL is ready for Reset Primal${NC}"
  echo ""
  echo "Connection strings:"
  echo "  Admin: postgresql://doadmin:***@$DB_HOST:$DB_PORT/$DB_NAME"
  echo "  App:   postgresql://reset_primal_app:***@$DB_HOST:$DB_PORT/$DB_NAME"
  echo ""
}

# Run main
main
