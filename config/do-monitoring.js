/**
 * DigitalOcean Monitoring Configuration
 * 
 * Uses DigitalOcean built-in monitoring for metrics
 * Replaces AWS CloudWatch with DO's native monitoring
 */

/**
 * Metrics namespace
 */
const METRICS_NAMESPACE = 'reset-primal';

/**
 * DigitalOcean Monitoring Configuration
 */
const doMonitoringConfig = {
  enabled: process.env.MONITORING_ENABLED !== 'false',
  
  // DigitalOcean API configuration
  api: {
    token: process.env.DIGITALOCEAN_TOKEN,
    endpoint: 'https://api.digitalocean.com/v2',
  },

  // Metrics collection
  metrics: {
    // Database metrics
    database: {
      cpuPercent: 'database_cpu_percent',
      memoryPercent: 'database_memory_percent',
      diskPercent: 'database_disk_percent',
      replicationLag: 'database_replication_lag_bytes',
      connections: 'database_connections',
      queryTime: 'database_query_time_ms',
    },

    // Application metrics
    application: {
      responseTime: 'app_response_time_ms',
      requestCount: 'app_request_count',
      errorCount: 'app_error_count',
      errorRate: 'app_error_rate_percent',
    },

    // System metrics
    system: {
      cpuUsage: 'system_cpu_usage',
      memoryUsage: 'system_memory_usage',
      diskUsage: 'system_disk_usage',
    },

    // Business metrics
    business: {
      transactionCount: 'business_transaction_count',
      revenueTotal: 'business_revenue_total',
    },
  },

  // Monitoring intervals (in seconds)
  intervals: {
    database: 60,      // Every 1 minute
    application: 30,   // Every 30 seconds
    system: 60,        // Every 1 minute
    business: 3600,    // Every 1 hour
  },

  // Alert thresholds
  thresholds: {
    database: {
      cpuHigh: 80,
      cpuCritical: 95,
      memoryHigh: 85,
      memoryCritical: 95,
      connectionHigh: 150,
      connectionCritical: 190,
      replicationLagSeconds: 1,
      queryTimeMs: 5000,
    },
    application: {
      errorRateHigh: 5,      // 5%
      errorRateCritical: 10, // 10%
      responseTimeHigh: 500, // ms
      responseTimeCritical: 2000, // ms
    },
    system: {
      diskUsageHigh: 85,
      diskUsageCritical: 95,
    },
  },

  // Health check configuration
  healthCheck: {
    interval: 60, // seconds
    timeout: 5,   // seconds
    endpoints: [
      '/health/ping',
      '/health/readiness',
      '/health/live',
      '/health/metrics',
    ],
  },
};

/**
 * Publish metric to DigitalOcean (mock for local development)
 * In production, would use DigitalOcean monitoring API
 */
async function publishMetric(metricName, value, unit = 'Count', tags = {}) {
  try {
    if (!doMonitoringConfig.enabled) {
      return false;
    }

    // In local development, just log the metric
    console.log(`[METRIC] ${metricName}: ${value} ${unit}`, tags);

    // In production, would call DO API:
    // POST /v2/monitoring/metrics/... with value and tags

    return true;
  } catch (error) {
    console.error(`[ERROR] Failed to publish metric: ${error.message}`);
    return false;
  }
}

/**
 * Publish database metrics
 */
async function publishDatabaseMetrics(metrics) {
  const { cpuPercent, memoryPercent, connections, queryTime } = metrics;

  await publishMetric('database_cpu_percent', cpuPercent, 'Percent', {
    component: 'database',
  });

  await publishMetric('database_memory_percent', memoryPercent, 'Percent', {
    component: 'database',
  });

  await publishMetric('database_connections', connections, 'Count', {
    component: 'database',
  });

  await publishMetric('database_query_time_ms', queryTime, 'Milliseconds', {
    component: 'database',
  });
}

/**
 * Publish application metrics
 */
async function publishApplicationMetrics(metrics) {
  const { responseTime, requestCount, errorCount, errorRate } = metrics;

  await publishMetric('app_response_time_ms', responseTime, 'Milliseconds', {
    component: 'application',
  });

  await publishMetric('app_request_count', requestCount, 'Count', {
    component: 'application',
  });

  await publishMetric('app_error_count', errorCount, 'Count', {
    component: 'application',
  });

  await publishMetric('app_error_rate_percent', errorRate, 'Percent', {
    component: 'application',
  });
}

/**
 * Get current system metrics
 */
function getSystemMetrics() {
  const cpuUsage = process.cpuUsage();
  const memUsage = process.memoryUsage();

  return {
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      rss: memUsage.rss,
      external: memUsage.external,
    },
    uptime: process.uptime(),
  };
}

/**
 * Validate monitoring configuration
 */
function validateConfiguration() {
  if (!doMonitoringConfig.enabled) {
    console.warn('[WARNING] Monitoring is disabled');
    return true;
  }

  if (!doMonitoringConfig.api.token) {
    console.error('[ERROR] DIGITALOCEAN_TOKEN is required for monitoring');
    return false;
  }

  return true;
}

module.exports = {
  METRICS_NAMESPACE,
  doMonitoringConfig,
  publishMetric,
  publishDatabaseMetrics,
  publishApplicationMetrics,
  getSystemMetrics,
  validateConfiguration,
};
