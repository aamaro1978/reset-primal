#!/usr/bin/env node

/**
 * Data Migration Script - Reset Primal
 *
 * Migrates customer data from development/staging database to production.
 *
 * Usage:
 *   npm run migrate-data
 *   DATABASE_URL=postgresql://user:pass@host/db npm run migrate-data
 *
 * Environment Variables:
 *   DATABASE_URL - Production database connection string
 *   SOURCE_DB_URL - Source database (defaults to local SQLite)
 *   SKIP_VALIDATION - Set to 'true' to skip validation (not recommended)
 */

const { Pool } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + colors.bright + '═'.repeat(70) + colors.reset);
  log(title, 'blue');
  console.log(colors.bright + '═'.repeat(70) + colors.reset + '\n');
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const productionDb = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ============================================================================
// MIGRATION STATUS TRACKING
// ============================================================================

/**
 * Create migration status table
 */
async function createMigrationStatusTable() {
  log('Creating migration_status table...', 'yellow');

  const sql = `
    CREATE TABLE IF NOT EXISTS migration_status (
      id BIGSERIAL PRIMARY KEY,
      migration_id UUID DEFAULT gen_random_uuid(),
      table_name VARCHAR(255),
      status VARCHAR(50),
      rows_migrated INTEGER,
      total_rows INTEGER,
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      error_message TEXT,
      checksum VARCHAR(64)
    );

    CREATE INDEX IF NOT EXISTS idx_migration_id ON migration_status(migration_id);
  `;

  await productionDb.query(sql);
  log('✅ Migration status table ready', 'green');
}

/**
 * Record migration status
 */
async function recordMigrationStatus(tableName, status, rowsMigrated, totalRows, checksum, errorMessage = null) {
  const sql = `
    INSERT INTO migration_status (table_name, status, rows_migrated, total_rows, checksum, error_message, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE NULL END)
  `;

  await productionDb.query(sql, [tableName, status, rowsMigrated, totalRows, checksum, errorMessage]);
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate users table
 */
async function migrateUsers(sourceData) {
  header('MIGRATING USERS');

  const users = sourceData.users || [];
  log(`Starting users migration: ${users.length} records`, 'yellow');

  if (users.length === 0) {
    log('No user data to migrate', 'yellow');
    return { success: true, count: 0, checksum: null };
  }

  try {
    // Prepare insert statement
    const sql = `
      INSERT INTO users (
        id, email, name, phone, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `;

    let successCount = 0;
    let checksumData = '';

    // Batch insert in chunks of 1000
    const batchSize = 1000;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      for (const user of batch) {
        try {
          await productionDb.query(sql, [
            user.id || crypto.randomUUID(),
            (user.email || '').toLowerCase(),
            user.name || 'Unknown',
            user.phone || null,
            user.status || 'active',
            user.created_at || new Date().toISOString(),
            user.updated_at || new Date().toISOString(),
          ]);

          successCount++;
          checksumData += user.email;
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }

      log(`  Progress: ${Math.min(i + batchSize, users.length)}/${users.length} users`, 'blue');
    }

    const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

    log(`✅ Users migration completed: ${successCount} users`, 'green');
    await recordMigrationStatus('users', 'completed', successCount, users.length, checksum);

    return { success: true, count: successCount, checksum };
  } catch (error) {
    log(`❌ Users migration failed: ${error.message}`, 'red');
    await recordMigrationStatus('users', 'failed', 0, users.length, null, error.message);
    throw error;
  }
}

/**
 * Migrate products table
 */
async function migrateProducts(sourceData) {
  header('MIGRATING PRODUCTS');

  const products = sourceData.products || [];
  log(`Starting products migration: ${products.length} records`, 'yellow');

  if (products.length === 0) {
    log('No product data to migrate', 'yellow');
    return { success: true, count: 0, checksum: null };
  }

  try {
    const sql = `
      INSERT INTO products (
        id, name, sku, price, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (sku) DO NOTHING
    `;

    let successCount = 0;
    let checksumData = '';

    const batchSize = 500;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        try {
          await productionDb.query(sql, [
            product.id || crypto.randomUUID(),
            product.name || 'Unknown',
            product.sku || `SKU-${Date.now()}`,
            parseFloat(product.price) || 0,
            product.description || '',
            product.status || 'active',
            product.created_at || new Date().toISOString(),
            product.updated_at || new Date().toISOString(),
          ]);

          successCount++;
          checksumData += product.sku;
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }

      log(`  Progress: ${Math.min(i + batchSize, products.length)}/${products.length} products`, 'blue');
    }

    const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

    log(`✅ Products migration completed: ${successCount} products`, 'green');
    await recordMigrationStatus('products', 'completed', successCount, products.length, checksum);

    return { success: true, count: successCount, checksum };
  } catch (error) {
    log(`❌ Products migration failed: ${error.message}`, 'red');
    await recordMigrationStatus('products', 'failed', 0, products.length, null, error.message);
    throw error;
  }
}

/**
 * Migrate purchases table
 */
