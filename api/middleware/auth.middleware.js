const { verifyToken } = require('../utils/crypto');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware para validar JWT e sessão
 * Adiciona req.user e req.session ao request
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar sessão no banco
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    // Validar sessão
    if (!session) {
      return res.status(401).json({ error: 'Sessão não encontrada' });
    }

    if (!session.isValid) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    if (session.expiresAt < new Date()) {
      // Marcar como expirada
      await prisma.session.update({
        where: { id: session.id },
        data: { isValid: false }
      });
      return res.status(401).json({ error: 'Sessão expirada' });
    }

    // Adicionar user e session ao request
    req.user = session.user;
    req.session = session;

    logger.debug(`[AUTH] User autenticado: ${session.user.email}`);

    next();
  } catch (error) {
    logger.error('[AUTH] Erro ao validar autenticação', error);
    res.status(500).json({ error: 'Erro ao validar autenticação' });
  }
}

/**
 * Middleware para validar role/permissão
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.warn(
        `[AUTH] Acesso negado para ${req.user?.email} na rota ${req.path}`
      );
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    next();
  };
}

/**
 * Middleware para validar consentimento LGPD
 */
async function requireConsent(consentType = 'marketing') {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const hasConsent =
      consentType === 'marketing'
        ? user.consentMarketing
        : user.consentDataSharing;

    if (!hasConsent) {
      return res.status(403).json({
        error: 'Consentimento LGPD não fornecido',
        consentType
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requireConsent
};
