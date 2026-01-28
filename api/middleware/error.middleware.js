const logger = require('../utils/logger');

/**
 * Error handling middleware
 * Deve ser registrado por ÚLTIMO na cadeia de middlewares do Express
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log do erro
  logger.error(`[${req.method}] ${req.path}`, err, {
    statusCode,
    headers: req.headers,
    ip: req.ip
  });

  // Resposta segura (nunca expor stack trace em produção)
  const response = {
    error: message,
    status: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Status codes específicos
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.details || err.message,
      status: 400
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Não autorizado',
      status: 401
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Acesso proibido',
      status: 403
    });
  }

  // Erro genérico
  res.status(statusCode).json(response);
}

// Wrapper para capturar erros em async controllers
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler
};
