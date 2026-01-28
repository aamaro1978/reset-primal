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
    // Erros em arquivo separado
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // Todos os logs em arquivo geral
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Console log em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...meta }) => {
            let logString = `${timestamp} [${level}] ${message}`;
            if (Object.keys(meta).length > 0) {
              logString += ` ${JSON.stringify(meta)}`;
            }
            return logString;
          }
        )
      )
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
        stack: error.stack
      };
    }
    logger.error(message, logData);
  },
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta)
};

module.exports = log;