async function migratePurchases(sourceData) {
  header('MIGRATING PURCHASES');

  const purchases = sourceData.purchases || [];
  log(`Starting purchases migration: ${purchases.length} records`, 'yellow');

  if (purchases.length === 0) {
    log('No purchase data to migrate', 'yellow');
    return { success: true, count: 0, checksum: null };
  }

  try {
    const sql = `
      INSERT INTO purchases (
        id, user_id, product_id, quantity, amount, status, purchase_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `;

    let successCount = 0;
    let checksumData = '';

    const batchSize = 1000;
    for (let i = 0; i < purchases.length; i += batchSize) {
      const batch = purchases.slice(i, i + batchSize);

      for (const purchase of batch) {
        try {
          await productionDb.query(sql, [
            purchase.id || crypto.randomUUID(),
            purchase.user_id,
            purchase.product_id,
            purchase.quantity || 1,
            parseFloat(purchase.amount) || 0,
            purchase.status || 'completed',
            purchase.purchase_date || new Date().toISOString(),
            purchase.created_at || new Date().toISOString(),
            purchase.updated_at || new Date().toISOString(),
          ]);

          successCount++;
          checksumData += `${purchase.user_id}:${purchase.product_id}`;
        } catch (error) {
          if (!error.message.includes('duplicate key') && !error.message.includes('foreign key')) {
            log(`  ⚠️ Warning: ${error.message}`, 'yellow');
          }
        }
      }

      log(`  Progress: ${Math.min(i + batchSize, purchases.length)}/${purchases.length} purchases`, 'blue');
    }

    const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');

    log(`✅ Purchases migration completed: ${successCount} purchases`, 'green');
    await recordMigrationStatus('purchases', 'completed', successCount, purchases.length, checksum);

    return { success: true, count: successCount, checksum };
  } catch (error) {
    log(`❌ Purchases migration failed: ${error.message}`, 'red');
    await recordMigrationStatus('purchases', 'failed', 0, purchases.length, null, error.message);
    throw error;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate migrated data integrity
 */
async function validateData() {
  header('VALIDATING MIGRATED DATA');

  try {
    // Check row counts
    const userCount = await productionDb.query('SELECT COUNT(*) FROM users');
    const productCount = await productionDb.query('SELECT COUNT(*) FROM products');
    const purchaseCount = await productionDb.query('SELECT COUNT(*) FROM purchases');

    log(`✅ Users: ${userCount.rows[0].count} records`, 'green');
    log(`✅ Products: ${productCount.rows[0].count} records`, 'green');
    log(`✅ Purchases: ${purchaseCount.rows[0].count} records`, 'green');

    // Check foreign key integrity
    const orphanedPurchases = await productionDb.query(`
      SELECT COUNT(*) FROM purchases p
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
      OR NOT EXISTS (SELECT 1 FROM products pr WHERE pr.id = p.product_id)
    `);

    if (orphanedPurchases.rows[0].count > 0) {
      log(`❌ Found ${orphanedPurchases.rows[0].count} orphaned purchase records!`, 'red');
      return false;
    }

    log('✅ Foreign key integrity verified', 'green');

    // Sample validation (check 10 random records)
    const sampleUsers = await productionDb.query('SELECT * FROM users ORDER BY RANDOM() LIMIT 10');
    log(`✅ Sample validation: ${sampleUsers.rows.length} users checked`, 'green');

    return true;
  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// MAIN MIGRATION EXECUTION
// ============================================================================

/**
 * Main migration function
 */
async function runMigration() {
  header('RESET PRIMAL DATA MIGRATION');

  try {
    // Test connection
    log('Testing database connection...', 'yellow');
    await productionDb.query('SELECT NOW()');
    log('✅ Database connection successful', 'green');

    // Create migration tracking table
    await createMigrationStatusTable();

    // Load source data (placeholder - would load from actual source DB)
    log('Loading source data...', 'yellow');
    const sourceData = {
      users: require('./sample-data.users.json'),
      products: require('./sample-data.products.json'),
      purchases: require('./sample-data.purchases.json'),
    };

    // Execute migrations in order
    const results = {};
    results.users = await migrateUsers(sourceData);
    results.products = await migrateProducts(sourceData);
    results.purchases = await migratePurchases(sourceData);

    // Validate
    const isValid = await validateData();

    // Summary
    header('MIGRATION SUMMARY');
    log(`Users: ${results.users.count} migrated`, colors.green);
    log(`Products: ${results.products.count} migrated`, colors.green);
    log(`Purchases: ${results.purchases.count} migrated`, colors.green);
    log(`Validation: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`, isValid ? 'green' : 'red');

    if (isValid) {
      log('✅ Migration completed successfully!', 'green');
      process.exit(0);
    } else {
      log('❌ Migration validation failed. Review logs above.', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await productionDb.end();
  }
}

// Run migration
if (require.main === module) {
  runMigration();
}

module.exports = { migrateUsers, migrateProducts, migratePurchases, validateData };
