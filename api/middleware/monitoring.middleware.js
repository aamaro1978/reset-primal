/**
 * Monitoring Middleware - Reset Primal
 *
 * Tracks request metrics, response times, and errors
 * Publishes to CloudWatch for monitoring
 */

const { publishMetric } = require('../../config/monitoring');
const { loggers, addRequestContext } = require('../../config/logging');

const logger = loggers.api;

/**
 * Request/response monitoring middleware
 */
const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.id || req.headers['x-request-id'] || generateRequestId();

  // Add context to logger
  const requestLogger = addRequestContext(logger, requestId, req.user?.id, req.ip);

  // Attach to request for use in handlers
  req.logger = requestLogger;
  req.requestId = requestId;

  // Capture original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Track response
  res.json = function (data) {
    recordMetrics(req, res, startTime, requestLogger);
    return originalJson.call(this, data);
  };

  res.send = function (data) {
    recordMetrics(req, res, startTime, requestLogger);
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Record metrics for a response
 */
const recordMetrics = (req, res, startTime, requestLogger) => {
  const duration = Date.now() - startTime;
  const statusCode = res.statusCode || 200;

  // Log the request
  requestLogger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    statusCode,
    durationMs: duration,
    responseSize: res.get('content-length') || 0,
  });

  // Publish metrics to CloudWatch (async, don't block)
  publishMetricsAsync(req, statusCode, duration);

  // Track slow requests
  if (duration > 1000) {
    requestLogger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`, {
      slow: true,
      durationMs: duration,
    });
  }

  // Track errors
  if (statusCode >= 400) {
    requestLogger.warn(`Request error: ${req.method} ${req.path} returned ${statusCode}`, {
      error: true,
      statusCode,
      durationMs: duration,
    });
  }
};

/**
 * Publish metrics asynchronously without blocking response
 */
const publishMetricsAsync = async (req, statusCode, duration) => {
  try {
    const endpoint = req.path.split('/').filter(Boolean)[0] || 'root';
    const isError = statusCode >= 400;

    // Publish response time metric
    await publishMetric('reset-primal/app', 'ResponseTime', duration, 'Milliseconds', {
      endpoint,
      method: req.method,
      statusCode,
    });

    // Publish error metric if error
    if (isError) {
      await publishMetric('reset-primal/app', 'ErrorCount', 1, 'Count', {
        endpoint,
        statusCode,
      });
    }

    // Publish request count metric
    await publishMetric('reset-primal/app', 'RequestCount', 1, 'Count', {
      endpoint,
      method: req.method,
    });
  } catch (error) {
    console.error('Failed to publish metrics:', error);
    // Silently fail - don't block request
  }
};

/**
 * Health check middleware
 */
const healthCheckMiddleware = async (req, res) => {
  try {
    const startTime = Date.now();
    const components = {};

    // Check database
    const dbStart = Date.now();
    try {
      // Simple health check query
      const dbResult = await checkDatabase();
      components.database = {
        status: dbResult ? 'up' : 'down',
        latency_ms: Date.now() - dbStart,
      };
    } catch (error) {
      components.database = {
        status: 'down',
        latency_ms: Date.now() - dbStart,
        error: error.message,
      };
    }

    // Check email service
    const emailStart = Date.now();
    try {
      const emailResult = await checkEmailService();
      components.email = {
        status: emailResult ? 'up' : 'down',
        latency_ms: Date.now() - emailStart,
      };
    } catch (error) {
      components.email = {
        status: 'down',
        latency_ms: Date.now() - emailStart,
        error: error.message,
      };
    }

    // Check GA4
    const ga4Start = Date.now();
    try {
      const ga4Result = await checkGA4();
      components.ga4 = {
        status: ga4Result ? 'up' : 'down',
        latency_ms: Date.now() - ga4Start,
      };
    } catch (error) {
      components.ga4 = {
        status: 'down',
        latency_ms: Date.now() - ga4Start,
        error: error.message,
      };
    }

    // Check webhook system
    const webhookStart = Date.now();
    try {
      const webhookMetrics = await checkWebhookQueue();
      components.webhook = {
        status: webhookMetrics.pending < 1000 ? 'up' : 'degraded',
        processed: webhookMetrics.processed,
        pending: webhookMetrics.pending,
        latency_ms: Date.now() - webhookStart,
      };
    } catch (error) {
      components.webhook = {
        status: 'down',
        latency_ms: Date.now() - webhookStart,
        error: error.message,
      };
    }

    // Check cache
    const cacheStart = Date.now();
    try {
      const cacheMetrics = await checkCache();
      components.cache = {
        status: cacheMetrics.available ? 'up' : 'down',
        hit_rate: cacheMetrics.hitRate,
        latency_ms: Date.now() - cacheStart,
      };
    } catch (error) {
      components.cache = {
        status: 'down',
        latency_ms: Date.now() - cacheStart,
        error: error.message,
      };
    }

    // Determine overall status
    const downCount = Object.values(components).filter((c) => c.status === 'down').length;
    const overallStatus = downCount === 0 ? 'healthy' : downCount <= 2 ? 'degraded' : 'unhealthy';
    const totalTime = Date.now() - startTime;

    // Publish health status metric
    await publishMetric(
      'reset-primal/app',
      'HealthStatus',
      overallStatus === 'healthy' ? 1 : 0,
      'None'
    );

    // Return health status
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components,
      totalResponseTimeMs: totalTime,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
};

/**
 * Component health check functions
 */
const checkDatabase = async () => {
  // Implement database connection test
  // Return true/false based on connectivity
  return true;
};

const checkEmailService = async () => {
  // Implement email service health check
  // Could check SendGrid status or test send capability
  return true;
};

const checkGA4 = async () => {
  // Implement GA4 API health check
  return true;
};

const checkWebhookQueue = async () => {
  // Check webhook queue status
  // Return { processed, pending }
  return {
    processed: 0,
    pending: 0,
  };
};

const checkCache = async () => {
  // Check Redis/cache status
  // Return { available, hitRate }
  return {
    available: true,
    hitRate: 0.85,
  };
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  monitoringMiddleware,
  healthCheckMiddleware,
  publishMetricsAsync,
};
