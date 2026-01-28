const { prisma } = require('../config/database');
const {
  hashPassword,
  comparePasswords,
  createAuthTokens,
  generateVerificationCode
} = require('../utils/crypto');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Registrar novo usuário
   */
  async register(email, password, name) {
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const error = new Error('Email já cadastrado');
      error.statusCode = 409;
      throw error;
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'CUSTOMER',
        consentDate: new Date(),
        consentMarketing: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_registered',
        entity: 'user',
        entityId: user.id,
        ipAddress: null,
        userAgent: null
      }
    });

    logger.info(`Novo usuário registrado: ${email}`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  }

  /**
   * Login
   */
  async login(email, password, context = {}) {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      logger.warn(`Login falhou: usuário não encontrado ou sem senha - ${email}`);
      const error = new Error('Email ou senha inválidos');
      error.statusCode = 401;
      throw error;
    }

    // Validar senha
    const passwordValid = await comparePasswords(password, user.passwordHash);

    if (!passwordValid) {
      logger.warn(`Login falhou: senha inválida - ${email}`);
      const error = new Error('Email ou senha inválidos');
      error.statusCode = 401;
      throw error;
    }

    // Se 2FA ativo, retornar temp token (implementar depois)
    if (user.twoFactorEnabled) {
      const tempToken = await this.generateTwoFactorToken(user.id);
      return {
        requiresTwoFactor: true,
        tempToken,
        message: 'Código 2FA enviado'
      };
    }

    // Gerar tokens
    const tokens = createAuthTokens(user.id, user.email, user.role);

    // Criar sessão no banco
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        isValid: true
      }
    });

    // Atualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        entity: 'user',
        entityId: user.id,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null
      }
    });

    logger.info(`Login bem-sucedido: ${email}`);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      expiresAt: tokens.expiresAt
    };
  }

  /**
   * Logout
   */
  async logout(sessionId) {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isValid: false,
        revokedAt: new Date()
      }
    });

    logger.info(`Logout realizado: session ${sessionId}`);
  }

  /**
   * Renovar token via refresh token
   */
  async refreshToken(refreshToken) {
    // Buscar sessão
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || !session.isValid) {
      const error = new Error('Refresh token inválido');
      error.statusCode = 401;
      throw error;
    }

    // Gerar novos tokens
    const tokens = createAuthTokens(
      session.user.id,
      session.user.email,
      session.user.role
    );

    // Invalidar sessão antiga e criar nova
    await prisma.session.update({
      where: { id: session.id },
      data: {
        isValid: false,
        revokedAt: new Date()
      }
    });

    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isValid: true
      }
    });

    logger.info(`Token renovado: user ${session.user.email}`);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    };
  }

  /**
   * Gerar token temporário para 2FA (implementar depois)
   */
  async generateTwoFactorToken(userId) {
    // Placeholder para FASE 2
    const code = generateVerificationCode();
    return `temp_${code}`;
  }

  /**
   * Resetar senha (request)
   */
  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Não revelar se email existe (segurança)
      logger.warn(`Password reset solicitado para email não existente: ${email}`);
      return { success: true };
    }

    // TODO FASE 2: Gerar token único e enviar email
    logger.info(`Password reset solicitado: ${email}`);

    return { success: true };
  }
}

module.exports = new AuthService();
