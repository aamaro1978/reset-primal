/**
 * Railway Database Configuration
 *
 * Railway automatically injects DATABASE_URL environment variable
 * that points to the provisioned PostgreSQL database.
 *
 * Connection string format:
 * postgresql://user:password@host:port/database?sslmode=require
 */

module.exports = {
  // Connection pool configuration
  pool: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // SSL/TLS configuration
  ssl: {
    rejectUnauthorized: false, // Railway uses self-signed certs for database
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },

  // Database information
  database: {
    type: 'PostgreSQL',
    version: '15+',
    provider: 'Railway',
  },

  // Setup instructions for Railway
  instructions: `
    1. Create PostgreSQL database in Railway:
       - Go to railway.app → Your Project
       - Click "New Service" → Database → PostgreSQL
       - Wait for deployment to complete

    2. Connect application:
       - Railway automatically adds DATABASE_URL environment variable
       - This config is loaded by api/config/database.js

    3. Run migrations:
       - After first deploy, run: npm run prisma:migrate
       - Or use Railway Shell: npx prisma migrate deploy

    4. Verify connection:
       - Check Railway logs for "Database connected" message
       - Visit /health endpoint to verify

    5. Backup strategy:
       - Railway provides automatic daily backups
       - Access via Railway Dashboard → Database → Backups tab
  `,
};
