/**
 * Logging Configuration - Reset Primal
 *
 * Structured logging setup using Winston
 * Logs to both console and CloudWatch Logs
 */

const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const env = process.env.NODE_ENV || 'development';
const appVersion = process.env.APP_VERSION || '1.0.0';
const environment = process.env.ENVIRONMENT || env;

/**
 * Log format with JSON structure for CloudWatch parsing
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Remove circular references
    const metaCopy = { ...meta };
    delete metaCopy[Symbol.for('splat')];

    return JSON.stringify({
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      message,
      service: 'reset-primal-api',
      environment,
      version: appVersion,
      ...(Object.keys(metaCopy).length && { metadata: metaCopy })
    });
  })
);

/**
 * Create base logger
 */
const createLogger = (name) => {
  const transports = [];

  // Console transport (always enabled for local debugging)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );

  // File transport for local rotation
  if (env === 'production' || env === 'staging') {
    transports.push(
      new winston.transports.File({
        filename: `/var/log/reset-primal-${name}.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: logFormat
      })
    );
  }

  // CloudWatch Logs transport (production only)
  if (process.env.CLOUDWATCH_ENABLED === 'true' && env === 'production') {
    transports.push(
      new WinstonCloudWatch({
        logGroupName: `/aws/api/${name}`,
        logStreamName: `${environment}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        messageFormatter: ({ level, message, meta }) => {
          return JSON.stringify({
            level: level.toUpperCase(),
            message,
            ...meta
          });
        },
        retentionInDays: name === 'postgres' ? 14 : 30
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
    format: logFormat,
    defaultMeta: {
      service: 'reset-primal',
      environment,
      version: appVersion
    },
    transports
  });
};

/**
 * Create specialized loggers for different components
 */
const loggers = {
  api: createLogger('production'),
  webhook: createLogger('webhook'),
  email: createLogger('email'),
  database: createLogger('postgres'),
  analytics: createLogger('analytics'),
  auth: createLogger('auth')
};

/**
 * Helper function to add request context to logs
 */
const addRequestContext = (logger, requestId, userId, ipAddress) => {
  return logger.child({
    requestId,
    userId,
    ipAddress
  });
};

/**
 * Helper function to add error context
 */
const logError = (logger, errorMessage, error, context = {}) => {
  logger.error(errorMessage, {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    ...context
  });
};

/**
 * Helper function for performance logging
 */
const logPerformance = (logger, operation, durationMs, success = true) => {
  const level = durationMs > 1000 ? 'warn' : 'info';
  const message = `${operation} completed in ${durationMs}ms`;

  logger[level](message, {
    operation,
    durationMs,
    success,
    slowQuery: durationMs > 500
  });
};

/**
 * CloudWatch Insights saved queries
 */
const savedQueries = {
  errorsLastHour: `
    fields @timestamp, @message, level, error
    | filter level = "ERROR" or level = "CRITICAL"
    | stats count() as error_count by level
  `,
  slowQueries: `
    fields @timestamp, operation, durationMs
    | filter durationMs > 500
    | stats avg(durationMs) as avg_time, max(durationMs) as max_time, count() as query_count
  `,
  failedWebhooks: `
    fields @timestamp, webhookId, status, error
    | filter status != "success"
    | stats count() as failure_count by error
  `,
  authFailures: `
    fields @timestamp, email, ipAddress, attempt
    | filter attempt = "failed"
    | stats count() as failure_count by ipAddress
  `,
  emailDeliveryFailures: `
    fields @timestamp, recipient, status, reason
    | filter status = "failed"
    | stats count() as failure_count by reason
  `
};

module.exports = {
  createLogger,
  loggers,
  addRequestContext,
  logError,
  logPerformance,
  savedQueries,
  env,
  environment,
  appVersion
};
