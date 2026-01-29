#!/usr/bin/env node

/**
 * Failover Manager - Reset Primal
 *
 * Monitors primary database and automatically fails over to replica/standby if primary fails.
 *
 * Features:
 * - Periodic health checks (every 10 seconds)
 * - Automatic failover detection (< 30 seconds)
 * - DNS update on failover
 * - Logging and alerting
 * - Graceful shutdown handling
 *
 * Usage:
 *   npm run failover-manager
 *   CLUSTER_MODE=rds npm run failover-manager
 */

const { Pool } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  clusterMode: process.env.CLUSTER_MODE || 'rds',  // 'rds' or 'manual'
  healthCheckInterval: 10000,  // 10 seconds
  failureThreshold: 3,  // 3 failed checks = failover
  primaryDatabase: {
    host: process.env.PRIMARY_DB_HOST || 'reset-primal-prod.c9akciq32.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'reset_primal_prod',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  standbyDatabase: {
    host: process.env.STANDBY_DB_HOST || 'reset-primal-standby.c9akciq32.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'reset_primal_prod',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  dns: {
    hostedZoneId: process.env.ROUTE53_ZONE_ID,
    recordName: 'db.reset-primal.com',
    ttl: 60,
  },
  alerting: {
    slackWebhook: process.env.SLACK_WEBHOOK,
    email: process.env.ALERT_EMAIL,
  },
};

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

let failureCount = 0;
let lastHealthCheck = null;
let currentPrimary = config.primaryDatabase.host;

/**
 * Perform health check on database
 */
async function healthCheck(dbConfig) {
  try {
    const pool = new Pool({
      ...dbConfig,
      max: 1,
      connectionTimeoutMillis: 5000,
    });

    const result = await pool.query('SELECT NOW() as timestamp, version();');
    await pool.end();

    return {
      healthy: true,
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Check primary database health
 */
async function checkPrimaryHealth() {
  lastHealthCheck = new Date().toISOString();

  const health = await healthCheck(config.primaryDatabase);

  if (health.healthy) {
    failureCount = 0;
    log(`✅ Primary database healthy`, 'green');
    return true;
  } else {
    failureCount++;
    log(`⚠️ Primary database unreachable (${failureCount}/${config.failureThreshold}): ${health.error}`, 'yellow');

    if (failureCount >= config.failureThreshold) {
      log(`🚨 FAILOVER TRIGGERED: Primary database failed ${config.failureThreshold} times`, 'red');
      return false;
    }

    return true;
  }
}

// ============================================================================
// FAILOVER EXECUTION
// ============================================================================

/**
 * RDS Automatic Failover
 */
async function failoverRDS() {
  log('Initiating RDS automatic failover...', 'blue');

  try {
    const rds = new AWS.RDS({ region: 'us-east-1' });

    // Trigger Multi-AZ failover
    const params = {
      DBInstanceIdentifier: 'reset-primal-prod',
    };

    await rds.rebootDBInstance(params, (err, data) => {
      if (err) {
        log(`❌ RDS failover failed: ${err.message}`, 'red');
        return false;
      } else {
        log(`✅ RDS failover initiated, waiting for completion...`, 'green');
        return true;
      }
    });

    // Wait for failover to complete (Multi-AZ typically < 2 minutes)
    await new Promise(resolve => setTimeout(resolve, 120000));

    log(`✅ RDS failover completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ RDS failover failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Manual Failover with DNS Update
 */
async function failoverManualWithDNS() {
  log('Initiating manual failover with DNS update...', 'blue');

  try {
    // Step 1: Verify standby is healthy
    log('Verifying standby database health...', 'yellow');
    const standbyHealth = await healthCheck(config.standbyDatabase);

    if (!standbyHealth.healthy) {
      log(`❌ Standby database also unhealthy: ${standbyHealth.error}`, 'red');
      return false;
    }

    log(`✅ Standby database is healthy`, 'green');

    // Step 2: Update DNS to point to standby
    log('Updating DNS records...', 'yellow');
    await updateDNS(config.standbyDatabase.host);

    // Step 3: Update current primary reference
    currentPrimary = config.standbyDatabase.host;
    failureCount = 0;

    log(`✅ Manual failover completed, now using standby: ${currentPrimary}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Manual failover failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Update Route53 DNS record to point to standby
 */
async function updateDNS(targetHost) {
  return new Promise((resolve, reject) => {
    const route53 = new AWS.Route53();

    const params = {
      HostedZoneId: config.dns.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: config.dns.recordName,
              Type: 'CNAME',
              TTL: config.dns.ttl,
              ResourceRecords: [{ Value: targetHost }],
            },
          },
        ],
      },
    };

    route53.changeResourceRecordSets(params, (err, data) => {
      if (err) {
        log(`❌ DNS update failed: ${err.message}`, 'red');
        reject(err);
      } else {
        log(`✅ DNS updated to point to ${targetHost}`, 'green');
        resolve(data);
      }
    });
  });
}

// ============================================================================
// ALERTING
// ============================================================================

/**
 * Send Slack alert
 */
async function alertSlack(message) {
  if (!config.alerting.slackWebhook) {
    log('⚠️ Slack webhook not configured, skipping notification', 'yellow');
    return;
  }

  try {
    const https = require('https');
    const payload = JSON.stringify({
      text: message,
      channel: '#database-alerts',
      username: 'Failover Manager',
      icon_emoji: ':warning:',
    });

    const options = {
      hostname: 'hooks.slack.com',
      path: config.alerting.slackWebhook,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    };

    https.request(options, (res) => {
      log(`Slack notification sent (status: ${res.statusCode})`, 'green');
    }).end(payload);
  } catch (error) {
    log(`❌ Failed to send Slack alert: ${error.message}`, 'red');
  }
}

/**
 * Send email alert
 */
async function alertEmail(subject, message) {
  if (!config.alerting.email) {
    log('⚠️ Email not configured, skipping notification', 'yellow');
    return;
  }

  log(`📧 Email alert: ${subject}`, 'blue');
  // In production, integrate with AWS SES or SendGrid
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Record health check status
 */
async function recordHealthCheck(status) {
  const logFile = '/var/log/reset-primal-failover.log';

  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    primary: currentPrimary,
    healthy: status,
    failureCount: failureCount,
  }) + '\n';

  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    log(`⚠️ Failed to write log: ${error.message}`, 'yellow');
  }
}

