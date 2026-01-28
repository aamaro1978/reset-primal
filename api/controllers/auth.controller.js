const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      // Registrar usuário
      const user = await authService.register(email, password, name);

      logger.info(`Novo registro: ${email}`);

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
      }

      // Fazer login
      const result = await authService.login(email, password, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Se requer 2FA
      if (result.requiresTwoFactor) {
        return res.json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      if (!req.session) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      await authService.logout(req.session.id);

      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token obrigatório'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email é obrigatório'
        });
      }

      await authService.requestPasswordReset(email);

      // Resposta genérica (não revelar se email existe)
      res.json({
        message: 'Se o email existe, enviaremos um link de recuperação'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retornar dados do usuário autenticado
   */
  async me(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      res.json({
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        createdAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
