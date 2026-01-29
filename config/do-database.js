/**
 * Database Configuration - DigitalOcean
 * 
 * Managed PostgreSQL 15+ configuration for DigitalOcean
 * Simpler than AWS RDS as DO handles provisioning
 */

const fs = require('fs');

/**
 * DigitalOcean Database Configuration
 */
const doDatabaseConfig = {
  // Connection settings
  connection: {
    host: process.env.DO_DB_HOST || 'db-postgresql-nyc3-12345-do-user-123456-0.b.db.ondigitalocean.com',
    port: parseInt(process.env.DO_DB_PORT || '25060'),
    database: process.env.DO_DB_NAME || 'reset_primal',
    user: process.env.DO_DB_USER || 'doadmin',
    password: process.env.DO_DB_PASSWORD, // REQUIRED - from env var
    ssl: {
      rejectUnauthorized: true,
      // CA certificate path (optional, but recommended)
      ca: process.env.DO_DB_CA_PATH ? fs.readFileSync(process.env.DO_DB_CA_PATH) : undefined
    }
  },

  // Connection pool settings
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '10'),
    max: parseInt(process.env.DB_POOL_MAX || '100'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Query timeout
  statement_timeout: 30000,

  // Application name for monitoring
  application_name: 'reset-primal-app',

  // RBAC Roles
  rbac: {
    appRole: process.env.DO_DB_APP_ROLE || 'reset_primal_app',
    appPassword: process.env.DO_DB_APP_PASSWORD, // Should be different from admin
    
    reportingRole: process.env.DO_DB_REPORTING_ROLE || 'reset_primal_reporting',
    reportingPassword: process.env.DO_DB_REPORTING_PASSWORD,
    
    adminRole: process.env.DO_DB_ADMIN_ROLE || 'doadmin', // DigitalOcean admin user
  },

  // SSL/TLS Configuration
  security: {
    ssl: true,
    sslMode: 'require', // DigitalOcean requires SSL
    tlsVersion: '1.2',
  },

  // Backup configuration
  backups: {
    enabled: true,
    // DigitalOcean Managed Databases handle backups automatically
    // Daily automatic backups are included
    // Retention: 30 days (default)
    spaces: {
      bucket: process.env.DO_SPACES_BUCKET || 'resetprimal-backups',
      region: process.env.DO_SPACES_REGION || 'sfo3',
      accessKey: process.env.DO_SPACES_KEY,
      secretKey: process.env.DO_SPACES_SECRET,
      // Backup schedule: Daily at 01:00 UTC
      schedule: '0 1 * * *'
    }
  },

  // Monitoring
  monitoring: {
    enabled: true,
    metricsNamespace: 'reset-primal/database',
    slowQueryLog: {
      enabled: true,
      threshold: 1000, // milliseconds
    }
  },

  // Replica configuration (optional)
  replica: {
    enabled: process.env.DO_DB_REPLICA_ENABLED === 'true',
    // If enabling replica, use secondary cluster
    // host: process.env.DO_DB_REPLICA_HOST,
    // port: process.env.DO_DB_REPLICA_PORT,
  }
};

/**
 * Get database connection string
 */
function getConnectionString() {
  const { connection } = doDatabaseConfig;
  return `postgresql://${connection.user}:${connection.password}@${connection.host}:${connection.port}/${connection.database}?sslmode=require`;
}

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];

  if (!doDatabaseConfig.connection.password) {
    errors.push('DO_DB_PASSWORD environment variable is required');
  }

  if (!process.env.DO_SPACES_KEY) {
    errors.push('DO_SPACES_KEY environment variable is required for backups');
  }

  if (!process.env.DO_SPACES_SECRET) {
    errors.push('DO_SPACES_SECRET environment variable is required for backups');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    throw new Error('Invalid database configuration');
  }
}

/**
 * Get DigitalOcean API token
 */
function getDigitalOceanToken() {
  const token = process.env.DIGITALOCEAN_TOKEN;
  if (!token) {
    throw new Error('DIGITALOCEAN_TOKEN environment variable is required');
  }
  return token;
}

/**
 * Test connection
 */
async function testConnection(pool) {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✓ Database connection successful');
    console.log(`  Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  doDatabaseConfig,
  getConnectionString,
  validateConfig,
  getDigitalOceanToken,
  testConnection,
};
