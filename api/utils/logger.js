const winston = require('winston');
const { getEnv } = require('../config/env');

const logger = winston.createLogger({
  level: getEnv('LOG_LEVEL', 'info'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'reset-primal' },
  transports: [
    // Console log (works everywhere: dev, staging, production)
    new winston.transports.Console({
      format: winston.format.combine(
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ level, message, timestamp, ...meta }) => {
                let logString = `${timestamp} [${level}] ${message}`;
                if (Object.keys(meta).length > 0) {
                  logString += ` ${JSON.stringify(meta)}`;
                }
                return logString;
              })
            )
      ),
    }),
  ],
});

// File logging only in development (avoid permission issues in Docker)
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

// Funções de conveniência
const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, error = null, meta = {}) => {
    const logData = { ...meta };
    if (error instanceof Error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
      };
    }
    logger.error(message, logData);
  },
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
};

module.exports = log;