// ============================================================================
// MAIN LOOP
// ============================================================================

async function startMonitoring() {
  log('Starting Failover Manager...', 'blue');
  log(`Primary: ${config.primaryDatabase.host}`, 'blue');
  log(`Standby: ${config.standbyDatabase.host}`, 'blue');
  log(`Check interval: ${config.healthCheckInterval}ms`, 'blue');

  // Health check loop
  setInterval(async () => {
    const isHealthy = await checkPrimaryHealth();

    if (!isHealthy && failureCount >= config.failureThreshold) {
      log(`🚨 FAILOVER TRIGGERED`, 'red');

      let failoverSuccess = false;

      if (config.clusterMode === 'rds') {
        failoverSuccess = await failoverRDS();
      } else {
        failoverSuccess = await failoverManualWithDNS();
      }

      if (failoverSuccess) {
        await alertSlack(`🚀 Database failover completed successfully!\nPrimary: ${currentPrimary}`);
        await alertEmail('Database Failover Completed', `Primary database failed and failover was executed. New primary: ${currentPrimary}`);
      } else {
        await alertSlack(`❌ Database failover FAILED! Manual intervention required!`);
        await alertEmail('Database Failover FAILED', `Primary database failed but automatic failover failed. Immediate action required!`);
      }

      // Reset failure count
      failureCount = 0;
    }

    await recordHealthCheck(isHealthy);
  }, config.healthCheckInterval);
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully...', 'yellow');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully...', 'yellow');
  process.exit(0);
});

// ============================================================================
// START
// ============================================================================

if (require.main === module) {
  startMonitoring().catch((error) => {
    log(`❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  healthCheck,
  checkPrimaryHealth,
  failoverRDS,
  failoverManualWithDNS,
  updateDNS,
  alertSlack,
  alertEmail,
};
