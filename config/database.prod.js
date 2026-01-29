/**
 * Production Database Configuration
 * PostgreSQL 15+ with PgBouncer connection pooling
 *
 * Environment Variables Required:
 * - DATABASE_HOST: PostgreSQL host
 * - DATABASE_PORT: PostgreSQL port (default: 5432)
 * - DATABASE_NAME: Database name (reset_primal_prod)
 * - DATABASE_USER: Application user (app_user)
 * - DATABASE_PASSWORD: Stored in AWS Secrets Manager
 * - PGBOUNCER_HOST: PgBouncer host (usually same as app)
 * - PGBOUNCER_PORT: PgBouncer port (default: 6432)
 */

const crypto = require('crypto');

const config = {
  // Direct PostgreSQL Connection (for migrations and admin tasks)
  postgresql: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'reset_primal_prod',
    user: process.env.DATABASE_USER || 'app_user',
    password: process.env.DATABASE_PASSWORD,
    // SSL Configuration
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_CERT,
      cert: process.env.DATABASE_CLIENT_CERT,
      key: process.env.DATABASE_CLIENT_KEY,
    },
    // Connection Parameters
    statement_timeout: 30000, // 30 seconds
    lock_timeout: 10000, // 10 seconds
    idle_in_transaction_session_timeout: 60000, // 60 seconds
    connect_timeout: 10,
  },

  // PgBouncer Connection Pool (for application)
  pgbouncer: {
    host: process.env.PGBOUNCER_HOST || process.env.DATABASE_HOST || 'localhost',
    port: process.env.PGBOUNCER_PORT || 6432,
    database: process.env.DATABASE_NAME || 'reset_primal_prod',
    user: process.env.DATABASE_USER || 'app_user',
    password: process.env.DATABASE_PASSWORD,
    // Pool Configuration (managed by PgBouncer)
    application_name: 'reset-primal-app',
    // Connection Pooling Parameters
    min_pool_size: 10,
    max_pool_size: 100,
    default_pool_size: 25,
    pool_mode: 'transaction',
    reserve_pool_size: 5,
    reserve_pool_timeout: 3,
    max_client_conn: 100,
    max_user_connections: 50,
    max_db_connections: 100,
    connect_timeout: 600,
    server_idle_timeout: 600,
    query_timeout: 30000,
    idle_transaction_timeout: 60000,
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 1 * * *', // 01:00 UTC daily
    retention_days: 30,
    backup_dir: '/var/lib/postgresql/backups',
    s3_bucket: 'reset-primal-backups-prod',
    s3_region: 'us-east-1',
    s3_prefix: 'database/',
    compression: 'gzip',
    encryption: true, // KMS encryption
    kms_key_id: process.env.AWS_KMS_KEY_ID,
    wal_archiving: true,
    wal_level: 'replica', // For WAL archiving
  },

  // Monitoring Configuration
  monitoring: {
    enabled: true,
    metrics_interval: 60000, // 60 seconds
    cloudwatch_namespace: 'ResetPrimal/Database',
    enable_slow_query_log: true,
    slow_query_threshold: 1000, // 1 second
    log_statement: 'all',
    log_duration: true,
    log_connections: true,
    log_disconnections: true,
    log_lock_waits: true,
    log_statement_stats: false, // Performance hit, use only if needed
  },

  // Security Configuration
  security: {
    require_ssl: true,
    ssl_cert_recheck: 0,
    max_failed_login_attempts: 5,
    connection_limit_per_user: 20,
    enable_audit_logging: true,
    audit_table: 'audit_logs',
    mask_sensitive_fields: true,
  },

  // Performance Tuning (PostgreSQL Configuration)
  postgresql_tuning: {
    shared_buffers: '512MB', // 25% of 2GB RAM example
    effective_cache_size: '1536MB', // 75% of 2GB RAM example
    work_mem: '16MB', // 2GB / 200 max_connections / 4
    maintenance_work_mem: '256MB',
    max_connections: 200,
    max_prepared_transactions: 100,
    effective_io_concurrency: 200,
    random_page_cost: 1.1, // For SSD
    log_min_duration_statement: 1000, // Log queries > 1 second
    log_line_prefix: '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ',
  },

  // Application Connection String for Prisma
  getDatabaseUrl: () => {
    const { postgresql } = config;
    const sslMode = postgresql.ssl.rejectUnauthorized ? 'require' : 'disable';
    return `postgresql://${postgresql.user}:${encodeURIComponent(postgresql.password)}@${postgresql.host}:${postgresql.port}/${postgresql.database}?schema=public&sslmode=${sslMode}`;
  },

  // PgBouncer Connection String
  getPgBouncerUrl: () => {
    const { pgbouncer } = config;
    return `postgresql://${pgbouncer.user}:${encodeURIComponent(pgbouncer.password)}@${pgbouncer.host}:${pgbouncer.port}/${pgbouncer.database}?schema=public&sslmode=disable`;
  },

  // Health Check Query
  healthCheckQuery: `
    SELECT
      current_timestamp as server_time,
      version() as pg_version,
      (SELECT count(*) FROM pg_stat_activity) as active_connections
  `,

  // Backup Status Query
  backupStatusQuery: `
    SELECT
      datname as database,
      usename as user,
      (SELECT max(now() - pg_postmaster_start_time()) FROM pg_stat_activity) as uptime,
      (SELECT count(*) FROM pg_stat_activity) as active_connections,
      (SELECT pg_database_size(current_database())) as database_size,
      (SELECT max(write_lag) FROM pg_stat_replication) as replication_lag
  `,

  // Generate random connection string for testing
  generateTestConnection: () => {
    return {
      connectionId: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      user: config.postgresql.user,
      database: config.postgresql.database,
      host: config.postgresql.host,
      port: config.postgresql.port,
    };
  },
};

module.exports = config;
