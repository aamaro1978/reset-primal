/**
 * Database Connection Validation & Testing Script
 *
 * Tests:
 * 1. Direct PostgreSQL connection
 * 2. PgBouncer pooled connection
 * 3. Connection latency measurement
 * 4. Concurrent connection handling
 * 5. Connection timeout scenarios
 * 6. Graceful shutdown handling
 *
 * Usage:
 *   node scripts/test-database-connection.js
 *   DATABASE_HOST=prod.db.com npm run test:db-connection
 */

const { Client } = require('pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const config = require('./config/database.prod');

// Colors for output
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
  console.log('\n' + colors.bright + '═'.repeat(60) + colors.reset);
  log(title, 'blue');
  console.log(colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

async function testDirectConnection() {
  header('TEST 1: Direct PostgreSQL Connection');

  const client = new Client({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    user: config.postgresql.user,
    password: config.postgresql.password,
    connectionTimeoutMillis: 10000,
  });

  try {
    log('Connecting to PostgreSQL...', 'yellow');
    const start = Date.now();
    await client.connect();
    const latency = Date.now() - start;

    log(`✅ Connected successfully (${latency}ms)`, 'green');

    // Run test query
    const result = await client.query('SELECT NOW() as server_time, version() as pg_version');
    log(`Server Time: ${result.rows[0].server_time}`, 'green');
    log(`PostgreSQL Version: ${result.rows[0].pg_version.split(',')[0]}`, 'green');

    await client.end();
    return true;
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPgBouncerConnection() {
  header('TEST 2: PgBouncer Pooled Connection');

  const pool = new Pool({
    host: config.pgbouncer.host,
    port: config.pgbouncer.port,
    database: config.pgbouncer.database,
    user: config.pgbouncer.user,
    password: config.pgbouncer.password,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  try {
    log('Connecting via PgBouncer...', 'yellow');
    const start = Date.now();
    const client = await pool.connect();
    const latency = Date.now() - start;

    log(`✅ PgBouncer connection successful (${latency}ms)`, 'green');

    // Query through pool
    const result = await client.query('SELECT 1 as test');
    log(`Query result: ${result.rows[0].test}`, 'green');

    client.release();
    await pool.end();
    return true;
  } catch (error) {
    log(`❌ PgBouncer connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testConnectionLatency() {
  header('TEST 3: Connection Latency Measurement');

  const pool = new Pool({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    user: config.postgresql.user,
    password: config.postgresql.password,
  });

  const samples = 10;
  const latencies = [];

  log(`Running ${samples} connection attempts...`, 'yellow');

  for (let i = 0; i < samples; i++) {
    try {
      const start = Date.now();
      const client = await pool.connect();
      const latency = Date.now() - start;
      latencies.push(latency);
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      log(`  Sample ${i + 1}: ❌ Failed`, 'red');
    }
  }

  if (latencies.length > 0) {
    const sorted = latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const avg = latencies.reduce((a, b) => a + b) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);

    log(`✅ ${latencies.length}/${samples} connections successful`, 'green');
    log(`  Min: ${min}ms`, 'green');
    log(`  Avg: ${avg.toFixed(2)}ms`, 'green');
    log(`  p50: ${p50}ms`, 'green');
    log(`  p95: ${p95}ms`, 'green');
    log(`  p99: ${p99}ms`, 'green');
    log(`  Max: ${max}ms`, 'green');

    if (p95 < 50) {
      log('✅ Target met: p95 < 50ms', 'green');
    } else {
      log(`⚠️ Warning: p95 (${p95}ms) exceeds target (50ms)`, 'yellow');
    }
  }

  await pool.end();
  return latencies.length === samples;
}

async function testConcurrentConnections() {
  header('TEST 4: Concurrent Connection Handling');

  const pool = new Pool({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    user: config.postgresql.user,
    password: config.postgresql.password,
    max: 50,
  });

  const concurrentCount = 50;
  log(`Creating ${concurrentCount} concurrent connections...`, 'yellow');

  try {
    const start = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentCount; i++) {
      promises.push(
        pool.connect().then(async (client) => {
          const result = await client.query('SELECT pg_sleep(0.1), $1 as id', [i]);
          client.release();
          return result.rows[0].id;
        })
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    log(`✅ ${results.length} concurrent connections successful (${duration}ms)`, 'green');

    if (results.length === concurrentCount) {
      log(`✅ All ${concurrentCount} connections completed successfully`, 'green');
    }

    await pool.end();
    return results.length === concurrentCount;
  } catch (error) {
    log(`❌ Concurrent connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testConnectionTimeout() {
  header('TEST 5: Connection Timeout Handling');

  const client = new Client({
    host: '192.0.2.1', // Non-routable IP to trigger timeout
    port: 5432,
    database: 'test',
    user: 'test',
    password: 'test',
    connectionTimeoutMillis: 1000,
  });

  log('Attempting connection to unreachable host (should timeout)...', 'yellow');

  try {
    const start = Date.now();
    await client.connect();
    log('❌ Connection should have timed out', 'red');
    return false;
  } catch (error) {
    const duration = Date.now() - start;
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || duration >= 1000) {
      log(`✅ Connection timed out as expected (${duration}ms)`, 'green');
      log(`   Error: ${error.code}`, 'green');
      return true;
    } else {
      log(`⚠️ Error but not timeout: ${error.message}`, 'yellow');
      return false;
    }
  }
}

async function testQueryExecution() {
  header('TEST 6: Query Execution & Performance');

  const pool = new Pool({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    user: config.postgresql.user,
    password: config.postgresql.password,
  });

  try {
    const client = await pool.connect();

    // Test 1: Simple SELECT
    log('Running 100 simple queries...', 'yellow');
    const start1 = Date.now();
    for (let i = 0; i < 100; i++) {
      await client.query('SELECT 1');
    }
    const duration1 = Date.now() - start1;
    log(`✅ 100 queries completed in ${duration1}ms (avg: ${(duration1 / 100).toFixed(2)}ms each)`, 'green');

    // Test 2: Prepared statement
    log('Running 50 prepared statement queries...', 'yellow');
    const start2 = Date.now();
    for (let i = 0; i < 50; i++) {
      await client.query('SELECT $1 as val', [i]);
    }
    const duration2 = Date.now() - start2;
    log(`✅ Prepared statements completed in ${duration2}ms`, 'green');

    // Test 3: Complex query
    log('Running complex aggregation query...', 'yellow');
    const start3 = Date.now();
    const result = await client.query(`
      SELECT
        COUNT(*) as count,
        NOW() as server_time,
        pg_database_size(current_database()) as db_size
    `);
    const duration3 = Date.now() - start3;
    log(`✅ Complex query completed in ${duration3}ms`, 'green');
    log(`   Database size: ${(result.rows[0].db_size / 1024 / 1024).toFixed(2)}MB`, 'green');

    client.release();
    await pool.end();
    return true;
  } catch (error) {
    log(`❌ Query execution test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGracefulShutdown() {
  header('TEST 7: Graceful Shutdown');

  const pool = new Pool({
    host: config.postgresql.host,
    port: config.postgresql.port,
    database: config.postgresql.database,
    user: config.postgresql.user,
    password: config.postgresql.password,
    max: 5,
  });

  try {
    log('Creating connections...', 'yellow');
    const client1 = await pool.connect();
    const client2 = await pool.connect();

    log('Releasing connections...', 'yellow');
    client1.release();
    client2.release();

    log('Ending pool...', 'yellow');
    const start = Date.now();
    await pool.end();
    const duration = Date.now() - start;

    log(`✅ Pool closed gracefully in ${duration}ms`, 'green');
    return true;
  } catch (error) {
    log(`❌ Graceful shutdown failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + colors.bright + '╔═══════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + '║     RESET PRIMAL - DATABASE CONNECTION TEST SUITE          ║' + colors.reset);
  console.log(colors.bright + '╚═══════════════════════════════════════════════════════════╝' + colors.reset);

  const results = [];

  results.push({ name: 'Direct PostgreSQL Connection', passed: await testDirectConnection() });
  results.push({ name: 'PgBouncer Pooled Connection', passed: await testPgBouncerConnection() });
  results.push({ name: 'Connection Latency', passed: await testConnectionLatency() });
  results.push({ name: 'Concurrent Connections', passed: await testConcurrentConnections() });
  results.push({ name: 'Connection Timeout', passed: await testConnectionTimeout() });
  results.push({ name: 'Query Execution', passed: await testQueryExecution() });
  results.push({ name: 'Graceful Shutdown', passed: await testGracefulShutdown() });

  // Summary
  header('TEST SUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
  });

  console.log('\n' + colors.bright + '─'.repeat(60) + colors.reset);
  if (passed === total) {
    log(`✅ ALL ${total} TESTS PASSED`, 'green');
  } else {
    log(`⚠️ ${passed}/${total} TESTS PASSED`, 'yellow');
  }
  console.log(colors.bright + '─'.repeat(60) + colors.reset + '\n');

  process.exit(passed === total ? 0 : 1);
}

// Run all tests
runAllTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
