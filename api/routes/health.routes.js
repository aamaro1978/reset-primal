/**
 * Health Check Routes - Reset Primal
 *
 * Public health status endpoint for monitoring and load balancers
 */

const express = require('express');
const router = express.Router();
const { healthCheckMiddleware } = require('../middleware/monitoring.middleware');

/**
 * GET /health/status
 * Full health check with component details
 * Public endpoint - no authentication required
 * Response time < 1 second
 */
router.get('/health/status', healthCheckMiddleware);

/**
 * GET /health/ping
 * Simple liveness probe for load balancers
 * Just checks if service is responsive
 */
router.get('/health/ping', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /health/readiness
 * Readiness probe - checks if service can handle traffic
 * Used by Kubernetes or orchestrators
 */
router.get('/health/readiness', async (req, res) => {
  try {
    // Check if database is accessible
    const dbReady = await checkDatabaseReady();

    if (dbReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not-ready',
        reason: 'Database not accessible',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - checks if service should be restarted
 * Returns 200 if running, 503 if should be restarted
 */
router.get('/health/live', (req, res) => {
  // Check for critical errors that would require restart
  const errors = [];

  if (!checkMemoryUsage()) {
    errors.push('High memory usage');
  }

  if (!checkErrorRate()) {
    errors.push('High error rate');
  }

  if (errors.length === 0) {
    res.status(200).json({
      status: 'live',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'dead',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/metrics
 * Current metrics snapshot
 * Can be used for Prometheus scraping or similar
 */
router.get('/health/metrics', async (req, res) => {
  try {
    const metrics = await getCurrentMetrics();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper functions
 */

const checkDatabaseReady = async () => {
  // Implement database readiness check
  // Should return true if database is accessible and responding
  try {
    // Attempt a simple query
    const result = await global.db?.query('SELECT 1 as ready');
    return result?.rows?.length > 0;
  } catch (error) {
    return false;
  }
};

const checkMemoryUsage = () => {
  // Check if memory usage is within acceptable range
  const used = process.memoryUsage();
  const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

  // Alert if > 85% heap usage
  return heapUsedPercent < 85;
};

const checkErrorRate = () => {
  // Check if recent error rate is acceptable
  // This would be pulled from metrics or request tracking
  // Simplified: always return true for now
  return true;
};

const getCurrentMetrics = async () => {
  const mem = process.memoryUsage();

  return {
    uptime: process.uptime(),
    memory: {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      heapUsedPercent: (mem.heapUsed / mem.heapTotal) * 100,
      rss: mem.rss,
      external: mem.external,
    },
    cpu: {
      usage: process.cpuUsage(),
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = router;
